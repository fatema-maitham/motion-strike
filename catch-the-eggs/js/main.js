import { Game } from "./game.js";
import { HandTracker } from "../../shared/js/handTracking.js";
import { GestureSystem } from "../../shared/js/gestureSystem.js";

const ASSET_SOURCES = {
    background: "assets/images/background.png",
    egg: "assets/images/egg.png",
    goldenEgg: "assets/images/golden-egg.png",
    bomb: "assets/images/bomb.png",
    heart: "assets/images/heart.png",
    farmerIdle: "assets/images/farmer-idle.png",
    farmerHappy: "assets/images/farmer-happy.png",
    farmerSad: "assets/images/farmer-sad.png",
    sparkle: "assets/images/starparticleeffect.png",
};

const SOUND_SOURCES = {
    catchEgg: "assets/sounds/catch.wav",
    bomb: "assets/sounds/bomb.wav"
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

window.addEventListener("DOMContentLoaded", () => {
    try {
        const canvas = document.getElementById("gameCanvas");
        if (!canvas) return;

        resizeCanvas(canvas);

        // No waiting
        const assets = createImages(ASSET_SOURCES);
        const sounds = createSounds(SOUND_SOURCES);

        window.CATCHY.assets = assets;
        window.CATCHY.sounds = sounds;
        window.CATCHY.ready = true;

        const game = new Game(canvas, assets, sounds);
        window.CATCHY.game = game;

        const handTracker = new HandTracker();
        window.CATCHY.handTracker = handTracker;

        const gestureSystem = new GestureSystem(handTracker);

        gestureSystem.on("THUMBS_UP", () => {
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
            window.location.href = "../../index.html";
        });

        // Start immediately
        game.start();

        // Camera / hand tracking starts in background
        handTracker.setup();

        // Unlock audio on first user action
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
    } catch (error) {
        console.error("Failed to start game:", error);
    }
});

window.addEventListener("resize", () => {
    const canvas = document.getElementById("gameCanvas");
    const game = window.CATCHY?.game;

    if (!canvas || !game) return;

    resizeCanvas(canvas);
    game.resize(canvas.width, canvas.height);
});