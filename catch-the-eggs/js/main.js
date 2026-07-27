import { loadImages, loadAudio } from "./utils.js";
import { Game } from "./game.js";
import { HandTracker } from "./handTracking.js";

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

function resizeCanvas(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.CATCHY = {
    assets: null,
    sounds: null,
    ready: false,
    game: null,
    handTracker: null,
};

window.addEventListener("DOMContentLoaded", async () => {
    try {
        const canvas = document.getElementById("gameCanvas");
        if (!canvas) return;

        resizeCanvas(canvas);

        const assets = await loadImages(ASSET_SOURCES);

        const sounds = {};
        for (const [key, src] of Object.entries(SOUND_SOURCES)) {
            sounds[key] = await loadAudio(src);
        }

        window.CATCHY.assets = assets;
        window.CATCHY.sounds = sounds;
        window.CATCHY.ready = true;

        const game = new Game(canvas, assets, sounds);
        window.CATCHY.game = game;

        const handTracker = new HandTracker();
        window.CATCHY.handTracker = handTracker;
        await handTracker.setup();

        // UNLOCK AUDIO ON FIRST USER INTERACTION
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

        game.start();
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