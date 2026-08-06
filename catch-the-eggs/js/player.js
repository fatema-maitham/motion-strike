/* ==========================================
   Player (Farmer Character)
========================================== */

import { clamp, lerp } from "./utils.js";

const MOVE_SPEED = 500;
const FARMER_BASE_HEIGHT = 230;
const EXPRESSION_DURATION = 1.0;
const FARMER_BOTTOM_OFFSET = -2;
const DEBUG_CATCH_ZONE = false;
const HAND_LERP_SPEED = 0.15;

export class Player {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;

        this.scale = canvas.height / 720;

        const idleImg = assets.farmerIdle;
        const baseHeight = FARMER_BASE_HEIGHT * this.scale;

        if (idleImg && idleImg.naturalWidth > 0 && idleImg.naturalHeight > 0) {
            const ratio = idleImg.naturalWidth / idleImg.naturalHeight;
            this.height = baseHeight;
            this.width = baseHeight * ratio;
        } else {
            this.width = 120 * this.scale;
            this.height = baseHeight;
        }

        // Start at bottom-center
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - FARMER_BOTTOM_OFFSET;

        this.expression = "idle";
        this.expressionTimer = 0;

        this.keys = {
            left: false,
            right: false,
        };

        this.handTargetX = this.x;
        this.useHandControl = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);

    }

    // ==========================================
    //   Keyboard Input
    //   Pressing a key switches to KEYBOARD mode
    // ==========================================

    _onKeyDown(e) {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            this.keys.left = true;
            this.useHandControl = false; // keyboard takes over
        }

        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            this.keys.right = true;
            this.useHandControl = false; // keyboard takes over
        }
    }

    _onKeyUp(e) {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
            this.keys.left = false;
        }

        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
            this.keys.right = false;
        }
    }

    // ==========================================
    //   Hand Control
    //   Moving hand switches to HAND mode
    // ==========================================

    setHandPosition(handX, gameCanvasWidth) {
        const normalizedX = (handX / 640) * gameCanvasWidth;
        const newTarget = normalizedX - this.width / 2;

        // Only switch to hand control if hand actually moved a bit
        // prevents jitter overriding keyboard when hand is still
        if (Math.abs(newTarget - this.handTargetX) > 3) {
            this.useHandControl = true;
        }

        this.handTargetX = newTarget;
    }

    // ==========================================
    //   Expressions
    // ==========================================

    showHappy() {
        this.expression = "happy";
        this.expressionTimer = EXPRESSION_DURATION;
    }

    showSad() {
        this.expression = "sad";
        this.expressionTimer = EXPRESSION_DURATION;
    }

    // ==========================================
    //   Update
    // ==========================================

    update(dt) {
        // Keyboard control (only when NOT using hand)
        if (!this.useHandControl) {
            if (this.keys.left) {
                this.x -= MOVE_SPEED * dt;
            }
            if (this.keys.right) {
                this.x += MOVE_SPEED * dt;
            }
        } else {
            // Hand control with lerp for smoothness
            this.x = lerp(this.x, this.handTargetX, HAND_LERP_SPEED);
        }

        // Keep in bounds
        this.x = clamp(this.x, 0, this.canvas.width - this.width);

        // Expression timer
        if (this.expressionTimer > 0) {
            this.expressionTimer -= dt;
            if (this.expressionTimer <= 0) {
                this.expression = "idle";
                this.expressionTimer = 0;
            }
        }
    }

    // ==========================================
    //   Draw
    // ==========================================

    draw(ctx) {
        let img;

        if (this.expression === "happy") {
            img = this.assets.farmerHappy;
        } else if (this.expression === "sad") {
            img = this.assets.farmerSad;
        } else {
            img = this.assets.farmerIdle;
        }

        if (!img) {
            ctx.fillStyle = "#e67e22";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }

        this.drawCatchZone(ctx);
    }

    // ==========================================
    //   Basket Collision Box
    // ==========================================

    getBounds() {
        const catchWidth = this.width * 0.35;
        const catchHeight = 45 * this.scale;
        const bottomOffset = 40 * this.scale;

        return {
            x: this.x + (this.width - catchWidth) / 2,
            y: this.y + this.height - catchHeight - bottomOffset,
            width: catchWidth,
            height: catchHeight,
        };
    }

    // ==========================================
    //   Debug Catch Zone
    // ==========================================

    drawCatchZone(ctx) {
        if (!DEBUG_CATCH_ZONE) return;

        const bounds = this.getBounds();

        ctx.save();
        ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.restore();
    }

    // ==========================================
    //   Cleanup
    // ==========================================

    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
    }
}