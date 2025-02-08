import { GAME_CONFIG } from '../config/constants.js';

export class Paddle {
    constructor() {
        this.width = GAME_CONFIG.PADDLE_WIDTH;
        this.height = GAME_CONFIG.PADDLE_HEIGHT;
        this.x = GAME_CONFIG.CANVAS_WIDTH/2 - this.width/2;
        this.y = GAME_CONFIG.CANVAS_HEIGHT - 30;
        this.speed = GAME_CONFIG.PADDLE_SPEED;
        this.color = 'blue';
    }

    moveLeft(globalSpeedMultiplier) {
        const currentSpeed = this.speed * globalSpeedMultiplier;
        if (this.x > 0) {
            this.x -= currentSpeed;
        }
    }

    moveRight(globalSpeedMultiplier) {
        const currentSpeed = this.speed * globalSpeedMultiplier;
        if (this.x < GAME_CONFIG.CANVAS_WIDTH - this.width) {
            this.x += currentSpeed;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    setWidth(width) {
        this.width = width;
        // Užtikrinti, kad platforma neišeitų už ekrano ribų
        if (this.x + this.width > GAME_CONFIG.CANVAS_WIDTH) {
            this.x = GAME_CONFIG.CANVAS_WIDTH - this.width;
        }
    }
} 