/* ==========================================
   Audio Manager
========================================== */

export class AudioManager {
    constructor(sounds) {
        this.sounds = sounds;
    }

    play(name) {
        const audio = this.sounds[name];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Audio play blocked until interaction"));
        }
    }
}