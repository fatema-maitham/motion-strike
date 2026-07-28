import { randomBetween } from "./utils.js";

const PIPE_SPEED = 180;
const PIPE_WIDTH = 64;
const PIPE_IMG_H = 512;
const PIPE_GAP = 180;

export class PipePair {
    constructor(canvasWidth, canvasHeight, assets) {
        this.assets = assets;
        this.canvasHeight = canvasHeight;

        this.x = canvasWidth;

        const minGap = 100;
        const maxGap = canvasHeight - PIPE_GAP - 100;
        const gapTop = randomBetween(minGap, maxGap);

        this.topHeight = gapTop;
        this.bottomY = gapTop + PIPE_GAP;
        this.bottomHeight = canvasHeight - this.bottomY;

        this.width = PIPE_WIDTH;
        this.scored = false;
    }

    update(dt) {
        this.x -= PIPE_SPEED * dt;
    }

    draw(ctx) {
        const topImg = this.assets.pipeTop;
        const bottomImg = this.assets.pipeBottom;

        if (topImg) {
            const imgW = topImg.naturalWidth;
            const imgH = topImg.naturalHeight;
            const sourceH = (this.topHeight / PIPE_IMG_H) * imgH;
            const sourceY = imgH - sourceH;

            ctx.drawImage(
                topImg,
                0, sourceY, imgW, sourceH,
                this.x, 0, this.width, this.topHeight
            );
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(this.x, 0, this.width, this.topHeight);
        }

        if (bottomImg) {
            const imgW = bottomImg.naturalWidth;
            const imgH = bottomImg.naturalHeight;
            const sourceH = (this.bottomHeight / PIPE_IMG_H) * imgH;

            ctx.drawImage(
                bottomImg,
                0, 0, imgW, sourceH,
                this.x, this.bottomY, this.width, this.bottomHeight
            );
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(this.x, this.bottomY, this.width, this.bottomHeight);
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getTopBounds() {
        return { x: this.x, y: 0, width: this.width, height: this.topHeight };
    }

    getBottomBounds() {
        return {
            x: this.x,
            y: this.bottomY,
            width: this.width,
            height: this.bottomHeight,
        };
    }
}