export class HandTracker {
    constructor() {
        this.video = document.getElementById("webcamVideo");
        this.canvas = document.getElementById("webcamCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.hands = null;
        this.camera = null;

        this.detected = false;
        this.flapSignal = false;

        /* previous state for edge detection */
        this.handWasOpen = false;
    }

    async setup() {
        try {
            if (typeof window.Hands === "undefined" ||
                typeof window.Camera === "undefined") {
                throw new Error("MediaPipe libraries not loaded.");
            }

            this.hands = new window.Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            this.hands.onResults(this.onResults.bind(this));

            this.camera = new window.Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 640,
                height: 480,
            });

            await this.camera.start();
            console.log("Hand tracking ready");
        } catch (err) {
            console.error("Hand tracking setup failed:", err);
        }
    }

    /* ---- gesture detection ---- */

    _isHandOpen(landmarks) {
        /*
         * Same logic as Python hand_controller.py:
         * Check 4 fingers (index, middle, ring, pinky)
         * If tip Y < pip Y → finger is extended
         * If 3+ fingers extended → hand is open
         */
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let extended = 0;

        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
                extended++;
            }
        }

        return extended >= 3;
    }

    onResults(results) {
        /* draw mirrored video */
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (results.image) {
            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(
                results.image,
                -this.canvas.width, 0,
                this.canvas.width, this.canvas.height
            );
            this.ctx.restore();
        }

        /* reset flap signal every frame */
        this.flapSignal = false;

        if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
        ) {
            this.detected = true;
            const landmarks = results.multiHandLandmarks[0];

            const handOpen = this._isHandOpen(landmarks);

            /*
             * FLAP LOGIC — exactly like Python:
             * 
             * Only flap on transition: ✊ Closed → ✋ Open
             * 
             * if hand_open and not self.hand_was_open:
             *     flap = True
             */
            if (handOpen && !this.handWasOpen) {
                this.flapSignal = true;
            }

            this.handWasOpen = handOpen;

            this._drawLandmarks(landmarks);
        } else {
            this.detected = false;
            this.handWasOpen = false;
        }
    }

    _drawLandmarks(landmarks) {
        this.ctx.fillStyle = "rgb(0, 255, 0)";
        this.ctx.strokeStyle = "rgb(0, 255, 0)";
        this.ctx.lineWidth = 2;

        for (const lm of landmarks) {
            const x = (1 - lm.x) * this.canvas.width;
            const y = lm.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    consumeFlap() {
        const v = this.flapSignal;
        this.flapSignal = false;
        return v;
    }

    isHandDetected() {
        return this.detected;
    }
}