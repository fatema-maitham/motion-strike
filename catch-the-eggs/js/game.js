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
        this.bgmVolume = 0.05;

        this.player = new Player(canvas, assets);

        this.effectManager = new EffectManager(assets);

        this.audio = new AudioManager(sounds);

        this.spawnSystem = new SpawnSystem(this.width, this.height, assets, this.effectManager);

        this.levelSystem = new LevelSystem();

        this.loop = this.loop.bind(this);

        this.hudScoreEl = null;
        this.hudHeartsEl = null;
    }

    start() {
        this.state = GAME_STATES.MENU;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
        this.hudScoreEl = document.getElementById("cteScore");
        this.hudHeartsEl = document.getElementById("cteHearts");
    }

    restart() {
        this.score = 0;
        this.lives = 3;

        // destroy old player to remove its keydown listeners
        if (this.player) {
            this.player.destroy();
        }

        this.player = new Player(this.canvas, this.assets);
        this.spawnSystem.reset();
        this.levelSystem.reset();
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now();

        if (this.sounds.bgm) {
            this.sounds.bgm.volume = this.bgmVolume;
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
                this.sounds.bgm.volume = this.bgmVolume;
                this.sounds.bgm.play().catch(e => console.log("BGM play blocked"));
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;

        if (this.player) {
            this.player.destroy();
        }

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
            this.player.useHandControl = true;
        } else {
            this.player.useHandControl = false;
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
        }

        this.updateHUD();
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
                    this.effectManager.spawnSparkles(
                        object.x + object.width / 2,
                        object.y + object.height / 2,
                        12
                    );
                }

                continue;
            }

            if (object.isOffScreen(this.height) && !object.missAlreadyProcessed) {
                object.missAlreadyProcessed = true;

                const result = getMissResult(object.type);

                this.score += result.scoreChange;
                this.lives += result.livesChange;

                this.applyReaction(result.reaction);

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

    updateHUD() {
        if (this.hudScoreEl) {
            this.hudScoreEl.textContent = this.score;
        }
        if (this.hudHeartsEl) {
            const hearts = this.hudHeartsEl.querySelectorAll("img");
            hearts.forEach((img, i) => {
                img.style.opacity = i < this.lives ? "1" : "0.2";
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawBackground();

        this.player.draw(this.ctx);

        this.spawnSystem.draw(this.ctx);

        this.effectManager.draw(this.ctx);

        this.updateHUD();

        this.drawOverlay();
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
            this.drawCenterText("CATCH THE EGGS", 48, -50);
            this.drawCenterText("Thumbs Up to Start", 26, 20);
            this.drawCenterText("or Press Enter", 22, 60);
        } else if (this.state === GAME_STATES.PAUSED) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawCenterText("PAUSED", 48, -50);
            this.drawCenterText("Peace Sign to Resume", 26, 20);
            this.drawCenterText("or Press P", 22, 60);
        } else if (this.state === GAME_STATES.GAME_OVER) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawCenterText("GAME OVER", 48, -80);
            this.drawCenterText(`Score: ${this.score}`, 34, -10);
            this.drawCenterText("Thumbs Up to Restart", 26, 55);
            this.drawCenterText("or Press Enter", 22, 95);
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