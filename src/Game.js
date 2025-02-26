import { GAME_CONFIG, LEVELS } from './config/constants.js';
import { Ball } from './entities/Ball.js';
import { Paddle } from './entities/Paddle.js';
import { Block } from './entities/Block.js';
import { PowerUp } from './effects/PowerUp.js';
import { Effect } from './effects/Effect.js';
import { Firework } from './effects/Firework.js';
import { AudioManager } from './managers/audio/AudioManager.js';

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
        
        // Inicializuojame garso valdiklį
        this.audioManager = AudioManager.getInstance();
        
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
        
        // Pradedame groti foninę muziką
        this.audioManager.playBackgroundMusic();
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
        
        // Grojame kamuoliuko praradimo garsą
        this.audioManager.playSound('ballHit');
        
        if (this.gameState.lives <= 0) {
            this.gameState.gameOver = true;
            // Grojame žaidimo pabaigos garsą
            this.audioManager.playSound('gameOver');
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
                    
                    // Grojame bloko sunaikinimo garsą
                    this.audioManager.playSound('blockBreak');
                    
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
        
        // Grojame lygio užbaigimo garsą
        this.audioManager.playSound('levelComplete');
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

    activatePowerUp(powerUp) {
        const type = powerUp.type;
        const duration = 10000; // 10 sekundžių
        
        // Grojame powerUp paėmimo garsą
        this.audioManager.playSound('powerUp');
        
        // Patikriname, ar jau yra aktyvus šio tipo powerUp
        if (this.activePowerUps.has(type)) {
            // Jei yra, pratęsiame jo laiką
            this.activePowerUps.set(type, Date.now() + duration);
            return;
        }
        
        // Nustatome powerUp galiojimo laiką
        this.activePowerUps.set(type, Date.now() + duration);
        
        // Pritaikome powerUp efektą
        switch (type) {
            case 'extraBall':
                // Pridedame papildomą kamuoliuką
                if (this.balls.length > 0) {
                    const originalBall = this.balls[0];
                    const newBall = originalBall.clone();
                    newBall.dx *= -1; // Kad kamuoliukai judėtų skirtingomis kryptimis
                    this.balls.push(newBall);
                }
                break;
                
            case 'expandPaddle':
                // Padidiname platformą
                this.paddle.width *= 1.5;
                
                // Nustatome laikmatį, kad po nustatyto laiko grąžintume normalų dydį
                setTimeout(() => {
                    this.paddle.width /= 1.5;
                    this.activePowerUps.delete(type);
                }, duration);
                break;
                
            case 'shrinkPaddle':
                // Sumažiname platformą
                this.paddle.width /= 1.5;
                
                // Nustatome laikmatį, kad po nustatyto laiko grąžintume normalų dydį
                setTimeout(() => {
                    this.paddle.width *= 1.5;
                    this.activePowerUps.delete(type);
                }, duration);
                break;
                
            case 'speedUp':
                // Pagreitiname kamuoliuką
                this.balls.forEach(ball => {
                    ball.currentSpeed *= 1.5;
                });
                
                // Nustatome laikmatį, kad po nustatyto laiko grąžintume normalų greitį
                setTimeout(() => {
                    this.balls.forEach(ball => {
                        ball.currentSpeed /= 1.5;
                    });
                    this.activePowerUps.delete(type);
                }, duration);
                break;
                
            case 'slowDown':
                // Sulėtiname kamuoliuką
                this.balls.forEach(ball => {
                    ball.currentSpeed /= 1.5;
                });
                
                // Nustatome laikmatį, kad po nustatyto laiko grąžintume normalų greitį
                setTimeout(() => {
                    this.balls.forEach(ball => {
                        ball.currentSpeed *= 1.5;
                    });
                    this.activePowerUps.delete(type);
                }, duration);
                break;
                
            case 'extraLife':
                // Pridedame papildomą gyvybę, jei dar nepasiekėme maksimalaus skaičiaus
                if (this.gameState.lives < this.gameState.maxLives) {
                    this.gameState.lives++;
                    this.showScreenFlash('green');
                }
                this.activePowerUps.delete(type); // Iš karto pašaliname, nes tai vienkartinis powerUp
                break;
        }
    }

    drawTrajectory(ball) {
        // Piešiame kamuoliuko trajektoriją
        const steps = 20;
        const stepSize = 0.5;
        
        this.ctx.beginPath();
        this.ctx.moveTo(ball.x, ball.y);
        
        let x = ball.x;
        let y = ball.y;
        let dx = ball.dx;
        let dy = ball.dy;
        
        for (let i = 0; i < steps; i++) {
            x += dx * stepSize;
            y += dy * stepSize;
            
            // Atšokimas nuo sienų
            if (x + ball.radius > this.canvas.width || x - ball.radius < 0) {
                dx *= -1;
            }
            if (y - ball.radius < 0) {
                dy *= -1;
            }
            
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.stroke();
    }

    endGame() {
        this.gameState.gameWon = true;
        
        // Grojame žaidimo laimėjimo garsą
        this.audioManager.playSound('levelComplete');
        
        // Sukuriame fejerverkus
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height / 2;
                this.gameState.fireworks.push(new Firework(x, y));
            }, i * 300);
        }
        
        // Išsaugome rezultatą
        this.saveScore();
    }

    resetGame() {
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
        
        this.balls = [];
        this.powerUps = [];
        this.activePowerUps = new Map();
        this.currentLevelPowerUps = 0;
        this.globalSpeedMultiplier = 1.0;
        
        // Sustabdome ir vėl paleidžiame foninę muziką
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playBackgroundMusic();
        
        this.resetBall();
        this.createBlocks(1);
    }

    saveScore() {
        const gameTime = Math.floor((Date.now() - this.gameState.startTime) / 1000);
        const playerName = prompt('Įveskite savo vardą:', 'Žaidėjas');
        
        if (playerName) {
            const score = {
                name: playerName,
                score: this.gameState.score,
                time: gameTime,
                date: new Date().toISOString()
            };
            
            // Gauname esamus rezultatus
            const scores = JSON.parse(localStorage.getItem('blockBreakerScores') || '[]');
            
            // Pridedame naują rezultatą
            scores.push(score);
            
            // Rūšiuojame pagal taškus (mažėjančia tvarka)
            scores.sort((a, b) => b.score - a.score);
            
            // Išsaugome tik 10 geriausių rezultatų
            localStorage.setItem('blockBreakerScores', JSON.stringify(scores.slice(0, 10)));
        }
    }

    resetBall() {
        this.balls = [];
        const newBall = new Ball(this.canvas.width / 2, this.canvas.height - 30, true);
        this.balls.push(newBall);
    }

    drawUI() {
        // Nupiešiame pusiau permatomą juodą juostą UI elementams
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, 50);
        
        // Gyvybės (širdelės)
        const heartSize = 24;
        const heartSpacing = 8;
        const heartsStartX = 30;
        const heartsY = 25;
        
        for (let i = 0; i < this.gameState.maxLives; i++) {
            // Pilka širdelė (tuščia)
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.font = `${heartSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('❤', heartsStartX + i * (heartSize + heartSpacing), heartsY);
            
            // Raudona širdelė (užpildyta)
            if (i < this.gameState.lives) {
                this.ctx.fillStyle = '#ff4466';
                this.ctx.fillText('❤', heartsStartX + i * (heartSize + heartSpacing), heartsY);
            }
        }
        
        // Lygis - moderniai apipavidalintas
        const levelX = this.canvas.width / 2;
        const levelY = 25;
        
        // Apvalus fonas lygiui
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(levelX - 50, levelY - 15, 100, 30, 15);
        this.ctx.fill();
        
        // Lygio tekstas
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`LYGIS ${this.gameState.level}`, levelX, levelY);
        
        // Taškai - moderniai apipavidalinti
        const scoreX = this.canvas.width - 100;
        const scoreY = 25;
        
        // Apvalus fonas taškams
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(scoreX - 60, scoreY - 15, 120, 30, 15);
        this.ctx.fill();
        
        // Taškų tekstas
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.gameState.score} TŠK.`, scoreX, scoreY);
    }

    drawGameState() {
        if (this.gameState.gameOver) {
            // Pusiau permatomas tamsus fonas
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2 - 30;
            
            // Žaidimo pabaigos pranešimas
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(centerX - 200, centerY - 40, 400, 180, 20);
            this.ctx.fill();
            
            // Antraštė
            this.ctx.fillStyle = '#ff4466';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('ŽAIDIMAS BAIGTAS', centerX, centerY);
            
            // Rezultatas
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`${this.gameState.score} TAŠKAI`, centerX, centerY + 50);
            
            // Instrukcija
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Paspauskite R, kad pradėtumėte iš naujo', centerX, centerY + 100);
        } else if (this.gameState.gameWon) {
            // Pusiau permatomas tamsus fonas
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2 - 30;
            
            // Laimėjimo pranešimas
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(centerX - 200, centerY - 40, 400, 180, 20);
            this.ctx.fill();
            
            // Antraštė
            this.ctx.fillStyle = '#44ff88';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('LAIMĖJOTE!', centerX, centerY);
            
            // Rezultatas
            this.ctx.fillStyle = '#ffcc00';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`${this.gameState.score} TAŠKAI`, centerX, centerY + 50);
            
            // Instrukcija
            this.ctx.fillStyle = 'white';
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Paspauskite R, kad pradėtumėte iš naujo', centerX, centerY + 100);
        }
    }

    drawPowerUpIcons() {
        // Rodome aktyvius powerUps
        let i = 0;
        this.activePowerUps.forEach((expireTime, type) => {
            const timeLeft = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
            if (timeLeft > 0) {
                const x = this.powerUpDisplayOffset;
                const y = 100 + i * 40;
                
                // PowerUp stiliai
                const powerUpStyles = {
                    extraBall: { color: '#44ff44', icon: '🔮', name: 'Papildomas kamuoliukas' },
                    expandPaddle: { color: '#4444ff', icon: '📏', name: 'Platesnė platforma' },
                    shrinkPaddle: { color: '#ff4444', icon: '📏', name: 'Siauresnė platforma' },
                    speedUp: { color: '#ffff00', icon: '⚡', name: 'Pagreitinimas' },
                    slowDown: { color: '#00ffff', icon: '❄️', name: 'Sulėtinimas' },
                    extraLife: { color: '#ff44ff', icon: '❤️', name: 'Papildoma gyvybė' }
                };
                
                // Gauname stilių pagal tipą arba naudojame numatytąjį
                const style = powerUpStyles[type] || { color: '#ffffff', icon: '?', name: type };
                
                // Apvalus fonas
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, 180, 30, 15);
                this.ctx.fill();
                
                // Spalvotas indikatorius
                this.ctx.fillStyle = style.color;
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, 5, 30, 2);
                this.ctx.fill();
                
                // Ikona
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(style.icon, x + 20, y + 15);
                
                // Pavadinimas
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(style.name, x + 40, y + 15);
                
                // Laikas
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(`${timeLeft}s`, x + 170, y + 15);
                
                i++;
            }
        });
    }

    showScreenFlash(color) {
        const flashElement = document.createElement('div');
        flashElement.style.position = 'absolute';
        flashElement.style.top = '0';
        flashElement.style.left = '0';
        flashElement.style.width = '100%';
        flashElement.style.height = '100%';
        flashElement.style.backgroundColor = color;
        flashElement.style.opacity = '0.3';
        flashElement.style.pointerEvents = 'none';
        flashElement.style.zIndex = '1000';
        flashElement.style.transition = 'opacity 0.3s';
        
        document.body.appendChild(flashElement);
        
        setTimeout(() => {
            flashElement.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(flashElement);
            }, 300);
        }, 100);
    }

    updateGameProgress() {
        // Atnaujina žaidimo progresą
        this.gameState.lifeProgress += 0.01;
        if (this.gameState.lifeProgress >= 1 && this.gameState.lives < this.gameState.maxLives) {
            this.gameState.lives++;
            this.gameState.lifeProgress = 0;
            this.showScreenFlash('green');
        }
    }

    spawnPowerUp(x, y) {
        // Atsitiktinai sukuriame powerUp
        if (this.currentLevelPowerUps < this.maxPowerUpsPerLevel && Math.random() < 0.2) {
            const powerUpTypes = ['extraBall', 'expandPaddle', 'shrinkPaddle', 'speedUp', 'slowDown', 'extraLife'];
            const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            this.powerUps.push(new PowerUp(x, y, randomType));
            this.currentLevelPowerUps++;
        }
    }
} 