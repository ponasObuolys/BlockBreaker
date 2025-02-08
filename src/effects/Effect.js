export class Effect {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.lifetime = type === 'hit' ? 20 : 40;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        const particleCount = this.type === 'hit' ? 8 : 16;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = this.type === 'hit' ? 2 : 4;
            this.particles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                alpha: 1,
                size: this.type === 'hit' ? 2 : 3
            });
        }
    }

    update() {
        this.lifetime--;
        this.particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= this.type === 'hit' ? 0.05 : 0.025;
        });
        return this.lifetime > 0;
    }

    draw(ctx) {
        this.particles.forEach(p => {
            if (p.alpha > 0) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }
} 