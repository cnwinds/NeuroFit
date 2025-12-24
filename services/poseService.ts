import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

class PoseService {
    private poseLandmarker: PoseLandmarker | null = null;
    private initializing = false;
    private initPromise: Promise<PoseLandmarker> | null = null;

    async getPoseLandmarker(): Promise<PoseLandmarker> {
        if (this.poseLandmarker) return this.poseLandmarker;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );
                this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numPoses: 1
                });
                return this.poseLandmarker;
            } catch (error) {
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    async close() {
        if (this.poseLandmarker) {
            this.poseLandmarker.close();
            this.poseLandmarker = null;
            this.initPromise = null;
        }
    }
}

export const poseService = new PoseService();
