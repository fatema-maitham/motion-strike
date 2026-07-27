/* ==========================================
   Utility Functions
========================================== */

export function loadAudio(src) {
    return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = () => {
            console.warn(`Could not load audio: ${src}`);
            resolve(null);
        };
        audio.src = src;
    });
}

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

/**
 * Loads a single image and returns a Promise.
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Loads multiple images from an object map.
 * Example:
 *   const images = await loadImages({
 *     bg: "assets/images/background.png",
 *     egg: "assets/images/egg.png"
 *   });
 */
export async function loadImages(sources) {
    const entries = Object.entries(sources);
    const results = await Promise.all(entries.map(([key, src]) => loadImage(src)));
    const output = {};
    entries.forEach(([key], index) => {
        output[key] = results[index];
    });
    return output;
}