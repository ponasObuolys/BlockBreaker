import { POWERUPS, GAME_CONFIG } from '../config/constants.js';

export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.active = true;
    }

    update(globalSpeedMultiplier) {
        this.y += this.speed * globalSpeedMultiplier;
        return this.y < GAME_CONFIG.CANVAS_HEIGHT;
    }

    draw(ctx) {
        const config = POWERUPS[this.type];
        ctx.fillStyle = config.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.icon, this.x, this.y);
    }

    checkCollision(paddle) {
        return this.y + this.height/2 > paddle.y &&
               this.y - this.height/2 < paddle.y + paddle.height &&
               this.x + this.width/2 > paddle.x &&
               this.x - this.width/2 < paddle.x + paddle.width;
    }

    static shouldSpawn(currentPowerUps, maxPowerUps) {
        if (currentPowerUps >= maxPowerUps) {
            return false;
        }

        const minPowerUps = 3;
        const bonusChanceMultiplier = currentPowerUps < minPowerUps ? 2 : 1;

        for (const [type, config] of Object.entries(POWERUPS)) {
            if (Math.random() < config.chance * bonusChanceMultiplier) {
                return type;
            }
        }

        return null;
    }
} 