export class GestureSystem {
    constructor(handTracker) {
        this.handTracker = handTracker;
        this.callbacks = {};
        this.enabled = true;

        this.lastGestureTime = {};
        this.gestureCooldown = 300;
        this.lastOpenPalmTime = 0;
        this.lastClosedFistTime = 0;

        this.handTracker.onGestureChange = (current, previous) => {
            this.handleGesture(current, previous);
        };
    }

    on(gesture, callback) {
        this.callbacks[gesture] = callback;
    }

    handleGesture(current, previous) {
        if (!this.enabled) return;

        const now = Date.now();
        const lastTime = this.lastGestureTime[current] || 0;

        // OPEN_PALM gets shorter cooldown so fast flapping works
        const cooldown = (current === "OPEN_PALM") ? 150 : this.gestureCooldown;

        if (now - lastTime < cooldown) {
            return;
        }

        this.lastGestureTime[current] = now;

        switch (current) {
            case "WAVE":
                console.log("Gesture: Wave - Return to Menu");
                this.callbacks["WAVE"]?.();
                break;

            case "THUMBS_UP":
                console.log("Gesture: Thumbs Up - Start Select");
                this.callbacks["THUMBS_UP"]?.();
                break;

            case "OK":
                console.log("Gesture: OK - Confirm");
                this.callbacks["OK"]?.();
                break;

            case "PEACE_SIGN":
                // Block if we just flapped (open or close hand)
                if (now - this.lastOpenPalmTime < 400) return;
                if (now - this.lastClosedFistTime < 400) return;
                console.log("Gesture: Peace Sign - Pause Resume");
                this.callbacks["PEACE_SIGN"]?.();
                break;

            case "PINCH":
                console.log("Gesture: Pinch - Mute Unmute");
                this.callbacks["PINCH"]?.();
                break;

            case "OPEN_PALM":
                this.lastOpenPalmTime = now;
                this.callbacks["OPEN_PALM"]?.();
                break;

            case "CLOSED_FIST":
                this.lastClosedFistTime = now;
                this.callbacks["CLOSED_FIST"]?.();
                break;

            case "ONE_FINGER":
                this.callbacks["ONE_FINGER"]?.();
                break;
        }
    }

    getCurrentGesture() {
        return this.handTracker.getCurrentGesture();
    }

    getPreviousGesture() {
        return this.handTracker.getPreviousGesture();
    }

    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
}