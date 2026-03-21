import { useRef, useState, useEffect, useCallback, RefObject } from 'react';
import type { EmotionLabel, FaceEmotion, CameraPermission } from '../types/emotion';

// MediaPipe is loaded lazily — cached here after first load
let faceLandmarkerInstance: import('@mediapipe/tasks-vision').FaceLandmarker | null = null;
let initPromise: Promise<import('@mediapipe/tasks-vision').FaceLandmarker> | null = null;

async function getOrCreateFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'CPU',
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 2,
    });
    return faceLandmarkerInstance;
  })();

  return initPromise;
}

/** Extract dominant emotion from a set of MediaPipe blendshapes */
function classifyEmotion(
  blendshapes: Array<{ categoryName: string; score: number }>
): FaceEmotion {
  const get = (name: string) =>
    blendshapes.find((b) => b.categoryName === name)?.score ?? 0;

  const smileScore = (get('mouthSmileLeft') + get('mouthSmileRight')) / 2;

  // Sadness: two paths —
  //   1. Classic frown: mouth corners down + inner brow raise
  //   2. Pout: mouth corners down + lips pushed out (mouthPucker)
  // Taking the max means either expression triggers sad.
  const mouthFrown  = (get('mouthFrownLeft') + get('mouthFrownRight')) / 2;
  const browInnerUp = get('browInnerUp');
  const mouthPucker = get('mouthPucker');
  const frownScore  = Math.max(
    (mouthFrown + browInnerUp) / 2,                          // classic sad frown
    mouthFrown > 0.12 ? (mouthFrown + mouthPucker) / 2 : 0, // pout — only if corners also droop
    mouthFrown                                               // strong corner droop alone
  );

  if (smileScore > 0.25 && smileScore > frownScore) {
    return { emotion: 'happy', confidence: smileScore };
  }
  if (frownScore > 0.25 && frownScore >= smileScore) {
    return { emotion: 'sad', confidence: frownScore };
  }
  return { emotion: 'neutral', confidence: 1 - Math.max(smileScore, frownScore) };
}

/** 10-frame rolling buffer to smooth per-face emotion */
function createSmoothingBuffer(size = 10) {
  const buffers: EmotionLabel[][] = [[], []];
  return {
    push(faceIndex: number, emotion: EmotionLabel) {
      buffers[faceIndex].push(emotion);
      if (buffers[faceIndex].length > size) buffers[faceIndex].shift();
    },
    get(faceIndex: number): EmotionLabel {
      const buf = buffers[faceIndex];
      if (buf.length === 0) return 'neutral';
      const counts: Record<EmotionLabel, number> = { happy: 0, sad: 0, neutral: 0 };
      for (const e of buf) counts[e]++;
      return (Object.keys(counts) as EmotionLabel[]).reduce((a, b) =>
        counts[a] >= counts[b] ? a : b
      );
    },
    reset() {
      buffers[0] = [];
      buffers[1] = [];
    },
  };
}

interface UseEmotionMirrorOptions {
  active: boolean;
}

export function useEmotionMirror({ active }: UseEmotionMirrorOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const smoothing = useRef(createSmoothingBuffer(10));

  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('prompt');
  const [faces, setFaces] = useState<FaceEmotion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    smoothing.current.reset();
    setFaces([]);
  }, []);

  const processFrame = useCallback(
    (landmarker: import('@mediapipe/tasks-vision').FaceLandmarker) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => processFrame(landmarker));
        return;
      }

      const now = performance.now();
      // ~10 fps target inside the drawer
      if (now - lastFrameRef.current < 100) {
        rafRef.current = requestAnimationFrame(() => processFrame(landmarker));
        return;
      }
      lastFrameRef.current = now;

      try {
        const result = landmarker.detectForVideo(video, now);
        const detected: FaceEmotion[] = [];

        if (result.faceBlendshapes) {
          result.faceBlendshapes.forEach((blendshapeSet, i) => {
            const raw = classifyEmotion(blendshapeSet.categories);
            smoothing.current.push(i, raw.emotion);
            const smoothed = smoothing.current.get(i);
            detected.push({ emotion: smoothed, confidence: raw.confidence });
          });
        }

        setFaces(detected);
      } catch {
        // silently skip frame errors
      }

      rafRef.current = requestAnimationFrame(() => processFrame(landmarker));
    },
    []
  );

  useEffect(() => {
    if (!active) {
      stopAll();
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraPermission('granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const landmarker = await getOrCreateFaceLandmarker();
        if (cancelled) return;

        setIsLoading(false);
        processFrame(landmarker);
      } catch (err) {
        if (cancelled) return;
        const e = err as Error;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
        } else {
          console.error('[EmotionMirror]', e);
          setError(e.message || e.name || 'Failed to load face detection');
        }
        setIsLoading(false);
      }
    }

    setCameraPermission('loading');
    start();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [active, stopAll, processFrame]);

  return {
    videoRef: videoRef as RefObject<HTMLVideoElement | null>,
    isLoading,
    cameraPermission,
    faces,
    error,
  };
}
