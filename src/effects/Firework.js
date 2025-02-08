export class Firework {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.lifetime = 100;
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 / 50) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                alpha: 1,
                color: `hsl(${Math.random() * 360}, 50%, 50%)`
            });
        }
    }

    update() {
        this.lifetime--;
        this.particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.dy += 0.05;
            p.alpha -= 0.02;
        });
        return this.lifetime > 0;
    }

    draw(ctx) {
        this.particles.forEach(p => {
            if (p.alpha > 0) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;
    }
} 