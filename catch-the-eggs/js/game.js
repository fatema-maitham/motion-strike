/* ==========================================
   Game Engine (Core)
========================================== */

import { Player } from "./player.js";
import { SpawnSystem } from "./egg.js";
import { LevelSystem } from "./levels.js";
import { EffectManager } from "./effects.js";
import { AudioManager } from "./audio.js";
import {
    playerCaughtObject,
    getCatchResult,
    getMissResult,
} from "./collision.js";

export const GAME_STATES = {
    MENU: "MENU",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER",
};

export class Game {
    constructor(canvas, assets, sounds) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.assets = assets;

        // Logical resolution
        this.width = canvas.width;
        this.height = canvas.height;

        // Game state
        this.state = GAME_STATES.MENU;

        // Time tracking
        this.lastTime = 0;
        this.deltaTime = 0;

        // Score and lives
        this.score = 0;
        this.lives = 3;
        this.isMuted = false;

        // Player
        this.player = new Player(canvas, assets);

        // Effects
        this.effectManager = new EffectManager(assets);

        // Audio
        this.audio = new AudioManager(sounds);

        // Falling objects
        this.spawnSystem = new SpawnSystem(this.width, this.height, assets, this.effectManager);

        // Level progression
        this.levelSystem = new LevelSystem();

        // Bind game loop
        this.loop = this.loop.bind(this);
    }

    // ==========================================
    // Start
    // ==========================================

    start() {
        console.log("Game engine started");
        this.state = GAME_STATES.MENU;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    // ==========================================
    // Game Controls (Restart, Pause, Resume, Mute)
    // ==========================================

    restart() {
        this.score = 0;
        this.lives = 3;
        this.player = new Player(this.canvas, this.assets);
        this.spawnSystem.reset();
        this.levelSystem.reset();
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now(); // Prevent time jump
    }

    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
        }
    }

    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.lastTime = performance.now(); // Prevent time jump
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        console.log("Audio muted:", this.isMuted);
    }

    // ==========================================
    // Resize (for responsive canvas)
    // ==========================================

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;

        this.player = new Player(this.canvas, this.assets);
        this.spawnSystem.resize(width, height);
    }

    // ==========================================
    // Game Loop
    // ==========================================

    loop(currentTime) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;

        // Prevent very large time jumps
        this.deltaTime = Math.min(this.deltaTime, 0.05);

        this.lastTime = currentTime;

        this.update(this.deltaTime);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    // ==========================================
    // Update
    // ==========================================

    update(dt) {
        // Freeze game if not playing
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        // Update level system
        this.levelSystem.update(dt);

        // Update spawn interval and fall speed based on level
        this.spawnSystem.spawnInterval = this.levelSystem.getSpawnInterval();
        this.spawnSystem.baseSpeed = this.levelSystem.getFallSpeed();

        // Get hand position from tracker
        const handTracker = window.CATCHY?.handTracker;
        if (handTracker && handTracker.isHandDetected()) {
            const handX = handTracker.getHandX();
            this.player.setHandPosition(handX, this.width);
        }

        // Update farmer
        this.player.update(dt);

        // Update falling objects
        this.spawnSystem.update(dt);

        // Update effects
        this.effectManager.update(dt);

        // Check catches and misses
        this.handleObjectInteractions();

        // End game when lives reach zero
        if (this.lives <= 0) {
            this.lives = 0;
            this.state = GAME_STATES.GAME_OVER;
            console.log("Game over");
        }
    }

    // ==========================================
    // Collision and Miss Handling
    // ==========================================

    handleObjectInteractions() {
        const remainingObjects = [];

        for (const object of this.spawnSystem.objects) {
            // Farmer caught the object
            if (playerCaughtObject(this.player, object)) {
                const result = getCatchResult(object.type);

                this.score += result.scoreChange;
                this.lives += result.livesChange;

                this.applyReaction(result.reaction);

                // Play sound (if not muted)
                if (!this.isMuted) {
                    if (object.type === "EGG" || object.type === "GOLDEN_EGG") {
                        this.audio.play("catchEgg");
                    } else if (object.type === "BOMB") {
                        this.audio.play("bomb");
                    }
                }

                // Spawn effect for golden egg
                if (object.type === "GOLDEN_EGG") {
                    this.effectManager.spawnSparkles(object.x + object.width / 2, object.y + object.height / 2, 12);
                }

                console.log(
                    `Caught ${object.type}. Score: ${this.score}, Lives: ${this.lives}`
                );

                continue;
            }

            // Object passed the bottom of the screen
            if (object.isOffScreen(this.height) && !object.missAlreadyProcessed) {
                object.missAlreadyProcessed = true;

                const result = getMissResult(object.type);

                this.score += result.scoreChange;
                this.lives += result.livesChange;

                this.applyReaction(result.reaction);

                console.log(
                    `Missed ${object.type}. Score: ${this.score}, Lives: ${this.lives}`
                );

                continue;
            }

            remainingObjects.push(object);
        }

        this.spawnSystem.objects = remainingObjects;
    }

    // ==========================================
    // Farmer Reaction
    // ==========================================

    applyReaction(reaction) {
        if (reaction === "happy") {
            this.player.showHappy();
        } else if (reaction === "sad") {
            this.player.showSad();
        }
    }

    // ==========================================
    // Draw
    // ==========================================

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.drawBackground();

        // Draw farmer
        this.player.draw(this.ctx);
        this.player.drawCatchZone(this.ctx);

        // Draw falling objects
        this.spawnSystem.draw(this.ctx);

        // Draw effects
        this.effectManager.draw(this.ctx);

        // Draw HUD
        this.drawHUD();

        // Draw Overlays (Menu, Pause, Game Over)
        this.drawOverlay();
    }

    // ==========================================
    // HUD (Score + Hearts on canvas)
    // ==========================================

    drawHUD() {
        const scale = this.height / 720;

        this.ctx.save();
        this.ctx.font = `${Math.round(40 * scale)}px "Pink Lemonade", sans-serif`;
        this.ctx.fillStyle = "#ffffff";
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        this.ctx.lineWidth = 5 * scale;
        this.ctx.textBaseline = "top";
        this.ctx.textAlign = "left";

        const scoreText = `Score: ${this.score}`;
        const leftPadding = 50 * scale;
        const scoreX = leftPadding;
        const scoreY = 20 * scale;

        this.ctx.strokeText(scoreText, scoreX, scoreY);
        this.ctx.fillText(scoreText, scoreX, scoreY);
        this.ctx.restore();

        const heartImg = this.assets.heart;
        const heartSize = 45 * scale;
        const heartGap = 8 * scale;
        const heartsY = 75 * scale;
        const heartsX = leftPadding;

        for (let i = 0; i < 3; i++) {
            const heartX = heartsX + i * (heartSize + heartGap);
            this.ctx.save();
            if (i >= this.lives) this.ctx.globalAlpha = 0.2;
            if (heartImg) {
                this.ctx.drawImage(heartImg, heartX, heartsY, heartSize, heartSize);
            } else {
                this.ctx.fillStyle = "#e74c3c";
                this.ctx.fillRect(heartX, heartsY, heartSize, heartSize);
            }
            this.ctx.restore();
        }
    }

    // ==========================================
    // Background
    // ==========================================

    drawBackground() {
        const background = this.assets.background;
        if (!background) {
            this.ctx.fillStyle = "#78b84a";
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }

        const bgWidth = background.naturalWidth;
        const bgHeight = background.naturalHeight;
        const bgRatio = bgWidth / bgHeight;
        const canvasRatio = this.width / this.height;

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (canvasRatio > bgRatio) {
            drawWidth = this.width;
            drawHeight = this.width / bgRatio;
            offsetY = (this.height - drawHeight) / 2;
        } else {
            drawHeight = this.height;
            drawWidth = this.height * bgRatio;
            offsetX = (this.width - drawWidth) / 2;
        }

        this.ctx.drawImage(background, offsetX, offsetY, drawWidth, drawHeight);
    }

    // ==========================================
    // Overlays (Menu, Pause, Game Over)
    // ==========================================

    drawOverlay() {
        if (this.state === GAME_STATES.MENU) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawCenterText("CATCH THE EGGS", 48, -40);
            this.drawCenterText("Thumbs Up to Start", 24, 40);
        } else if (this.state === GAME_STATES.PAUSED) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawCenterText("PAUSED", 48, -20);
            this.drawCenterText("Peace Sign to Resume", 24, 40);
        } else if (this.state === GAME_STATES.GAME_OVER) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawCenterText("GAME OVER", 48, -60);
            this.drawCenterText(`Score: ${this.score}`, 32, 10);
            this.drawCenterText("Thumbs Up to Restart", 24, 70);
        }
    }

    drawCenterText(text, size, yOffset = 0) {
        this.ctx.save();
        this.ctx.font = `${size}px "Pink Lemonade", sans-serif`;
        this.ctx.fillStyle = "#ffffff";
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.lineWidth = 4;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";

        const y = this.height / 2 + yOffset;
        this.ctx.strokeText(text, this.width / 2, y);
        this.ctx.fillText(text, this.width / 2, y);
        this.ctx.restore();
    }
}