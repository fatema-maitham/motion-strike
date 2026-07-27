/* ==========================================
   Collision Detection
========================================== */

import { OBJECT_TYPES } from "./egg.js";

/**
 * Checks whether two rectangles overlap.
 */
export function rectanglesOverlap(first, second) {
    return (
        first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y
    );
}

/**
 * Checks collision between the farmer and a falling object.
 */
export function playerCaughtObject(player, fallingObject) {
    const playerBounds = player.getBounds();
    const objectBounds = fallingObject.getBounds();

    return rectanglesOverlap(playerBounds, objectBounds);
}

/**
 * Returns the result of catching an object.
 */
export function getCatchResult(type) {
    switch (type) {
        case OBJECT_TYPES.EGG:
            return {
                scoreChange: 1,
                livesChange: 0,
                reaction: "happy",
            };

        case OBJECT_TYPES.GOLDEN_EGG:
            return {
                scoreChange: 3,
                livesChange: 0,
                reaction: "happy",
            };

        case OBJECT_TYPES.BOMB:
            return {
                scoreChange: 0,
                livesChange: -1,
                reaction: "sad",
            };

        default:
            return {
                scoreChange: 0,
                livesChange: 0,
                reaction: "idle",
            };
    }
}

/**
 * Returns the result of missing an object.
 */
export function getMissResult(type) {
    switch (type) {
        case OBJECT_TYPES.EGG:
        case OBJECT_TYPES.GOLDEN_EGG:
            return {
                scoreChange: 0,
                livesChange: 0,
                reaction: "idle",
            };

        case OBJECT_TYPES.BOMB:
            return {
                scoreChange: 0,
                livesChange: 0,
                reaction: "idle",
            };

        default:
            return {
                scoreChange: 0,
                livesChange: 0,
                reaction: "idle",
            };
    }
}