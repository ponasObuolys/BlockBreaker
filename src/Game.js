import { GAME_CONFIG, LEVELS } from './config/constants.js';
import { Ball } from './entities/Ball.js';
import { Paddle } from './entities/Paddle.js';
import { Block } from './entities/Block.js';
import { PowerUp } from './effects/PowerUp.js';
import { Effect } from './effects/Effect.js';
import { Firework } from './effects/Firework.js';

export class Game {
    constructor(canvasId, controls) {
        const { canvas, ctx } = this.initializeCanvas(canvasId);
        this.canvas = canvas;
        this.ctx = ctx;
        this.controls = controls;
        
        this.powerUps = [];
        this.activePowerUps = new Map();
        this.maxPowerUpsPerLevel = 7;
        this.currentLevelPowerUps = 0;
        
        this.balls = [];
        this.showTrajectory = false;
        
        this.lastSpeedIncreaseTime = Date.now();
        this.speedIncreaseInterval = GAME_CONFIG.SPEED_INCREASE_INTERVAL;
        this.globalSpeedMultiplier = 1.0;
        
        this.powerUpDisplayOffset = this.controls.left.includes('a') ? -200 : this.canvas.width + 10;
        
        this.init();
        console.log(`Game: Sukurta nauja žaidimo instancija (${canvasId})`);
    }

    initializeCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
        return { canvas, ctx };
    }

    init() {
        this.paddle = new Paddle();
        this.resetBall();
        
        this.gameState = {
            score: 0,
            lives: GAME_CONFIG.INITIAL_LIVES,
            maxLives: GAME_CONFIG.MAX_LIVES,
            lifeProgress: 0,
            level: 1,
            gameOver: false,
            gameWon: false,
            startTime: Date.now(),
            blocks: [],
            blockColors: ['red', 'orange', 'yellow', 'green', 'blue'],
            fireworks: [],
            effects: []
        };

        this.setupControls();
        this.createBlocks(1);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.controls.left.includes(e.key)) {
                this.leftPressed = true;
            }
            if (this.controls.right.includes(e.key)) {
                this.rightPressed = true;
            }
            if (this.controls.down.includes(e.key) && this.balls[0].stuck) {
                this.balls[0].stuck = false;
            }
            if (e.key === 'r' && (this.gameState.gameOver || this.gameState.gameWon)) {
                this.resetGame();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.controls.left.includes(e.key)) {
                this.leftPressed = false;
            }
            if (this.controls.right.includes(e.key)) {
                this.rightPressed = false;
            }
        });
    }

    update() {
        if (this.gameState.gameOver || this.gameState.gameWon) return;
        
        try {
            this.updateGameState();
        } catch (error) {
            console.error('Žaidimo atnaujinimo klaida:', error);
            this.gameState.gameOver = true;
        }
    }

    updateGameState() {
        // Atnaujinti žaidimo greitį
        const currentTime = Date.now();
        if (currentTime - this.lastSpeedIncreaseTime >= this.speedIncreaseInterval) {
            this.globalSpeedMultiplier *= GAME_CONFIG.SPEED_INCREASE_FACTOR;
            this.lastSpeedIncreaseTime = currentTime;
        }

        // Atnaujinti efektus
        this.gameState.effects = this.gameState.effects.filter(effect => effect.update());
        
        // Atnaujinti platformą
        if (this.leftPressed) {
            this.paddle.moveLeft(this.globalSpeedMultiplier);
        }
        if (this.rightPressed) {
            this.paddle.moveRight(this.globalSpeedMultiplier);
        }

        // Atnaujinti kamuoliukus
        let newBalls = [];
        this.balls.forEach(ball => {
            if (ball.update(this.paddle, this.globalSpeedMultiplier)) {
                if (ball.checkPaddleCollision(this.paddle)) {
                    // Kamuoliuko atšokimas nuo platformos jau įgyvendintas Ball klasėje
                }
                newBalls.push(ball);
            }
        });

        this.balls = newBalls;
        
        if (this.balls.length === 0) {
            this.handleBallLoss();
        }

        // Atnaujinti powerUps
        this.updatePowerUps();

        // Tikrinti blokų kolizijas
        this.checkBlockCollisions();
    }

    handleBallLoss() {
        this.gameState.lives--;
        this.showScreenFlash('red');
        if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
        } else {
            this.resetBall();
        }
    }

    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            if (powerUp.active && powerUp.checkCollision(this.paddle)) {
                this.activatePowerUp(powerUp);
                powerUp.active = false;
                return false;
            }
            return powerUp.update(this.globalSpeedMultiplier);
        });
    }

    checkBlockCollisions() {
        this.gameState.blocks.forEach(block => {
            if (!block.visible) return;
            
            this.balls.forEach(ball => {
                if (block.checkCollision(ball)) {
                    block.visible = false;
                    this.gameState.score += 10;
                    
                    this.gameState.effects.push(new Effect(ball.x, ball.y, block.color, 'hit'));
                    this.updateGameProgress();
                    this.spawnPowerUp(block.x + block.width/2, block.y + block.height/2);
                    
                    // Kamuoliuko atšokimas
                    if (Math.abs(ball.dx) > Math.abs(ball.dy)) {
                        ball.dx *= -1;
                    } else {
                        ball.dy *= -1;
                    }

                    this.checkLevelCompletion();
                }
            });
        });
    }

    checkLevelCompletion() {
        if (this.gameState.blocks.every(b => !b.visible)) {
            if (this.gameState.level === 5) {
                this.endGame();
            } else {
                this.advanceToNextLevel();
            }
        }
    }

    advanceToNextLevel() {
        this.gameState.level++;
        this.globalSpeedMultiplier *= GAME_CONFIG.LEVEL_SPEED_INCREASE;
        if (this.gameState.lives < this.gameState.maxLives) {
            this.gameState.lives++;
            this.gameState.lifeProgress = 0;
        }
        this.resetBall();
        this.createBlocks(this.gameState.level);
    }

    createBlocks(level) {
        const currentLevel = LEVELS[level - 1];
        this.gameState.blocks = Block.createBlocksForLevel(currentLevel, this.gameState.blockColors);
        this.currentLevelPowerUps = 0;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // UI elementai
        this.drawUI();
        
        // Blokai
        this.gameState.blocks.forEach(block => block.draw(this.ctx));
        
        // Kamuoliukai
        this.balls.forEach(ball => {
            if (this.showTrajectory && !ball.stuck) {
                this.drawTrajectory(ball);
            }
            ball.draw(this.ctx);
        });
        
        // Platforma
        this.paddle.draw(this.ctx);
        
        // Būsenos tekstai
        this.drawGameState();

        // PowerUps
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        this.drawPowerUpIcons();
    }

    // ... (kiti metodai iš originalaus kodo)
} 