const GRAVITY = 1250;
const FLAP_STRENGTH = -370;

export class Bird {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.assets = assets;

        this.width = 34;
        this.height = 24;

        this.x = 80;
        this.y = 640 / 2;

        this.vel = 0;
        this.angle = 0;
    }

    flap() {
        this.vel = FLAP_STRENGTH;
    }

    update(dt) {
        this.vel += GRAVITY * dt;
        this.y += this.vel * dt;

        this.angle = Math.min(Math.max(this.vel * 0.06, -25), 90);
    }

    draw(ctx) {
        const img = this.assets.bird;
        ctx.save();

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.angle * Math.PI) / 180);

        if (img) {
            ctx.drawImage(
                img,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }

    getBounds() {
        const pad = 4;
        return {
            x: this.x + pad,
            y: this.y + pad,
            width: this.width - pad * 2,
            height: this.height - pad * 2,
        };
    }

    isOutOfBounds(canvasHeight) {
        return this.y + this.height >= canvasHeight || this.y <= 0;
    }
}