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

// Set to true temporarily to show a live score overlay in the drawer
const DEBUG_EMOTION = true;

/** Extract dominant emotion from a set of MediaPipe blendshapes */
function classifyEmotion(
  blendshapes: Array<{ categoryName: string; score: number }>
): FaceEmotion {
  const get = (name: string) =>
    blendshapes.find((b) => b.categoryName === name)?.score ?? 0;

  // ── Happy ──────────────────────────────────────────────────────────────────
  const smileScore = (get('mouthSmileLeft') + get('mouthSmileRight')) / 2;

  // ── Sad ────────────────────────────────────────────────────────────────────
  // Two paths to sad, both require deliberate effort:
  //
  //  A) Pout-frown: corners down + lips pushed out (mouthPucker).
  //     The pucker gate stops people with a naturally downturned mouth.
  //
  //  B) Extreme frown alone: corners pulled SO far down that no pucker is
  //     needed. The 0.45 gate is well above any natural resting position,
  //     so only an intentional exaggerated frown clears it.
  const mouthFrown  = (get('mouthFrownLeft') + get('mouthFrownRight')) / 2;
  const mouthPucker = get('mouthPucker');

  const frownScore = Math.max(
    // Path A — pout combo
    (mouthFrown > 0.15 && mouthPucker > 0.08) ? (mouthFrown + mouthPucker) / 2 : 0,
    // Path B — extreme frown, no pucker required
    mouthFrown > 0.38 ? mouthFrown : 0,
  );

  // ── Classify ───────────────────────────────────────────────────────────────
  const debug = DEBUG_EMOTION ? { smile: smileScore, frown: mouthFrown, pucker: mouthPucker, frownScore } : undefined;

  if (smileScore > 0.28 && smileScore > frownScore) {
    return { emotion: 'happy', confidence: smileScore, debug };
  }
  if (frownScore > 0.25 && frownScore >= smileScore) {
    return { emotion: 'sad', confidence: frownScore, debug };
  }
  return { emotion: 'neutral', confidence: 1 - Math.max(smileScore, frownScore), debug };
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
  deviceId?: string;
}

export function useEmotionMirror({ active, deviceId }: UseEmotionMirrorOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const smoothing      = useRef(createSmoothingBuffer(8));
  const prevFaceCount  = useRef(0);

  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('prompt');
  const [faces, setFaces] = useState<FaceEmotion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

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
          const count = result.faceBlendshapes.length;

          // When the number of faces changes, face indices may refer to
          // different people than before — reset history so stale readings
          // from another person don't bleed into the new assignment.
          if (count !== prevFaceCount.current) {
            smoothing.current.reset();
            prevFaceCount.current = count;
          }

          result.faceBlendshapes.forEach((blendshapeSet, i) => {
            const raw = classifyEmotion(blendshapeSet.categories);
            smoothing.current.push(i, raw.emotion);
            const smoothed = smoothing.current.get(i);
            detected.push({ emotion: smoothed, confidence: raw.confidence, debug: raw.debug });
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
        const videoConstraint: MediaTrackConstraints = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'user' };
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraPermission('granted');

        // Enumerate cameras after permission is granted (labels are available now)
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setCameras(devices.filter((d) => d.kind === 'videoinput'));
        }

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
  }, [active, deviceId, stopAll, processFrame]);

  return {
    videoRef: videoRef as RefObject<HTMLVideoElement | null>,
    isLoading,
    cameraPermission,
    faces,
    cameras,
    error,
  };
}
