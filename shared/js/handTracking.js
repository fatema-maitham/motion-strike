/* ==========================================
   Shared Hand Tracking
   Used by all games
========================================== */

export class HandTracker {
    constructor() {
        this.video = document.getElementById("webcamVideo");
        this.canvas = document.getElementById("webcamCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.hands = null;
        this.camera = null;

        /* hand state */
        this.detected = false;
        this.landmarks = null;

        /* position */
        this.handX = 0;
        this.handY = 0;

        /* gesture states */
        this.currentGesture = null;
        this.previousGesture = null;

        /* wave tracking */
        this.waveHistory = [];
        this.prevHandX = 0;

        /* gesture callbacks */
        this.onGestureChange = null;
    }

    /* ==========================================
       Setup
    ========================================== */
    async setup() {
        try {
            if (
                typeof window.Hands === "undefined" ||
                typeof window.Camera === "undefined"
            ) {
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

    /* ==========================================
       Results
    ========================================== */
    onResults(results) {
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

        if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length > 0
        ) {
            this.detected = true;
            this.landmarks = results.multiHandLandmarks[0];

            this.handX = (1 - this.landmarks[9].x) * this.canvas.width;
            this.handY = this.landmarks[9].y * this.canvas.height;

            this.previousGesture = this.currentGesture;
            this.currentGesture = this.detectGesture(this.landmarks);

            // Wave override
            if (this.currentGesture === "OPEN_PALM") {
                this._checkWave();
            } else {
                this.waveHistory = [];
            }

            if (
                this.currentGesture !== this.previousGesture &&
                this.onGestureChange
            ) {
                this.onGestureChange(this.currentGesture, this.previousGesture);
            }

            this.drawLandmarks(this.landmarks);

        } else {
            this.detected = false;
            this.landmarks = null;
            this.currentGesture = null;
            this.previousGesture = null;
            this.waveHistory = [];
        }
    }

    /* ==========================================
       Gesture Detection (Order Matters!)
    ========================================== */
    detectGesture(landmarks) {
        if (this.isThumbsUp(landmarks)) return "THUMBS_UP";
        if (this.isPeaceSign(landmarks)) return "PEACE_SIGN";
        if (this.isOkGesture(landmarks)) return "OK";
        if (this.isPinch(landmarks)) return "PINCH";
        if (this.isOneFingerUp(landmarks)) return "ONE_FINGER";
        if (this.isClosedFist(landmarks)) return "CLOSED_FIST";
        if (this.isOpenPalm(landmarks)) return "OPEN_PALM";
        return "UNKNOWN";
    }

    isOpenPalm(landmarks) {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let extended = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y < landmarks[pips[i]].y) extended++;
        }
        return extended >= 3;
    }

    isClosedFist(landmarks) {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let folded = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) folded++;
        }
        return folded >= 3;
    }

    isThumbsUp(landmarks) {
        const thumbUp = landmarks[4].y < landmarks[3].y;
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let fingersFolded = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) fingersFolded++;
        }
        return thumbUp && fingersFolded >= 3;
    }

    isPeaceSign(landmarks) {
        const indexUp = landmarks[8].y < landmarks[6].y;
        const middleUp = landmarks[12].y < landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        const thumbDown = landmarks[4].y > landmarks[3].y;
        return indexUp && middleUp && ringDown && pinkyDown && thumbDown;
    }

    isOkGesture(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const middleUp = landmarks[12].y < landmarks[10].y;
        const ringUp = landmarks[16].y < landmarks[14].y;
        return dist < 0.05 && middleUp && ringUp;
    }

    isPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const middleDown = landmarks[12].y > landmarks[10].y;
        return dist < 0.05 && middleDown;
    }

    isOneFingerUp(landmarks) {
        const indexUp = landmarks[8].y < landmarks[6].y;
        const middleDown = landmarks[12].y > landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        return indexUp && middleDown && ringDown && pinkyDown;
    }

    /* ==========================================
       Wave Detection (Strict)
    ========================================== */
    _checkWave() {
        const now = Date.now();
        const delta = this.handX - this.prevHandX;
        let dir = 0;

        if (delta > 40) dir = 1;
        else if (delta < -40) dir = -1;

        if (dir !== 0) {
            const lastEntry = this.waveHistory[this.waveHistory.length - 1];
            if (!lastEntry || lastEntry.dir !== dir) {
                this.waveHistory.push({ time: now, dir: dir });
            }
        }

        this.waveHistory = this.waveHistory.filter(entry => now - entry.time < 1500);

        if (this.waveHistory.length >= 4) {
            this.currentGesture = "WAVE";
            this.waveHistory = [];
        }

        this.prevHandX = this.handX;
    }

    /* ==========================================
       Draw Landmarks
    ========================================== */
    drawLandmarks(landmarks) {
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

    /* ==========================================
       Public Getters
    ========================================== */
    isHandDetected() { return this.detected; }
    getHandX() { return this.handX; }
    getHandY() { return this.handY; }
    getCurrentGesture() { return this.currentGesture; }
    getPreviousGesture() { return this.previousGesture; }
}