class Block {
    constructor(x, y, width, height, color, health = 1) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.health = health;
        this.maxHealth = health;
        this.isDestroyed = false;
        this.isHit = false;
        this.hitTime = 0;
        this.hitDuration = 100; // ms
    }
    
    /**
     * Sukuria blokus pagal nurodytą lygį
     * @param {Array} level - Lygio matrica
     * @param {Array} colors - Blokų spalvos
     * @param {number} xOffset - Horizontalus poslinkis (numatytoji reikšmė 0)
     * @returns {Array} - Blokų masyvas
     */
    static createBlocksForLevel(level, colors, xOffset = 0) {
        const blocks = [];
        const rows = level.length;
        const cols = level[0].length;
        
        // Apskaičiuojame bloko dydį pagal ekrano dydį
        const blockWidth = (GAME_CONFIG.CANVAS_WIDTH - xOffset) / cols;
        const blockHeight = 20;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const blockType = level[row][col];
                
                if (blockType > 0) {
                    const x = xOffset + col * blockWidth;
                    const y = row * blockHeight + 50;
                    const color = colors[blockType - 1] || 'white';
                    const health = blockType;
                    
                    blocks.push(new Block(x, y, blockWidth, blockHeight, color, health));
                }
            }
        }
        
        return blocks;
    }
    
    draw(ctx) {
        if (this.isDestroyed) return;
        
        // Nustatome bloko spalvą pagal jo gyvybių skaičių
        const healthRatio = this.health / this.maxHealth;
        let blockColor = this.color;
        
        // Jei blokas yra pažeistas, keičiame jo spalvą
        if (healthRatio < 1) {
            const darkenFactor = 0.7 + 0.3 * healthRatio;
            blockColor = this.darkenColor(this.color, darkenFactor);
        }
        
        // Piešiame bloką
        ctx.fillStyle = blockColor;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fill();
        
        // Piešiame bloko rėmelį
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.stroke();
        
        // Jei blokas yra pažeistas, piešiame įtrūkimus
        if (healthRatio < 1) {
            this.drawCracks(ctx);
        }
        
        // Jei blokas yra pataikytas, piešiame efektą
        if (this.isHit && Date.now() - this.hitTime < this.hitDuration) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 5);
            ctx.fill();
        } else {
            this.isHit = false;
        }
    }
    
    // ... existing code ...
} 