export type EmotionLabel = 'happy' | 'sad' | 'neutral';

export interface FaceEmotion {
  emotion: EmotionLabel;
  confidence: number;
  /** Raw blendshape scores — present only when DEBUG_EMOTION is true */
  debug?: { smile: number; frown: number; pucker: number; frownScore: number };
}

export type CameraPermission = 'prompt' | 'granted' | 'denied' | 'loading';

export interface EmotionMirrorState {
  /** Is MediaPipe still initialising? */
  isLoading: boolean;
  /** Camera permission state */
  cameraPermission: CameraPermission;
  /** Detected faces with their dominant emotion */
  faces: FaceEmotion[];
  /** Ref to attach to the <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Error message if something went wrong */
  error: string | null;
}
