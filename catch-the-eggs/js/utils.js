/* ==========================================
   Utility Functions
========================================== */

/**
 * Returns a random number between min and max (inclusive of min, exclusive of max).
 */
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive).
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Keeps a number inside a min–max range.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 */
export function lerp(start, end, amount) {
    return start + (end - start) * amount;
}
