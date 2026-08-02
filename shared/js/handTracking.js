export class HandTracker {
    constructor() {
        this.video = document.getElementById("webcamVideo");
        this.canvas = document.getElementById("webcamCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.hands = null;
        this.camera = null;

        this.detected = false;
        this.landmarks = null;

        this.handX = 0;
        this.handY = 0;

        this.currentGesture = null;
        this.previousGesture = null;

        this.waveHistory = [];
        this.prevHandX = 0;

        this.onGestureChange = null;

        this.lastFrameTime = 0;
        this.freezeCheckInterval = null;
        this.isSetupInProgress = false;

        this.gestureBadge = null;
        this.gestureBadgeTimer = null;
    }

    async setup() {
        if (this.isSetupInProgress) return;
        this.isSetupInProgress = true;

        try {
            if (typeof window.Hands === "undefined" || typeof window.Camera === "undefined") {
                throw new Error("MediaPipe libraries not loaded.");
            }

            this.hands = new window.Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.6,
            });

            this.hands.onResults(this.onResults.bind(this));

            await this._startCamera();

            if (this.freezeCheckInterval) clearInterval(this.freezeCheckInterval);
            this.freezeCheckInterval = setInterval(() => {
                this._checkFreeze();
            }, 2000);

            console.log("Hand tracking ready");
            this.isSetupInProgress = false;

        } catch (err) {
            console.error("Hand tracking setup failed:", err);
            this.isSetupInProgress = false;
            setTimeout(() => this.setup(), 3000);
        }
    }

    async _startCamera() {
        try {
            if (this.camera) {
                try { this.camera.stop(); } catch (e) { }
            }

            this.camera = new window.Camera(this.video, {
                onFrame: async () => {
                    try {
                        await this.hands.send({ image: this.video });
                        this.lastFrameTime = Date.now();
                    } catch (e) {
                        console.warn("Frame processing error:", e.message);
                    }
                },
                width: 640,
                height: 480,
            });

            await this.camera.start();
            this.lastFrameTime = Date.now();
            console.log("Camera started");

        } catch (err) {
            console.error("Camera start failed:", err);
            setTimeout(() => this._startCamera(), 3000);
        }
    }

    _checkFreeze() {
        const now = Date.now();
        const timeSinceLastFrame = now - this.lastFrameTime;
        if (this.lastFrameTime > 0 && timeSinceLastFrame > 3000) {
            console.warn("Camera frozen! Restarting...");
            this._startCamera();
        }
    }

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

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.detected = true;
            this.landmarks = results.multiHandLandmarks[0];

            this.handX = (1 - this.landmarks[9].x) * this.canvas.width;
            this.handY = this.landmarks[9].y * this.canvas.height;

            this.previousGesture = this.currentGesture;

            // Check wave FIRST using movement
            // If wave detected it overrides the shape-based gesture
            const waveDetected = this._checkWave();

            if (waveDetected) {
                this.currentGesture = "WAVE";
            } else {
                this.currentGesture = this.detectGesture(this.landmarks);
            }

            if (this.currentGesture !== this.previousGesture && this.onGestureChange) {
                this.onGestureChange(this.currentGesture, this.previousGesture);
                this._updateGestureBadge(this.currentGesture);
            }

            this.drawLandmarks(this.landmarks);
        } else {
            this.detected = false;
            this.landmarks = null;
            this.currentGesture = null;
            this.previousGesture = null;
            this.waveHistory = [];
            this.prevHandX = 0;
        }
    }

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
        const thumbUp = landmarks[4].y < landmarks[2].y;
        const thumbHighEnough = landmarks[4].y < landmarks[9].y;
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let fingersFolded = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) fingersFolded++;
        }
        return thumbUp && thumbHighEnough && fingersFolded >= 3;
    }

    isPeaceSign(landmarks) {
        const indexUp = landmarks[8].y < landmarks[5].y;
        const middleUp = landmarks[12].y < landmarks[9].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        const thumbFolded = landmarks[4].x > landmarks[3].x;
        return indexUp && middleUp && ringDown && pinkyDown && thumbFolded;
    }

    isOkGesture(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const middleUp = landmarks[12].y < landmarks[10].y;
        const ringUp = landmarks[16].y < landmarks[14].y;
        const pinkyUp = landmarks[20].y < landmarks[18].y;
        return dist < 0.05 && middleUp && ringUp && pinkyUp;
    }

    isPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];
        const indexMcp = landmarks[5];

        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        const indexReach = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
        const palmSize = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y);
        const indexExtended = indexReach > palmSize * 1.15;

        const middleDown = landmarks[12].y > landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;

        return dist < 0.06 && indexExtended && middleDown && ringDown && pinkyDown;
    }

    isOneFingerUp(landmarks) {
        const indexUp = landmarks[8].y < landmarks[6].y;
        const middleDown = landmarks[12].y > landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        return indexUp && middleDown && ringDown && pinkyDown;
    }

    _checkWave() {
        const now = Date.now();
        const delta = this.handX - this.prevHandX;
        let dir = 0;

        if (delta > 15) dir = 1;
        else if (delta < -15) dir = -1;

        if (dir !== 0) {
            const lastEntry = this.waveHistory[this.waveHistory.length - 1];
            if (!lastEntry || lastEntry.dir !== dir) {
                this.waveHistory.push({ time: now, dir });
                console.log("Wave entry:", dir, "total:", this.waveHistory.length);
            }
        }

        this.waveHistory = this.waveHistory.filter(e => now - e.time < 2000);

        if (this.waveHistory.length >= 4) {
            console.log("Wave detected!");
            this.waveHistory = [];
            this.prevHandX = this.handX;
            return true;
        }

        this.prevHandX = this.handX;
        return false;
    }

    _updateGestureBadge(gesture) {
        if (!this.gestureBadge) {
            this.gestureBadge = document.getElementById("gestureBadge");
        }
        if (!this.gestureBadge) return;

        const gestureLabels = {
            THUMBS_UP: "👍 Thumbs Up",
            PEACE_SIGN: "✌️ Peace Sign",
            OK: "👌 OK Sign",
            PINCH: "🤏 Pinch",
            ONE_FINGER: "☝️ One Finger",
            CLOSED_FIST: "✊ Closed Fist",
            OPEN_PALM: "✋ Open Palm",
            WAVE: "👋 Wave",
        };

        const label = gestureLabels[gesture];
        if (!label) return;

        this.gestureBadge.textContent = label;
        this.gestureBadge.classList.add("visible");

        if (this.gestureBadgeTimer) clearTimeout(this.gestureBadgeTimer);

        this.gestureBadgeTimer = setTimeout(() => {
            this.gestureBadge.classList.remove("visible");
        }, 1500);
    }

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

    destroy() {
        if (this.freezeCheckInterval) {
            clearInterval(this.freezeCheckInterval);
            this.freezeCheckInterval = null;
        }
        if (this.camera) {
            try { this.camera.stop(); } catch (e) { }
            this.camera = null;
        }
        if (this.hands) {
            try { this.hands.close(); } catch (e) { }
            this.hands = null;
        }
        if (this.video && this.video.srcObject) {
            try {
                this.video.srcObject.getTracks().forEach(track => track.stop());
                this.video.srcObject = null;
            } catch (e) { }
        }
        if (this.gestureBadgeTimer) clearTimeout(this.gestureBadgeTimer);
        console.log("HandTracker destroyed");
    }

    isHandDetected() { return this.detected; }
    getHandX() { return this.handX; }
    getHandY() { return this.handY; }
    getCurrentGesture() { return this.currentGesture; }
    getPreviousGesture() { return this.previousGesture; }
}