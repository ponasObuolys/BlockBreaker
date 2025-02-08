import { GAME_CONFIG } from '../config/constants.js';

export class Block {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = GAME_CONFIG.BLOCK_WIDTH;
        this.height = GAME_CONFIG.BLOCK_HEIGHT;
        this.color = color;
        this.visible = true;
    }

    draw(ctx) {
        if (this.visible) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    static createBlocksForLevel(level, blockColors) {
        const currentLevel = level;
        const blocks = [];
        const totalBlockWidth = (GAME_CONFIG.BLOCK_WIDTH + GAME_CONFIG.BLOCK_PADDING) * currentLevel.cols;
        const startX = (GAME_CONFIG.CANVAS_WIDTH - totalBlockWidth) / 2;
        
        for (let i = 0; i < currentLevel.rows; i++) {
            for (let j = 0; j < currentLevel.cols; j++) {
                blocks.push(new Block(
                    startX + j * (GAME_CONFIG.BLOCK_WIDTH + GAME_CONFIG.BLOCK_PADDING),
                    50 + i * (GAME_CONFIG.BLOCK_HEIGHT + GAME_CONFIG.BLOCK_PADDING),
                    blockColors[i % blockColors.length]
                ));
            }
        }
        
        return blocks;
    }

    checkCollision(ball) {
        const closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
        const closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));
        
        const distanceX = ball.x - closestX;
        const distanceY = ball.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) <= (ball.radius * ball.radius);
    }
} 