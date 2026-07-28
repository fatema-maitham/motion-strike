import { HandTracker } from "../shared/js/handTracking.js";
import { GestureSystem } from "../shared/js/gestureSystem.js";

let handTracker, gestureSystem;
let activeIndex = 0;
const cards = document.querySelectorAll('.game-card');

window.addEventListener("DOMContentLoaded", async () => {

    // Setup Hand Tracking
    handTracker = new HandTracker();
    await handTracker.setup();

    gestureSystem = new GestureSystem(handTracker);

    // Thumbs Up: Launch the highlighted game
    gestureSystem.on("THUMBS_UP", () => {
        startGame(activeIndex);
    });

    // Mouse click fallback
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            startGame(index);
        });
    });

    // Loop to check hand position for selection
    setInterval(updateSelectionByHand, 100);
});

function updateSelectionByHand() {
    if (!handTracker.isHandDetected()) return;

    const handX = handTracker.getHandX();
    const cameraWidth = 640;

    // If hand is on left half of camera, select first game
    if (handX < cameraWidth / 2 && activeIndex !== 0) {
        activeIndex = 0;
        updateActiveCard();
    }
    // If hand is on right half, select second game
    else if (handX >= cameraWidth / 2 && activeIndex !== 1) {
        activeIndex = 1;
        updateActiveCard();
    }
}

function updateActiveCard() {
    cards.forEach((card, index) => {
        if (index === activeIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function startGame(index) {
    const gameUrl = cards[index].getAttribute('data-game');
    console.log("Launching game:", gameUrl);
    window.location.href = gameUrl;
}