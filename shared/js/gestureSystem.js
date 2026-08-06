export class GestureSystem {
    constructor(handTracker) {
        // Save the hand tracker we're listening to
        this.handTracker = handTracker;
        // Object that stores gesture callbacks { "THUMBS_UP": function, ... }
        this.callbacks = {};
        // Master switch to enable/disable all gesture actions
        this.enabled = true;

        // Track the last time each gesture was triggered (for cooldown)
        this.lastGestureTime = {};
        // Default cooldown in milliseconds (300ms)
        this.gestureCooldown = 300;
        // Special timestamps used to block accidental peace‑sign after a flap
        this.lastOpenPalmTime = 0;
        this.lastClosedFistTime = 0;

        // Subscribe to the hand tracker's gesture change event
        this.handTracker.onGestureChange = (current, previous) => {
            this.handleGesture(current, previous);
        };
    }

    // Register a callback for a specific gesture
    on(gesture, callback) {
        this.callbacks[gesture] = callback;
    }

    // Called whenever the hand tracker detects a new gesture
    handleGesture(current, previous) {
        if (!this.enabled) return; // ignore if disabled

        const now = Date.now();
        const lastTime = this.lastGestureTime[current] || 0;

        // Open palm uses a shorter cooldown (150ms) so fast flapping works
        const cooldown = (current === "OPEN_PALM") ? 150 : this.gestureCooldown;

        // If we triggered this gesture too recently, ignore it
        if (now - lastTime < cooldown) {
            return;
        }

        // Update the last trigger time for this gesture
        this.lastGestureTime[current] = now;

        // Decide what to do based on the gesture
        switch (current) {
            case "WAVE":
                this.callbacks["WAVE"]?.();
                break;

            case "THUMBS_UP":
                this.callbacks["THUMBS_UP"]?.();
                break;

            case "OK":
                this.callbacks["OK"]?.();
                break;

            case "PEACE_SIGN":
                // Prevent accidental pause right after flapping (open palm or closed fist)
                if (now - this.lastOpenPalmTime < 400) return;
                if (now - this.lastClosedFistTime < 400) return;
                this.callbacks["PEACE_SIGN"]?.();
                break;

            case "PINCH":
                this.callbacks["PINCH"]?.();
                break;

            case "OPEN_PALM":
                // Record the time for the peace‑sign block
                this.lastOpenPalmTime = now;
                this.callbacks["OPEN_PALM"]?.();
                break;

            case "CLOSED_FIST":
                // Record the time for the peace‑sign block
                this.lastClosedFistTime = now;
                this.callbacks["CLOSED_FIST"]?.();
                break;

            case "ONE_FINGER":
                this.callbacks["ONE_FINGER"]?.();
                break;
        }
    }

    // Get the current gesture directly from the hand tracker
    getCurrentGesture() {
        return this.handTracker.getCurrentGesture();
    }

    // Get the previous gesture directly from the hand tracker
    getPreviousGesture() {
        return this.handTracker.getPreviousGesture();
    }

    // Enable all gesture callbacks
    enable() { this.enabled = true; }

    // Disable all gesture callbacks (useful when showing menus)
    disable() { this.enabled = false; }
}