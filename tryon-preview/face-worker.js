// Camera frames never leave this worker/browser. Dependencies only are downloaded.
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs";
let detector;
let lastTimestamp = -1;
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      const files = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm");
      detector = await FaceLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO", numFaces: 1,
        minFaceDetectionConfidence: 0.55, minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: false
      });
      self.postMessage({ type: "ready" });
    } catch (error) { self.postMessage({ type: "error", message: String(error) }); }
  }
  if (data.type === "frame") {
    const { bitmap, timestamp, session } = data;
    try {
      if (!detector || timestamp <= lastTimestamp) {
        self.postMessage({ type: "result", session, landmarks: null }); return;
      }
      lastTimestamp = timestamp;
      const result = detector.detectForVideo(bitmap, timestamp);
      self.postMessage({
        type: "result", session,
        landmarks: result.faceLandmarks[0] || null,
        matrix: result.facialTransformationMatrixes[0]?.data || null
      });
    } catch (error) { self.postMessage({ type: "error", session, message: String(error) }); }
    finally { bitmap.close(); }
  }
};
