interface FaceDetectorOptions {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}

interface DetectedFace {
  boundingBox: DOMRectReadOnly;
}

declare class FaceDetector {
  constructor(options?: FaceDetectorOptions);
  detect(image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<DetectedFace[]>;
}
