import { HandTracker } from "../shared/js/handTracking.js";
import { GestureSystem } from "../shared/js/gestureSystem.js";

let handTracker, gestureSystem;

window.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".game-card");
    const backBtn = document.getElementById("backBtn");

    handTracker = new HandTracker();
    gestureSystem = new GestureSystem(handTracker);

    function startGame(index) {
        const card = cards[index];
        if (!card) return;

        card.classList.add("selected");

        const gameUrl = card.getAttribute("data-game");

        setTimeout(() => {
            window.location.href = gameUrl;
        }, 250);
    }

    function goBack() {
        window.location.href = "index.html";
    }

    gestureSystem.on("ONE_FINGER", () => {
        startGame(0);
    });

    gestureSystem.on("PEACE_SIGN", () => {
        startGame(1);
    });

    gestureSystem.on("WAVE", () => {
        goBack();
    });

    cards.forEach((card, index) => {
        card.addEventListener("click", () => {
            startGame(index);
        });
    });

    backBtn.addEventListener("click", goBack);

    window.addEventListener("keydown", (e) => {
        if (e.code === "Escape") goBack();
        if (e.code === "Digit1") startGame(0);
        if (e.code === "Digit2") startGame(1);
    });

    handTracker.setup();
});