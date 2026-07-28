import { loadImages, loadAudio, loadFont } from "./utils.js";
import { HandTracker } from "../../shared/js/handTracking.js";
import { GestureSystem } from "../../shared/js/gestureSystem.js";
import { Bird } from "./bird.js";
import { PipePair } from "./pipe.js";
import { birdHitPipe } from "./collision.js";

/* ---- settings ---- */
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const PIPE_INTERVAL = 2600;
const GRACE_FRAMES = 60;

/* ---- assets ---- */
const ASSET_SOURCES = {
    background: "assets/images/background.png",
    bird: "assets/images/flappy-bird.png",
    pipeTop: "assets/images/top-pipe.png",
    pipeBottom: "assets/images/bottom-pipe.png",
};

/* Sound sources */
const SOUND_SOURCES = {
    flap: "assets/sounds/flap.mp3",
    score: "assets/sounds/score.mp3",
    hit: "assets/sounds/hit.mp3"
};

/* ---- state ---- */
let canvas, ctx, assets;
let handTracker, gestureSystem;
let bird, pipes, score, frameCount;
let gameState = "MENU";
let lastTime = 0;
let pipeTimer = 0;
let flapReady = true;

/* Audio state */
let sounds = {};
let isMuted = false;

/*  Helper to play sounds safely */
function playSound(name) {
    if (isMuted || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => { });
}

/* ==========================================
   Boot
========================================== */
window.addEventListener("DOMContentLoaded", async () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    await document.fonts.load("12px 'Press Start 2P'");
    await document.fonts.load("10px 'Press Start 2P'");

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    resizeCanvas();

    assets = await loadImages(ASSET_SOURCES);

    /* Load Sounds */
    for (const [key, src] of Object.entries(SOUND_SOURCES)) {
        sounds[key] = await loadAudio(src);
    }

    handTracker = new HandTracker();
    await handTracker.setup();

    gestureSystem = new GestureSystem(handTracker);

    /* ---- Gestures ---- */
    gestureSystem.on("OPEN_PALM", () => {
        if (flapReady) {
            if (gameState === "PLAYING") {
                bird.flap();
                playSound("flap"); // 👈 Play flap sound
            } else if (gameState === "GAMEOVER" || gameState === "MENU") {
                resetGame();
            }
            flapReady = false;
        }
    });

    gestureSystem.on("CLOSED_FIST", () => {
        flapReady = true;
    });

    /* Mute Gesture */
    gestureSystem.on("PINCH", () => {
        isMuted = !isMuted;
        console.log("Audio Muted:", isMuted);
    });

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onTap);

    resetGame();
    lastTime = performance.now();
    requestAnimationFrame(loop);
});

/* ==========================================
   Canvas Sizing
========================================== */
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

/* ==========================================
   Reset
========================================== */
function resetGame() {
    bird = new Bird(canvas, assets);
    pipes = [];
    score = 0;
    frameCount = 0;
    pipeTimer = 0;
    flapReady = true;
    gameState = "PLAYING";
}

/* ==========================================
   Input
========================================== */
function onKey(e) {
    if (e.code === "Space" || e.code === "KeyR") {
        e.preventDefault();
        if (gameState === "PLAYING") {
            bird.flap();
            playSound("flap");
        } else if (gameState === "GAMEOVER") {
            resetGame();
        }
    }
}

function onTap() {
    if (gameState === "PLAYING") {
        bird.flap();
        playSound("flap");
    } else if (gameState === "GAMEOVER") {
        resetGame();
    }
}

/* ==========================================
   Game Loop
========================================== */
function loop(now) {
    let dt = (now - lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    lastTime = now;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

/* ==========================================
   Update
========================================== */
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
        if (
            bird.isOutOfBounds(GAME_HEIGHT) ||
            pipes.some(p => birdHitPipe(bird, p))
        ) {
            gameState = "GAMEOVER";
            playSound("hit"); // 👈 Play hit/death sound
        }
    }
}

/* ==========================================
   Draw
========================================== */
function draw() {
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (assets.background) {
        ctx.drawImage(assets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    for (const pipe of pipes) {
        pipe.draw(ctx);
    }

    bird.draw(ctx);
    drawHUD();
}

function drawHUD() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";

    ctx.font = "12px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 10);

    if (gameState === "PLAYING" && frameCount < GRACE_FRAMES) {
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("Get Ready!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    if (gameState === "GAMEOVER") {
        ctx.textAlign = "center";

        ctx.font = "12px 'Press Start 2P'";
        ctx.fillText("Game Over!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);

        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText("Score: " + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    }

    ctx.restore();
}