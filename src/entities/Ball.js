import { GAME_CONFIG } from '../config/constants.js';
import { AudioManager } from '../managers/audio/AudioManager.js';

export class Ball {
    constructor(x, y, isStuck = true) {
        this.x = x;
        this.y = y;
        this.radius = GAME_CONFIG.BALL_RADIUS;
        this.baseSpeed = GAME_CONFIG.BALL_SPEED;
        this.currentSpeed = GAME_CONFIG.BALL_SPEED;
        this.dx = GAME_CONFIG.BALL_SPEED;
        this.dy = -GAME_CONFIG.BALL_SPEED;
        this.color = 'red';
        this.stuck = isStuck;
        this.explosive = false;
        
        // Garso valdiklis
        this.audioManager = AudioManager.getInstance();
    }

    update(paddle, globalSpeedMultiplier) {
        if (this.stuck) {
            this.x = paddle.x + paddle.width/2;
            this.y = paddle.y - this.radius;
            return true;
        }

        const currentBallSpeed = this.currentSpeed * globalSpeedMultiplier;
        this.x += this.dx * currentBallSpeed;
        this.y += this.dy * currentBallSpeed;
        
        // Sienos kolizijos
        if (this.x + this.radius > GAME_CONFIG.CANVAS_WIDTH || this.x - this.radius < 0) {
            this.dx *= -1;
            // Grojame atšokimo nuo sienos garsą
            this.audioManager.playSound('ballHit');
        }
        if (this.y - this.radius < 0) {
            this.dy *= -1;
            // Grojame atšokimo nuo sienos garsą
            this.audioManager.playSound('ballHit');
        }
        
        // Kamuoliukas nukrito
        if (this.y + this.radius > GAME_CONFIG.CANVAS_HEIGHT) {
            return false;
        }
        
        return true;
    }

    checkPaddleCollision(paddle) {
        if (this.y + this.radius > paddle.y &&
            this.y - this.radius < paddle.y + paddle.height &&
            this.x + this.radius > paddle.x &&
            this.x - this.radius < paddle.x + paddle.width &&
            this.dy > 0) {
            
            const hitPoint = (this.x - paddle.x) / paddle.width;
            const minAngle = Math.PI / 6;
            const maxAngle = Math.PI * 5/6;
            const angle = minAngle + hitPoint * (maxAngle - minAngle);
            const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            
            this.dx = Math.cos(angle) * speed;
            this.dy = -Math.abs(Math.sin(angle) * speed);
            this.currentSpeed = Math.min(this.currentSpeed + 0.02, 3);
            
            // Grojame atšokimo nuo platformos garsą
            this.audioManager.playSound('ballPaddle');
            
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        if (this.explosive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'orange';
            ctx.stroke();
            ctx.closePath();
        }
    }

    clone() {
        const newBall = new Ball(this.x, this.y, false);
        newBall.radius = this.radius;
        newBall.baseSpeed = this.baseSpeed;
        newBall.currentSpeed = this.currentSpeed;
        newBall.color = this.color;
        newBall.explosive = this.explosive;
        return newBall;
    }
} 