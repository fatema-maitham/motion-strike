import { HandTracker } from "../../shared/js/handTracking.js";
import { GestureSystem } from "../../shared/js/gestureSystem.js";
import { Bird } from "./bird.js";
import { PipePair } from "./pipe.js";
import { birdHitPipe } from "./collision.js";

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const PIPE_INTERVAL = 2600;
const GRACE_FRAMES = 60;

const ASSET_SOURCES = {
    background: "assets/images/background.png",
    bird: "assets/images/flappy-bird.png",
    pipeTop: "assets/images/top-pipe.png",
    pipeBottom: "assets/images/bottom-pipe.png",
};

const SOUND_SOURCES = {
    flap: "assets/sounds/flap.mp3",
    score: "assets/sounds/score.mp3",
    hit: "assets/sounds/hit.mp3"
};

function createImages(sources) {
    const output = {};
    for (const [key, src] of Object.entries(sources)) {
        const img = new Image();
        img.src = src;
        output[key] = img;
    }
    return output;
}

function createSounds(sources) {
    const output = {};
    for (const [key, src] of Object.entries(sources)) {
        output[key] = new Audio(src);
    }
    return output;
}

let canvas, ctx, assets;
let handTracker, gestureSystem;
let bird, pipes, score, frameCount;
let gameState = "MENU";
let lastTime = 0;
let pipeTimer = 0;

let sounds = {};
let isMuted = false;

function playSound(name) {
    if (isMuted || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => { });
}

window.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    resizeCanvas();

    // No waiting
    assets = createImages(ASSET_SOURCES);
    sounds = createSounds(SOUND_SOURCES);

    handTracker = new HandTracker();
    gestureSystem = new GestureSystem(handTracker);

    gestureSystem.on("OPEN_PALM", () => {
        if (gameState === "PLAYING") {
            bird.flap();
            playSound("flap");
        } else if (gameState === "MENU" || gameState === "GAMEOVER") {
            resetGame();
        }
    });

    gestureSystem.on("THUMBS_UP", () => {
        if (gameState === "MENU" || gameState === "GAMEOVER") {
            resetGame();
        }
    });

    gestureSystem.on("PEACE_SIGN", () => {
        if (gameState === "PLAYING") {
            gameState = "PAUSED";
        } else if (gameState === "PAUSED") {
            gameState = "PLAYING";
            lastTime = performance.now();
        }
    });

    gestureSystem.on("PINCH", () => {
        isMuted = !isMuted;
        console.log("Audio muted:", isMuted);
    });

    gestureSystem.on("WAVE", () => {
        if (gameState === "PAUSED" || gameState === "MENU" || gameState === "GAMEOVER") {
            window.location.href = "../../index.html";
        }
    });

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onTap);

    // Start immediately
    gameState = "MENU";
    lastTime = performance.now();
    requestAnimationFrame(loop);

    // Camera / hand tracking starts in background
    handTracker.setup();

    const unlockAudio = () => {
        for (const audio of Object.values(sounds)) {
            if (audio) {
                audio.volume = 0;
                audio.play().catch(() => { });
                audio.pause();
                audio.volume = 0.7;
            }
        }
        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("touchstart", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);
});

function resizeCanvas() {
    const stage = document.querySelector(".game-stage");
    const maxW = stage.clientWidth - 40;
    const maxH = stage.clientHeight - 40;

    const ratio = GAME_WIDTH / GAME_HEIGHT;

    let dw = maxW;
    let dh = maxW / ratio;

    if (dh > maxH) {
        dh = maxH;
        dw = maxH * ratio;
    }

    canvas.style.width = Math.floor(dw) + "px";
    canvas.style.height = Math.floor(dh) + "px";
}

function resetGame() {
    bird = new Bird(canvas, assets);
    pipes = [];
    score = 0;
    frameCount = 0;
    pipeTimer = 0;
    gameState = "PLAYING";
    lastTime = performance.now();
}

function onKey(e) {
    if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "PLAYING") {
            bird.flap();
            playSound("flap");
        } else if (gameState === "MENU" || gameState === "GAMEOVER") {
            resetGame();
        }
    }

    if (e.code === "KeyP") {
        e.preventDefault();
        if (gameState === "PLAYING") {
            gameState = "PAUSED";
        } else if (gameState === "PAUSED") {
            gameState = "PLAYING";
            lastTime = performance.now();
        }
    }

    if (e.code === "KeyM") {
        isMuted = !isMuted;
        console.log("Audio muted:", isMuted);
    }
}

function onTap() {
    if (gameState === "PLAYING") {
        bird.flap();
        playSound("flap");
    } else if (gameState === "MENU" || gameState === "GAMEOVER") {
        resetGame();
    }
}

function loop(now) {
    let dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

function update(dt) {
    if (gameState !== "PLAYING") return;

    frameCount++;
    pipeTimer += dt * 1000;

    if (pipeTimer >= PIPE_INTERVAL) {
        pipeTimer = 0;
        pipes.push(new PipePair(GAME_WIDTH, GAME_HEIGHT, assets));
    }

    bird.update(dt);

    for (const pipe of pipes) {
        pipe.update(dt);

        if (!pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            score++;
            playSound("score");
        }
    }

    pipes = pipes.filter(p => !p.isOffScreen());

    if (frameCount > GRACE_FRAMES) {
        if (bird.isOutOfBounds(GAME_HEIGHT) || pipes.some(p => birdHitPipe(bird, p))) {
            gameState = "GAMEOVER";
            playSound("hit");
        }
    }
}

function draw() {
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (assets.background) {
        ctx.drawImage(assets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (gameState !== "MENU") {
        for (const pipe of pipes) {
            pipe.draw(ctx);
        }
        bird.draw(ctx);
    }

    drawHUD();
    drawOverlay();
}

function drawHUD() {
    if (gameState !== "PLAYING" && gameState !== "PAUSED") return;

    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 3;
    ctx.textBaseline = "top";

    ctx.font = "12px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.strokeText("Score: " + score, 10, 10);
    ctx.fillText("Score: " + score, 10, 10);

    if (gameState === "PLAYING" && frameCount < GRACE_FRAMES) {
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.strokeText("Get Ready!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText("Get Ready!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    ctx.restore();

    // Debug gesture
    if (handTracker) {
        const gesture = handTracker.getCurrentGesture();
        if (gesture) {
            ctx.save();
            ctx.font = "10px Arial";
            ctx.fillStyle = "yellow";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.strokeText("Gesture: " + gesture, 10, 30);
            ctx.fillText("Gesture: " + gesture, 10, 30);
            ctx.restore();
        }
    }
}

function drawOverlay() {
    if (gameState === "MENU") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawCenterText("FLAPPY BIRD", 14, -50);
        drawCenterText("Thumbs Up to Start", 8, 0);
        drawCenterText("or Press Space", 8, 30);
    } else if (gameState === "PAUSED") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawCenterText("PAUSED", 14, -20);
        drawCenterText("Peace Sign to Resume", 8, 20);
        drawCenterText("or Press P", 8, 50);
    } else if (gameState === "GAMEOVER") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        drawCenterText("GAME OVER", 14, -50);
        drawCenterText("Score: " + score, 12, 0);
        drawCenterText("Thumbs Up to Restart", 8, 40);
        drawCenterText("or Press Space", 8, 70);
    }
}

function drawCenterText(text, size, yOffset = 0) {
    ctx.save();
    ctx.font = `${size}px 'Press Start 2P'`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const y = GAME_HEIGHT / 2 + yOffset;
    ctx.strokeText(text, GAME_WIDTH / 2, y);
    ctx.fillText(text, GAME_WIDTH / 2, y);
    ctx.restore();
}