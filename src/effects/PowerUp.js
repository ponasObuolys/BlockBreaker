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
        // Sukuriame PowerUp spalvų ir ikonų žemėlapį pagal tipą
        const powerUpStyles = {
            extraBall: { color: '#44ff44', icon: '🔮' },
            expandPaddle: { color: '#4444ff', icon: '📏' },
            shrinkPaddle: { color: '#ff4444', icon: '📏' },
            speedUp: { color: '#ffff00', icon: '⚡' },
            slowDown: { color: '#00ffff', icon: '❄️' },
            extraLife: { color: '#ff44ff', icon: '❤️' }
        };
        
        // Gauname stilių pagal tipą arba naudojame numatytąjį
        const style = powerUpStyles[this.type] || { color: '#ffffff', icon: '?' };
        
        ctx.fillStyle = style.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(style.icon, this.x, this.y);
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
        const powerUpTypes = ['extraBall', 'expandPaddle', 'shrinkPaddle', 'speedUp', 'slowDown', 'extraLife'];
        
        // Paprastas atsitiktinis pasirinkimas
        if (Math.random() < 0.2 * bonusChanceMultiplier) {
            return powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        }

        return null;
    }
} 