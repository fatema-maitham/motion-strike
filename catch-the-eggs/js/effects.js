/* ==========================================
   Particle Effects
========================================== */

export class Particle {
    constructor(x, y, vx, vy, life, image) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.image = image;
        this.size = 40;
        this.alpha = 1;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.alpha = this.life / this.maxLife;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.drawImage(this.image, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }

    isDone() {
        return this.life <= 0;
    }
}

export class EffectManager {
    constructor(assets) {
        this.particles = [];
        this.assets = assets;
    }

    spawnSparkles(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 200 + Math.random() * 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            this.particles.push(new Particle(x, y, vx, vy, 0.8, this.assets.sparkle));
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => {
            p.update(dt);
            return !p.isDone();
        });
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }
}