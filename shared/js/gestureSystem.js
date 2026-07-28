/* ==========================================
   Shared Gesture System
   
   Handles platform-wide gestures:
   👍 Thumbs Up  → Start / Select
   👌 OK         → Confirm
   👋 Wave       → Return to Menu
   ✌️ Peace Sign → Pause / Resume
   🤏 Pinch      → Mute / Unmute Audio
   
   Each game imports this and passes
   the HandTracker instance
========================================== */

export class GestureSystem {
    constructor(handTracker) {
        this.handTracker = handTracker;
        this.callbacks = {};
        this.enabled = true;

        /* listen to gesture changes from hand tracker */
        this.handTracker.onGestureChange = (current, previous) => {
            this.handleGesture(current, previous);
        };
    }

    /* ==========================================
       Register Callbacks
       
       gestureSystem.on("THUMBS_UP", () => startGame())
       gestureSystem.on("PEACE_SIGN", () => pauseGame())
    ========================================== */
    on(gesture, callback) {
        this.callbacks[gesture] = callback;
    }


    /* ==========================================
       Handle Gesture
    ========================================== */
    handleGesture(current, previous) {
        if (!this.enabled) return;

        /* platform gestures */
        switch (current) {
            case "WAVE":
                console.log("Gesture: Wave → Return to Menu");
                this.callbacks["WAVE"]?.();
                break;
            case "THUMBS_UP":
                console.log("Gesture: Thumbs Up → Start / Select");
                this.callbacks["THUMBS_UP"]?.();
                break;

            case "OK":
                console.log("Gesture: OK → Confirm");
                this.callbacks["OK"]?.();
                break;

            case "PEACE_SIGN":
                console.log("Gesture: Peace Sign → Pause / Resume");
                this.callbacks["PEACE_SIGN"]?.();
                break;

            case "PINCH":
                console.log("Gesture: Pinch → Mute / Unmute");
                this.callbacks["PINCH"]?.();
                break;

            case "OPEN_PALM":
                this.callbacks["OPEN_PALM"]?.();
                break;

            case "CLOSED_FIST":
                this.callbacks["CLOSED_FIST"]?.();
                break;

            case "ONE_FINGER":
                this.callbacks["ONE_FINGER"]?.();
                break;
        }
    }

    /* ==========================================
       Enable / Disable
    ========================================== */
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
}