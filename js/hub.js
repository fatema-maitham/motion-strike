import { HandTracker } from "../shared/js/handTracking.js";
import { GestureSystem } from "../shared/js/gestureSystem.js";

let handTracker, gestureSystem;

window.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.game-card');

    handTracker = new HandTracker();
    gestureSystem = new GestureSystem(handTracker);

    // 1 Finger: Launch Game 1 (Catch the Eggs)
    gestureSystem.on("ONE_FINGER", () => {
        startGame(0);
    });

    // 2 Fingers (Peace Sign): Launch Game 2 (Flappy Bird)
    gestureSystem.on("PEACE_SIGN", () => {
        startGame(1);
    });

    // Mouse click fallback
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            startGame(index);
        });
    });

    // Start camera AFTER everything is set up
    handTracker.setup().then(() => {
        console.log("Hub: Hand tracking ready");
    });

    function startGame(index) {
        const gameUrl = cards[index].getAttribute('data-game');
        console.log("Launching game:", gameUrl);
        window.location.href = gameUrl;
    }
});