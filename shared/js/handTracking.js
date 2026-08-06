export class HandTracker {
    constructor() {
        // Grab the hidden video element that receives the camera feed
        this.video = document.getElementById("webcamVideo");
        // The visible canvas where we draw the mirrored camera + hand landmarks
        this.canvas = document.getElementById("webcamCanvas");
        this.ctx = this.canvas.getContext("2d");

        // MediaPipe Hands object (the AI model)
        this.hands = null;
        // MediaPipe Camera object (controls the webcam)
        this.camera = null;

        // Is a hand currently detected in the frame?
        this.detected = false;
        // The 21 landmarks of the detected hand (if any)
        this.landmarks = null;

        // Current hand position (mirrored, in canvas pixels)
        this.handX = 0;
        this.handY = 0;

        // Currently recognized gesture name (e.g. "OPEN_PALM")
        this.currentGesture = null;
        // Gesture name from the previous frame
        this.previousGesture = null;

        // Stores recent left/right direction changes to detect a wave
        this.waveHistory = [];
        // Previous hand X position used for wave detection
        this.prevHandX = 0;

        // Function called when the gesture changes (set by GestureSystem)
        this.onGestureChange = null;

        // Timestamp of the last processed camera frame (used to detect freezes)
        this.lastFrameTime = 0;
        // Interval that checks for camera freezes
        this.freezeCheckInterval = null;
        // Prevents setup() from running multiple times simultaneously
        this.isSetupInProgress = false;

        // Reference to the floating gesture badge in the DOM
        this.gestureBadge = null;
        // Timer to hide the gesture badge after a delay
        this.gestureBadgeTimer = null;
    }

    // ==========================================
    //   SETUP — start the camera and MediaPipe
    // ==========================================
    async setup() {
        // Don't start if already setting up
        if (this.isSetupInProgress) return;
        this.isSetupInProgress = true;

        try {
            // Make sure MediaPipe scripts have been loaded
            if (typeof window.Hands === "undefined" || typeof window.Camera === "undefined") {
                throw new Error("MediaPipe libraries not loaded.");
            }

            // Create the hand‑detection model
            this.hands = new window.Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            // Configure the model
            this.hands.setOptions({
                maxNumHands: 1,              // track only one hand
                modelComplexity: 1,          // faster, good enough for games
                minDetectionConfidence: 0.7, // how sure we need to be to say "hand detected"
                minTrackingConfidence: 0.6,  // lower threshold once we have a lock
            });

            // Tell the model what to do every time it returns a result
            this.hands.onResults(this.onResults.bind(this));

            // Start the camera
            await this._startCamera();

            // Check every 2 seconds if the camera has frozen
            if (this.freezeCheckInterval) clearInterval(this.freezeCheckInterval);
            this.freezeCheckInterval = setInterval(() => {
                this._checkFreeze();
            }, 2000);

            this.isSetupInProgress = false;

        } catch (err) {
            this.isSetupInProgress = false;
            // Retry after 3 seconds if something went wrong
            setTimeout(() => this.setup(), 3000);
        }
    }

    // ==========================================
    //   CAMERA — open the webcam and feed frames to MediaPipe
    // ==========================================
    async _startCamera() {
        try {
            // Stop any previous camera stream
            if (this.camera) {
                try { this.camera.stop(); } catch (e) { }
            }

            // Create a new camera that sends frames to the hidden video element
            this.camera = new window.Camera(this.video, {
                onFrame: async () => {
                    try {
                        // Send the current video frame to the hand model
                        await this.hands.send({ image: this.video });
                        // Remember when we got the last frame (for freeze detection)
                        this.lastFrameTime = Date.now();
                    } catch (e) {
                    }
                },
                width: 640,
                height: 480,
            });

            // Actually turn on the camera
            await this.camera.start();
            this.lastFrameTime = Date.now();

        } catch (err) {
            // Retry if camera access fails
            setTimeout(() => this._startCamera(), 3000);
        }
    }

    // ==========================================
    //   FREEZE DETECTION — restart the camera if it stops sending frames
    // ==========================================
    _checkFreeze() {
        const now = Date.now();
        const timeSinceLastFrame = now - this.lastFrameTime;
        // If no frame for more than 3 seconds, assume the camera froze
        if (this.lastFrameTime > 0 && timeSinceLastFrame > 3000) {
            this._startCamera();
        }
    }

    // ==========================================
    //   MAIN LOOP — called every time MediaPipe has a result
    // ==========================================
    onResults(results) {
        // Clear the canvas so we can draw the fresh frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the raw camera image MIRRORED (so it looks like a mirror)
        if (results.image) {
            this.ctx.save();
            this.ctx.scale(-1, 1); // flip horizontally
            this.ctx.drawImage(
                results.image,
                -this.canvas.width, 0, // shift the flipped image back into view
                this.canvas.width, this.canvas.height
            );
            this.ctx.restore();
        }

        // If a hand was found in this frame
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            this.detected = true;
            // Get the first hand's 21 landmarks
            this.landmarks = results.multiHandLandmarks[0];

            // Landmark 9 is the middle of the palm — use it as the hand position
            // Mirror the X coordinate so "left" means left on screen
            this.handX = (1 - this.landmarks[9].x) * this.canvas.width;
            this.handY = this.landmarks[9].y * this.canvas.height;

            // Remember the previous gesture before we compute the new one
            this.previousGesture = this.currentGesture;

            // First check if the user is waving (movement‑based detection)
            const waveDetected = this._checkWave();

            if (waveDetected) {
                // Wave overrides any static hand pose
                this.currentGesture = "WAVE";
            } else {
                // Detect a static hand pose
                this.currentGesture = this.detectGesture(this.landmarks);
            }

            // If the gesture just changed and we have a listener, notify it
            if (this.currentGesture !== this.previousGesture && this.onGestureChange) {
                this.onGestureChange(this.currentGesture, this.previousGesture);
                // Show the gesture name in the badge on screen
                this._updateGestureBadge(this.currentGesture);
            }

            // Draw the green landmark points on the canvas
            this.drawLandmarks(this.landmarks);
        } else {
            // No hand in view — reset everything
            this.detected = false;
            this.landmarks = null;
            this.currentGesture = null;
            this.previousGesture = null;
            this.waveHistory = [];
            this.prevHandX = 0;
        }
    }

    // ==========================================
    //   GESTURE DETECTION — identify the hand shape
    // ==========================================
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

    // ---- Individual gesture checks ----

    // Open palm: at least 3 fingers extended (tip above middle joint)
    isOpenPalm(landmarks) {
        const tips = [8, 12, 16, 20];   // index, middle, ring, pinky tips
        const pips = [6, 10, 14, 18];   // corresponding middle joints
        let extended = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y < landmarks[pips[i]].y) extended++;
        }
        return extended >= 3;
    }

    // Closed fist: at least 3 fingers curled (tip below middle joint)
    isClosedFist(landmarks) {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let folded = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) folded++;
        }
        return folded >= 3;
    }

    // Thumbs up: thumb tip above thumb base & wrist, other fingers folded
    isThumbsUp(landmarks) {
        const thumbUp = landmarks[4].y < landmarks[2].y;          // thumb tip above base
        const thumbHighEnough = landmarks[4].y < landmarks[9].y;  // thumb higher than palm center
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];
        let fingersFolded = 0;
        for (let i = 0; i < tips.length; i++) {
            if (landmarks[tips[i]].y > landmarks[pips[i]].y) fingersFolded++;
        }
        return thumbUp && thumbHighEnough && fingersFolded >= 3;
    }

    // Peace sign: index & middle extended, ring & pinky folded, thumb folded in
    isPeaceSign(landmarks) {
        const indexUp = landmarks[8].y < landmarks[5].y;
        const middleUp = landmarks[12].y < landmarks[9].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        const thumbFolded = landmarks[4].x > landmarks[3].x; // thumb pulled across palm
        return indexUp && middleUp && ringDown && pinkyDown && thumbFolded;
    }

    // OK gesture: thumb tip and index tip very close, other 3 fingers extended
    isOkGesture(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const middleUp = landmarks[12].y < landmarks[10].y;
        const ringUp = landmarks[16].y < landmarks[14].y;
        const pinkyUp = landmarks[20].y < landmarks[18].y;
        return dist < 0.05 && middleUp && ringUp && pinkyUp;
    }

    // Pinch: thumb tip and index tip very close, index extended, other 3 fingers folded
    isPinch(landmarks) {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];
        const indexMcp = landmarks[5];

        const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        // Check if the index finger is fully stretched out (not just slightly bent)
        const indexReach = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
        const palmSize = Math.hypot(indexMcp.x - wrist.x, indexMcp.y - wrist.y);
        const indexExtended = indexReach > palmSize * 1.15;

        const middleDown = landmarks[12].y > landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;

        return dist < 0.06 && indexExtended && middleDown && ringDown && pinkyDown;
    }

    // One finger up: index extended, other 3 folded
    isOneFingerUp(landmarks) {
        const indexUp = landmarks[8].y < landmarks[6].y;
        const middleDown = landmarks[12].y > landmarks[10].y;
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;
        return indexUp && middleDown && ringDown && pinkyDown;
    }

    // ==========================================
    //   WAVE DETECTION — detect a waving motion
    // ==========================================
    _checkWave() {
        const now = Date.now();
        const delta = this.handX - this.prevHandX;
        let dir = 0;

        // Determine direction of movement (15px threshold to ignore noise)
        if (delta > 15) dir = 1;   // moving right
        else if (delta < -15) dir = -1; // moving left

        // Only record when direction changes
        if (dir !== 0) {
            const lastEntry = this.waveHistory[this.waveHistory.length - 1];
            if (!lastEntry || lastEntry.dir !== dir) {
                this.waveHistory.push({ time: now, dir });
            }
        }

        // Remove entries older than 2 seconds
        this.waveHistory = this.waveHistory.filter(e => now - e.time < 2000);

        // If we have 4 direction changes within 2 seconds, it's a wave
        if (this.waveHistory.length >= 4) {
            this.waveHistory = [];
            this.prevHandX = this.handX;
            return true;
        }

        this.prevHandX = this.handX;
        return false;
    }

    // ==========================================
    //   GESTURE BADGE — show a small label on screen
    // ==========================================
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

        // Hide after 1.5 seconds
        if (this.gestureBadgeTimer) clearTimeout(this.gestureBadgeTimer);
        this.gestureBadgeTimer = setTimeout(() => {
            this.gestureBadge.classList.remove("visible");
        }, 1500);
    }

    // ==========================================
    //   DRAW LANDMARKS — show green dots on the hand
    // ==========================================
    drawLandmarks(landmarks) {
        this.ctx.fillStyle = "rgb(0, 255, 0)";
        this.ctx.strokeStyle = "rgb(0, 255, 0)";
        this.ctx.lineWidth = 2;

        for (const lm of landmarks) {
            // Mirror each landmark's x coordinate to match the mirrored video
            const x = (1 - lm.x) * this.canvas.width;
            const y = lm.y * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    // ==========================================
    //   CLEANUP — stop everything and release resources
    // ==========================================
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
    }

    // ==========================================
    //   PUBLIC GETTERS — used by games and gesture system
    // ==========================================
    isHandDetected() { return this.detected; }
    getHandX() { return this.handX; }
    getHandY() { return this.handY; }
    getCurrentGesture() { return this.currentGesture; }
    getPreviousGesture() { return this.previousGesture; }
}