/* ==========================================
   Hand Tracking with MediaPipe (Using Camera Utility)
========================================== */

export class HandTracker {
    constructor() {
        this.video = document.getElementById("webcamVideo");
        this.canvas = document.getElementById("webcamCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.hands = null;
        this.camera = null;
        this.handX = 0;
        this.handY = 0;
        this.detected = false;
    }

    async setup() {
        try {
            // Check for libraries
            if (typeof window.Hands === 'undefined' || typeof window.Camera === 'undefined') {
                throw new Error("MediaPipe libraries not loaded.");
            }

            // 1. Initialize Hands
            this.hands = new window.Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults(this.onResults.bind(this));

            // 2. Initialize Camera Utility (Handles the black screen loop)
            this.camera = new window.Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            console.log("Webcam started and Hand tracking initialized");

        } catch (error) {
            console.error("Failed to setup hand tracking:", error);
        }
    }

    onResults(results) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame
        if (results.image) {
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(results.image, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }

        // Draw landmarks
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.detected = true;
            const landmarks = results.multiHandLandmarks[0];

            // Track index finger base (point 9)
            this.handX = (1 - landmarks[9].x) * this.canvas.width;
            this.handY = landmarks[9].y * this.canvas.height;

            this.drawLandmarks(landmarks);
        } else {
            this.detected = false;
        }
    }

    drawLandmarks(landmarks) {
        this.ctx.fillStyle = "rgb(0, 255, 0)";
        this.ctx.strokeStyle = "rgb(0, 255, 0)";
        this.ctx.lineWidth = 2;

        for (const landmark of landmarks) {
            const x = (1 - landmark.x) * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
    }

    getHandX() { return this.handX; }
    isHandDetected() { return this.detected; }
}