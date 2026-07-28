import { loadImages, loadFont } from "./utils.js";
import { HandTracker } from "../../shared/js/handTracking.js";
import { GestureSystem } from "../../shared/js/gestureSystem.js";
import { Bird } from "./bird.js";
import { PipePair } from "./pipe.js";
import { birdHitPipe } from "./collision.js";

/* ---- settings — exact same as Python settings.py ---- */
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

/* ---- state ---- */
let canvas, ctx, assets;
let handTracker, gestureSystem;
let bird, pipes, score, frameCount;
let gameState = "MENU";
let lastTime = 0;
let pipeTimer = 0;
let flapReady = true;

/* ==========================================
   Boot
========================================== */
window.addEventListener("DOMContentLoaded", async () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    /* wait for Google Font to load */
    await document.fonts.load("12px 'Press Start 2P'");
    await document.fonts.load("10px 'Press Start 2P'");
    console.log("Font loaded:", document.fonts.check("12px 'Press Start 2P'"));

    /* set canvas internal size */
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    resizeCanvas();

    assets = await loadImages(ASSET_SOURCES);

    handTracker = new HandTracker();
    await handTracker.setup();

    gestureSystem = new GestureSystem(handTracker);

    gestureSystem.on("OPEN_PALM", () => {
        if (flapReady) {
            if (gameState === "PLAYING") {
                bird.flap();
            } else if (gameState === "GAMEOVER") {
                resetGame();
            }
            flapReady = false;
        }
    });

    gestureSystem.on("CLOSED_FIST", () => {
        flapReady = true;
    });

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onTap);

    resetGame();
    lastTime = performance.now();
    requestAnimationFrame(loop);
});

/* ==========================================
   Canvas Sizing
   
   Internal resolution is ALWAYS 360x640
   (exactly like Python settings.py)
   
   CSS scales it up visually
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
        } else if (gameState === "GAMEOVER") {
            resetGame();
        }
    }
}

function onTap() {
    if (gameState === "PLAYING") {
        bird.flap();
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

    /* spawn pipes */
    if (pipeTimer >= PIPE_INTERVAL) {
        pipeTimer = 0;
        pipes.push(new PipePair(GAME_WIDTH, GAME_HEIGHT, assets));
    }

    /* update bird */
    bird.update(dt);

    /* update pipes + scoring */
    for (const pipe of pipes) {
        pipe.update(dt);

        if (!pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            score++;
        }
    }

    /* remove off-screen pipes */
    pipes = pipes.filter(p => !p.isOffScreen());

    /* collision — grace period same as Python */
    if (frameCount > GRACE_FRAMES) {
        if (
            bird.isOutOfBounds(GAME_HEIGHT) ||
            pipes.some(p => birdHitPipe(bird, p))
        ) {
            gameState = "GAMEOVER";
        }
    }
}

/* ==========================================
   Draw
========================================== */
function draw() {
    /* keep pixel art sharp */
    ctx.imageSmoothingEnabled = true;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    /* background */
    if (assets.background) {
        ctx.drawImage(assets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    /* pipes */
    for (const pipe of pipes) {
        pipe.draw(ctx);
    }

    /* bird */
    bird.draw(ctx);

    /* HUD */
    drawHUD();
}

function drawHUD() {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "top";

    /* score */
    ctx.font = "12px 'Press Start 2P'";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 10);

    /* get ready */
    if (gameState === "PLAYING" && frameCount < GRACE_FRAMES) {
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("Get Ready!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    /* game over */
    if (gameState === "GAMEOVER") {
        ctx.textAlign = "center";

        ctx.font = "12px 'Press Start 2P'";
        ctx.fillText("Game Over!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);

        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText("Score: " + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
    }

    ctx.restore();
}