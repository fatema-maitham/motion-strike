/* ==========================================
   Shared Utility Functions
========================================== */

// Used to randomly place spawning objects (eggs, bombs, pipe gaps)
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Returns a random integer between min and max (inclusive)
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Used to keep the player inside the game canvas
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Used to smoothly move the player/basket toward the hand position
export function lerp(start, end, amount) {
    return start + (end - start) * amount;
}