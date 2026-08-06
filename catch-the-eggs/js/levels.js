/* ==========================================
   Difficulty Progression System
========================================== */

export class LevelSystem {
    constructor() {
        this.currentLevel = 1;
        this.timeElapsed = 0;
        this.levelUpInterval = 15;
        this.baseSpawnInterval = 1.5;
        this.baseSpeed = 250;
    }

    // ==========================================
    // Update time and check for level up
    // ==========================================

    update(dt) {
        this.timeElapsed += dt;

        const newLevel = Math.floor(this.timeElapsed / this.levelUpInterval) + 1;

        if (newLevel > this.currentLevel) {
            this.currentLevel = newLevel;
        }
    }

    // ==========================================
    // Get current spawn interval (faster as level increases)
    // ==========================================

    getSpawnInterval() {
        const reduction = (this.currentLevel - 1) * 0.15;
        return Math.max(0.6, this.baseSpawnInterval - reduction);
    }

    // ==========================================
    // Get current fall speed (faster as level increases)
    // ==========================================

    getFallSpeed() {
        const speedIncrease = (this.currentLevel - 1) * 50;
        return this.baseSpeed + speedIncrease;
    }

    // ==========================================
    // Get current level
    // ==========================================

    getLevel() {
        return this.currentLevel;
    }

    // ==========================================
    // Reset for new game
    // ==========================================

    reset() {
        this.currentLevel = 1;
        this.timeElapsed = 0;
    }
}