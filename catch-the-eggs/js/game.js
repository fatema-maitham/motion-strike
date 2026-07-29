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
        this.sounds = sounds;

        this.width = canvas.width;
        this.height = canvas.height;

        this.state = GAME_STATES.MENU;

        this.lastTime = 0;
        this.deltaTime = 0;

        this.score = 0;
        this.lives = 3;
        this.isMuted = false;

        this.player = new Player(canvas, assets);

        this.effectManager = new EffectManager(assets);

        this.audio = new AudioManager(sounds);

        this.spawnSystem = new SpawnSystem(this.width, this.height, assets, this.effectManager);

        this.levelSystem = new LevelSystem();

        this.loop = this.loop.bind(this);
        this.bgmVolume = 0.05;
    }

    start() {
        console.log("Game engine started");
        this.state = GAME_STATES.MENU;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }

    restart() {
        this.score = 0;
        this.lives = 3;
        this.player = new Player(this.canvas, this.assets);
        this.spawnSystem.reset();
        this.levelSystem.reset();
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now();

        if (this.sounds.bgm) {
            this.sounds.bgm.volume = 0.05;
            this.sounds.bgm.currentTime = 0;
            this.sounds.bgm.play().catch(e => console.log("BGM play blocked"));
        }
    }

    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;

            if (this.sounds.bgm) {
                this.sounds.bgm.pause();
            }
        }
    }

    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.lastTime = performance.now();

            if (this.sounds.bgm) {
                this.sounds.bgm.play().catch(e => console.log("BGM play blocked"));
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        console.log("Audio muted:", this.isMuted);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;

        this.player = new Player(this.canvas, this.assets);
        this.spawnSystem.resize(width, height);
    }

    loop(currentTime) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;

        this.deltaTime = Math.min(this.deltaTime, 0.05);

        this.lastTime = currentTime;

        this.update(this.deltaTime);
        this.draw();

        requestAnimationFrame(this.loop);
    }

    update(dt) {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }

        this.levelSystem.update(dt);

        this.spawnSystem.spawnInterval = this.levelSystem.getSpawnInterval();
        this.spawnSystem.baseSpeed = this.levelSystem.getFallSpeed();

        const handTracker = window.CATCHY?.handTracker;
        if (handTracker && handTracker.isHandDetected()) {
            const handX = handTracker.getHandX();
            this.player.setHandPosition(handX, this.width);
        }

        this.player.update(dt);

        this.spawnSystem.update(dt);

        this.effectManager.update(dt);

        this.handleObjectInteractions();

        if (this.lives <= 0) {
            this.lives = 0;
            this.state = GAME_STATES.GAME_OVER;

            if (this.sounds.bgm) {
                this.sounds.bgm.pause();
                this.sounds.bgm.currentTime = 0;
            }

            console.log("Game over");
        }
    }

    handleObjectInteractions() {
        const remainingObjects = [];

        for (const object of this.spawnSystem.objects) {
            if (playerCaughtObject(this.player, object)) {
                const result = getCatchResult(object.type);

                this.score += result.scoreChange;
                this.lives += result.livesChange;

                this.applyReaction(result.reaction);

                if (!this.isMuted) {
                    if (object.type === "EGG" || object.type === "GOLDEN_EGG") {
                        this.audio.play("catchEgg");
                    } else if (object.type === "BOMB") {
                        this.audio.play("bomb");
                    }
                }

                if (object.type === "GOLDEN_EGG") {
                    this.effectManager.spawnSparkles(object.x + object.width / 2, object.y + object.height / 2, 12);
                }

                console.log(
                    `Caught ${object.type}. Score: ${this.score}, Lives: ${this.lives}`
                );

                continue;
            }

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

    applyReaction(reaction) {
        if (reaction === "happy") {
            this.player.showHappy();
        } else if (reaction === "sad") {
            this.player.showSad();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawBackground();

        this.player.draw(this.ctx);
        this.player.drawCatchZone(this.ctx);

        this.spawnSystem.draw(this.ctx);

        this.effectManager.draw(this.ctx);

        this.drawHUD();

        this.drawOverlay();
    }

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

        const handTracker = window.CATCHY?.handTracker;
        if (handTracker) {
            const gesture = handTracker.getCurrentGesture();
            if (gesture) {
                this.ctx.font = "16px Arial";
                this.ctx.fillStyle = "yellow";
                this.ctx.strokeStyle = "black";
                this.ctx.lineWidth = 3;
                this.ctx.textAlign = "left";
                this.ctx.textBaseline = "top";
                this.ctx.strokeText("Gesture: " + gesture, 10, 40);
                this.ctx.fillText("Gesture: " + gesture, 10, 40);
            }
        }
    }

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