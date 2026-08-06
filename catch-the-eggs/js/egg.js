/* ==========================================
   Falling Objects (Egg, Golden Egg, Bomb)
========================================== */

import { randomBetween } from "./utils.js";

export const OBJECT_TYPES = {
    EGG: "EGG",
    GOLDEN_EGG: "GOLDEN_EGG",
    BOMB: "BOMB",
};

const OBJECT_CONFIG = {
    [OBJECT_TYPES.EGG]: { width: 60, height: 60 },
    [OBJECT_TYPES.GOLDEN_EGG]: { width: 60, height: 60 },
    [OBJECT_TYPES.BOMB]: { width: 80, height: 80 },
};

export class FallingObject {
    constructor(type, canvasWidth, canvasHeight, speed, assets, effectManager) {
        this.type = type;
        this.assets = assets;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.effectManager = effectManager; // Store effect manager

        const scale = canvasHeight / 720;
        const config = OBJECT_CONFIG[type];
        this.width = config.width * scale;
        this.height = config.height * scale;

        this.x = randomBetween(0, canvasWidth - this.width);
        this.y = -this.height;
        this.speed = speed;
        this.missAlreadyProcessed = false;

        this.trailTimer = 0; // Timer for trail effect

    }

    update(dt) {
        this.y += this.speed * dt;

        // Trail effect for Golden Egg
        if (this.type === OBJECT_TYPES.GOLDEN_EGG && this.effectManager) {
            this.trailTimer += dt;
            if (this.trailTimer > 0.1) { // Spawn every 0.1 seconds
                this.effectManager.spawnSparkles(this.x + this.width / 2, this.y + this.height / 2, 1);
                this.trailTimer = 0;
            }
        }
    }

    isOffScreen(canvasHeight) {
        return this.y > canvasHeight;
    }

    draw(ctx) {
        let img = null;
        if (this.type === OBJECT_TYPES.EGG) img = this.assets.egg;
        else if (this.type === OBJECT_TYPES.GOLDEN_EGG) img = this.assets.goldenEgg;
        else if (this.type === OBJECT_TYPES.BOMB) img = this.assets.bomb;

        if (!img) {
            ctx.fillStyle = this.type === OBJECT_TYPES.BOMB ? "#e74c3c" : this.type === OBJECT_TYPES.GOLDEN_EGG ? "#f1c40f" : "#ffffff";
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}

export class SpawnSystem {
    constructor(canvasWidth, canvasHeight, assets, effectManager) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.assets = assets;
        this.effectManager = effectManager; // Store effect manager
        this.objects = [];
        this.spawnInterval = 1.5;
        this.spawnTimer = 0;
        this.baseSpeed = 250;
    }

    _pickType() {
        const roll = Math.random();
        if (roll < 0.55) return OBJECT_TYPES.EGG;
        else if (roll < 0.80) return OBJECT_TYPES.GOLDEN_EGG;
        else return OBJECT_TYPES.BOMB;
    }

    _spawnOne() {
        const type = this._pickType();
        const obj = new FallingObject(
            type,
            this.canvasWidth,
            this.canvasHeight,
            this.baseSpeed,
            this.assets,
            this.effectManager // Pass effect manager
        );
        this.objects.push(obj);
    }

    update(dt) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnOne();
        }
        for (const obj of this.objects) {
            obj.update(dt);
        }
    }

    draw(ctx) {
        for (const obj of this.objects) {
            obj.draw(ctx);
        }
    }

    reset() {
        this.objects = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.baseSpeed = 250;
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
}