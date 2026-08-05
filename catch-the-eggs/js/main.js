import { Game } from "./game.js";
import { HandTracker } from "../../shared/js/handTracking.js";
import { GestureSystem } from "../../shared/js/gestureSystem.js";

const ASSET_SOURCES = {
    background: "assets/images/background.png",
    egg: "assets/images/egg.png",
    goldenEgg: "assets/images/golden-egg.png",
    bomb: "assets/images/bomb.png",
    heart: "assets/images/heart.png",
    farmerIdle: "assets/images/farmer-Idle.png",
    farmerHappy: "assets/images/farmer-happy.png",
    farmerSad: "assets/images/farmer-sad.png",
    sparkle: "assets/images/starparticleeffect.png",
};

const SOUND_SOURCES = {
    catchEgg: "assets/sounds/catch.wav",
    bomb: "assets/sounds/bomb.wav",
    bgm: "assets/sounds/bgm.mp3"
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
        const audio = new Audio(src);
        if (key === "bgm") audio.loop = true;
        output[key] = audio;
    }
    return output;
}

function resizeCanvas(canvas) {
    const stage = document.querySelector(".game-stage");
    const maxW = stage.clientWidth - 150;
    const maxH = stage.clientHeight - 150;

    const ratio = 16 / 10;

    let dw = maxW;
    let dh = maxW / ratio;

    if (dh > maxH) {
        dh = maxH;
        dw = maxH * ratio;
    }

    canvas.width = Math.floor(dw);
    canvas.height = Math.floor(dh);
    canvas.style.width = Math.floor(dw) + "px";
    canvas.style.height = Math.floor(dh) + "px";
}

window.CATCHY = {
    assets: null,
    sounds: null,
    ready: false,
    game: null,
    handTracker: null,
};

// ==========================================
//   AUDIO UNLOCK
// ==========================================
let audioUnlocked = false;

function unlockAudio(sounds) {
    if (audioUnlocked) return;
    audioUnlocked = true;

    for (const audio of Object.values(sounds)) {
        if (!audio) continue;
        audio.volume = 0;
        audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
        }).catch(() => { });
    }

    if (sounds.bgm) sounds.bgm.volume = 0.05;
    if (sounds.catchEgg) sounds.catchEgg.volume = 1.0;
    if (sounds.bomb) sounds.bomb.volume = 1.0;
}

window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    if (!canvas) return;

    resizeCanvas(canvas);

    const assets = createImages(ASSET_SOURCES);
    const sounds = createSounds(SOUND_SOURCES);

    window.CATCHY.assets = assets;
    window.CATCHY.sounds = sounds;
    window.CATCHY.ready = true;

    const game = new Game(canvas, assets, sounds);
    window.CATCHY.game = game;

    game.start();

    // ==========================================
    //   BACK BUTTON
    // ==========================================
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.blur();
        backBtn.addEventListener("mousedown", (e) => {
            e.preventDefault();
        });
        backBtn.addEventListener("click", () => {
            backBtn.blur();
            if (
                game.state === "PAUSED" ||
                game.state === "MENU" ||
                game.state === "GAME_OVER"
            ) {
                window.location.href = "../games.html";
            }
        });
    }

    // ==========================================
    //   KEYBOARD
    // ==========================================
    window.addEventListener("keydown", (e) => {
        const key = e.key;
        const code = e.code;

        try { unlockAudio(sounds); } catch (err) { }

        // Always use the global game reference
        const g = window.CATCHY?.game;
        if (!g) return;

        // ENTER (any) or SPACE → Start / Restart
        if ((key === "Enter" || code === "Enter" || code === "NumpadEnter" || key === " ") &&
            (g.state === "MENU" || g.state === "GAME_OVER")) {
            e.preventDefault();
            g.restart();
            return;
        }

        if ((key === "p" || key === "P")) {
            e.preventDefault();
            if (g.state === "PLAYING") g.pause();
            else if (g.state === "PAUSED") g.resume();
            return;
        }

        if (key === "m" || key === "M") {
            g.toggleMute();
            return;
        }

        if (key === "Escape") {
            if (g.state === "PAUSED" || g.state === "MENU" || g.state === "GAME_OVER") {
                window.location.href = "../games.html";
            }
        }
    });

    // ==========================================
    //   MOUSE AND TOUCH UNLOCK
    // ==========================================
    document.addEventListener("click", () => {
        try { unlockAudio(sounds); } catch (err) { }
    });
    document.addEventListener("touchstart", () => {
        try { unlockAudio(sounds); } catch (err) { }
    });

    // ==========================================
    //   HAND TRACKING
    // ==========================================
    try {
        const handTracker = new HandTracker();
        window.CATCHY.handTracker = handTracker;

        const gestureSystem = new GestureSystem(handTracker);

        gestureSystem.on("THUMBS_UP", () => {
            try { unlockAudio(sounds); } catch (err) { }
            if (game.state === "MENU" || game.state === "GAME_OVER") {
                game.restart();
            }
        });

        gestureSystem.on("PEACE_SIGN", () => {
            if (game.state === "PLAYING") {
                game.pause();
            } else if (game.state === "PAUSED") {
                game.resume();
            }
        });

        gestureSystem.on("PINCH", () => {
            game.toggleMute();
        });

        gestureSystem.on("WAVE", () => {
            if (
                game.state === "PAUSED" ||
                game.state === "MENU" ||
                game.state === "GAME_OVER"
            ) {
                window.location.href = "../games.html";
            }
        });

        handTracker.setup();

        // How to Play panel gesture controls
        gestureSystem.on("OK", () => {
            try { unlockAudio(sounds); } catch (err) { }
            const panel = document.getElementById("howToPlayPanel");
            if (!panel) return;

            if (panel.classList.contains("hidden")) {
                // Only open when not playing
                if (game.state === "MENU" || game.state === "GAME_OVER" || game.state === "PAUSED") {
                    panel.classList.remove("hidden");
                }
            } else {
                panel.classList.add("hidden");
            }
        });
    } catch (error) {
        console.error("Hand tracking failed, keyboard still works:", error);
    }
});

// ==========================================
//   RESIZE
// ==========================================
window.addEventListener("resize", () => {
    const canvas = document.getElementById("gameCanvas");
    const game = window.CATCHY?.game;

    if (!canvas || !game) return;

    resizeCanvas(canvas);
    game.resize(canvas.width, canvas.height);
});