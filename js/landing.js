import { HandTracker } from "../shared/js/handTracking.js";
import { GestureSystem } from "../shared/js/gestureSystem.js";

let handTracker, gestureSystem;
let panelOpen = false;

window.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("playBtn");
    const howToPlayBtn = document.getElementById("howToPlayBtn");
    const closePanelBtn = document.getElementById("closePanelBtn");
    const panel = document.getElementById("howToPlayPanel");

    handTracker = new HandTracker();
    gestureSystem = new GestureSystem(handTracker);

    function openPanel() {
        panel.classList.remove("hidden");
        panelOpen = true;
    }

    function closePanel() {
        panel.classList.add("hidden");
        panelOpen = false;
    }

    function goToGames() {
        playBtn.classList.add("selected");
        setTimeout(() => {
            window.location.href = "games.html";
        }, 250);
    }

    gestureSystem.on("THUMBS_UP", () => {
        if (panelOpen) {
            closePanel();
            return;
        }
        goToGames();
    });

    gestureSystem.on("OK", () => {
        if (!panelOpen) {
            openPanel();
        }
    });

    gestureSystem.on("WAVE", () => {
        if (panelOpen) {
            closePanel();
        }
    });

    playBtn.addEventListener("click", goToGames);
    howToPlayBtn.addEventListener("click", openPanel);
    closePanelBtn.addEventListener("click", closePanel);

    panel.addEventListener("click", (e) => {
        if (e.target === panel) {
            closePanel();
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Escape" && panelOpen) {
            closePanel();
        }
        if (e.code === "Enter" && !panelOpen) {
            goToGames();
        }
    });

    handTracker.setup();
});