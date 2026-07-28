/* ==========================================
   Shared Utility Functions
========================================== */

/**
 * Load a single image
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
 * Load multiple images from an object map
 * const assets = await loadImages({ bg: "assets/images/bg.png" })
 */
export async function loadImages(sources) {
    const entries = Object.entries(sources);
    const results = await Promise.all(
        entries.map(([key, src]) => loadImage(src))
    );
    const output = {};
    entries.forEach(([key], index) => {
        output[key] = results[index];
    });
    return output;
}

/**
 * Load a single audio file
 */
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
 * Random number between min and max
 */
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max inclusive
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

/**
 * Load a font and add it to the document
 * await loadFont("bit5x3", "../../shared/fonts/bit5x3.ttf")
 */
export async function loadFont(name, path) {
    try {
        const font = new FontFace(name, `url(${path})`);
        await font.load();
        document.fonts.add(font);
        console.log(`Font loaded: ${name}`);
        return true;
    } catch (e) {
        console.error(`Font failed to load: ${name}`, e);
        return false;
    }
}