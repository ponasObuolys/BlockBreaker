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
        
        // Inicializuojame garso valdiklį
        this.audioManager = AudioManager.getInstance();
        
        // Pauzės būsena
        this.isPaused = false;
        
        // Nustatymų meniu būsena
        this.showSettings = false;
        
        // Žaidimo nustatymai
        this.settings = {
            difficulty: 'normal', // easy, normal, hard
            ballSpeed: 1.0,
            showTrajectory: false
        };
        
        // Pranešimų sistema
        this.messages = [];
        this.messageTimeout = 3000; // 3 sekundės
        
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
        this.paddle.x = 150 + (this.canvas.width - 150) / 2;
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
            // Pauzės valdymas su 'p' arba 'Escape' klavišais
            if (e.key === 'p' || e.key === 'Escape') {
                this.togglePause();
            }
            // Nustatymų meniu su 'o' klavišu
            if (e.key === 'o' && this.isPaused) {
                this.toggleSettings();
            }
            // Trajektorijos rodymas su 't' klavišu
            if (e.key === 't') {
                this.settings.showTrajectory = !this.settings.showTrajectory;
                this.showTrajectory = this.settings.showTrajectory;
            }
        });

        // Pridedame pelės įvykių klausytojus nustatymų meniu valdymui
        this.canvas.addEventListener('click', (e) => {
            if (!this.isPaused || !this.showSettings) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleSettingsClick(x, y);
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
        if (this.gameState.gameOver || this.gameState.gameWon || this.isPaused) return;
        
        try {
            this.updateGameState();
            this.updateMessages();
        } catch (error) {
            console.error('Žaidimo atnaujinimo klaida:', error);
            this.showMessage(`Klaida: ${error.message}`, 'error');
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
            this.showMessage('Žaidimas baigtas!', 'error');
        } else {
            this.resetBall();
            this.showMessage(`Praradote kamuoliuką! Liko ${this.gameState.lives} gyvybės.`, 'warning');
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
        
        // Rodome pranešimą apie naują lygį
        this.showMessage(`Sveikiname! Pasiekėte ${this.gameState.level} lygį!`, 'success');
    }

    createBlocks(level) {
        const currentLevel = LEVELS[level - 1];
        this.gameState.blocks = Block.createBlocksForLevel(currentLevel, this.gameState.blockColors, 150);
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
        
        // Pranešimai
        this.drawMessages();
        
        // Pauzės meniu
        if (this.isPaused) {
            this.drawPauseMenu();
        }
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
            this.showMessage(`${this.getPowerUpName(type)} pratęstas!`, 'info');
            return;
        }
        
        // Nustatome powerUp galiojimo laiką
        this.activePowerUps.set(type, Date.now() + duration);
        this.showMessage(`Aktyvuotas ${this.getPowerUpName(type)}!`, 'success');
        
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
        
        // Sukuriame modalinį langą vardo įvedimui
        const modalContainer = document.createElement('div');
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100%';
        modalContainer.style.height = '100%';
        modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modalContainer.style.display = 'flex';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.zIndex = '2000';
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        modalContent.style.backdropFilter = 'blur(10px)';
        modalContent.style.padding = '2rem';
        modalContent.style.borderRadius = '15px';
        modalContent.style.width = '400px';
        modalContent.style.textAlign = 'center';
        modalContent.style.color = 'white';
        modalContent.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        
        const title = document.createElement('h2');
        title.textContent = this.gameState.gameWon ? 'Sveikiname! Jūs laimėjote!' : 'Žaidimas baigtas';
        title.style.color = this.gameState.gameWon ? '#4CAF50' : '#F44336';
        title.style.marginBottom = '1rem';
        
        const scoreText = document.createElement('p');
        scoreText.textContent = `Jūsų rezultatas: ${this.gameState.score} taškų`;
        scoreText.style.fontSize = '1.2rem';
        scoreText.style.marginBottom = '0.5rem';
        
        const timeText = document.createElement('p');
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        timeText.textContent = `Žaidimo laikas: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        timeText.style.fontSize = '1.2rem';
        timeText.style.marginBottom = '1.5rem';
        
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Įveskite savo vardą:';
        nameLabel.style.display = 'block';
        nameLabel.style.marginBottom = '0.5rem';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = 'Žaidėjas';
        nameInput.style.padding = '0.5rem';
        nameInput.style.width = '100%';
        nameInput.style.marginBottom = '1.5rem';
        nameInput.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        nameInput.style.border = 'none';
        nameInput.style.borderRadius = '5px';
        nameInput.style.color = 'white';
        nameInput.style.fontSize = '1rem';
        
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Išsaugoti rezultatą';
        saveButton.style.backgroundColor = '#4CAF50';
        saveButton.style.color = 'white';
        saveButton.style.border = 'none';
        saveButton.style.padding = '0.75rem 1.5rem';
        saveButton.style.borderRadius = '5px';
        saveButton.style.fontSize = '1rem';
        saveButton.style.cursor = 'pointer';
        saveButton.style.marginRight = '1rem';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Atšaukti';
        cancelButton.style.backgroundColor = '#F44336';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.padding = '0.75rem 1.5rem';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.fontSize = '1rem';
        cancelButton.style.cursor = 'pointer';
        
        // Pridedame elementus į modalinį langą
        modalContent.appendChild(title);
        modalContent.appendChild(scoreText);
        modalContent.appendChild(timeText);
        modalContent.appendChild(nameLabel);
        modalContent.appendChild(nameInput);
        modalContent.appendChild(saveButton);
        modalContent.appendChild(cancelButton);
        modalContainer.appendChild(modalContent);
        
        // Pridedame modalinį langą į dokumentą
        document.body.appendChild(modalContainer);
        
        // Automatiškai fokusuojame įvesties lauką
        nameInput.focus();
        nameInput.select();
        
        // Mygtukų funkcionalumas
        saveButton.addEventListener('click', () => {
            const playerName = nameInput.value.trim() || 'Žaidėjas';
            
            const score = {
                name: playerName,
                score: this.gameState.score,
                time: gameTime,
                date: new Date().toISOString(),
                level: this.gameState.level,
                won: this.gameState.gameWon
            };
            
            // Gauname esamus rezultatus
            const scores = JSON.parse(localStorage.getItem('blockBreakerScores') || '[]');
            
            // Pridedame naują rezultatą
            scores.push(score);
            
            // Rūšiuojame pagal taškus (mažėjančia tvarka)
            scores.sort((a, b) => b.score - a.score);
            
            // Išsaugome tik 10 geriausių rezultatų
            localStorage.setItem('blockBreakerScores', JSON.stringify(scores.slice(0, 10)));
            
            // Pašaliname modalinį langą
            document.body.removeChild(modalContainer);
            
            // Atnaujiname rezultatų lentelę
            if (typeof updateScoreBoard === 'function') {
                updateScoreBoard();
            }
        });
        
        cancelButton.addEventListener('click', () => {
            // Pašaliname modalinį langą
            document.body.removeChild(modalContainer);
        });
        
        // Leidžiame uždaryti modalinį langą paspaudus Escape
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modalContainer);
                document.removeEventListener('keydown', handleKeyDown);
            } else if (e.key === 'Enter') {
                saveButton.click();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
    }

    resetBall() {
        this.balls = [];
        const newBall = new Ball(150 + (this.canvas.width - 150) / 2, this.canvas.height - 30, true);
        this.balls.push(newBall);
    }

    drawUI() {
        // Vietoj juostų viršuje ir apačioje, sukuriame šoninį skydelį kairėje
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, 150, this.canvas.height);
        
        // Žaidimo pavadinimas viršuje
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('BLOCK BREAKER', 75, 30);
        
        // Horizontali linija po pavadinimu
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(20, 50);
        this.ctx.lineTo(130, 50);
        this.ctx.stroke();
        
        // Taškai - moderniai apipavidalinti
        const scoreY = 80;
        
        // Apvalus fonas taškams
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(20, scoreY - 15, 110, 30, 10);
        this.ctx.fill();
        
        // Taškų tekstas
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.gameState.score} TŠK.`, 75, scoreY);
        
        // Lygis - moderniai apipavidalintas
        const levelY = 130;
        
        // Apvalus fonas lygiui
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(20, levelY - 15, 110, 30, 10);
        this.ctx.fill();
        
        // Lygio tekstas
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`LYGIS ${this.gameState.level}`, 75, levelY);
        
        // Gyvybės (širdelės)
        const heartsY = 180;
        
        // Antraštė
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GYVYBĖS', 75, heartsY - 25);
        
        // Širdelės
        const heartSize = 20;
        const heartSpacing = 8;
        const heartsStartX = 75 - ((this.gameState.maxLives * heartSize + (this.gameState.maxLives - 1) * heartSpacing) / 2);
        
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
        
        // Rodome žaidimo laiką
        const currentTime = Date.now();
        const gameTimeInSeconds = Math.floor((currentTime - this.gameState.startTime) / 1000);
        const minutes = Math.floor(gameTimeInSeconds / 60);
        const seconds = gameTimeInSeconds % 60;
        
        // Laikas - moderniai apipavidalintas
        const timeY = 230;
        
        // Antraštė
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LAIKAS', 75, timeY - 25);
        
        // Apvalus fonas laikui
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.beginPath();
        this.ctx.roundRect(20, timeY - 15, 110, 30, 10);
        this.ctx.fill();
        
        // Laiko tekstas
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 75, timeY);
        
        // Valdymo instrukcijos apačioje
        const instructionsY = this.canvas.height - 100;
        
        // Antraštė
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VALDYMAS', 75, instructionsY - 25);
        
        // Instrukcijų tekstai
        this.ctx.font = '12px Arial';
        this.ctx.fillText('P/ESC - pauzė', 75, instructionsY);
        this.ctx.fillText('O - nustatymai', 75, instructionsY + 20);
        this.ctx.fillText('T - trajektorija', 75, instructionsY + 40);
        this.ctx.fillText('R - iš naujo', 75, instructionsY + 60);
    }

    drawGameState() {
        // Jei žaidimas baigtas, rodome atitinkamą pranešimą
        if (this.gameState.gameOver || this.gameState.gameWon) {
            // Pusiau permatomas tamsus fonas
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Rezultatų langas
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 200, this.canvas.height / 2 - 150, 400, 300, 20);
            this.ctx.fill();
            
            // Antraštė
            this.ctx.textAlign = 'center';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.fillStyle = this.gameState.gameWon ? '#4CAF50' : '#F44336';
            
            const message = this.gameState.gameWon ? 'Sveikiname! Jūs laimėjote!' : 'Žaidimas baigtas';
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2 - 100);
            
            // Rezultatai
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`Galutinis rezultatas: ${this.gameState.score}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
            
            // Žaidimo laikas
            const gameTimeInSeconds = Math.floor((Date.now() - this.gameState.startTime) / 1000);
            const minutes = Math.floor(gameTimeInSeconds / 60);
            const seconds = gameTimeInSeconds % 60;
            this.ctx.fillText(`Žaidimo laikas: ${minutes}:${seconds.toString().padStart(2, '0')}`, this.canvas.width / 2, this.canvas.height / 2);
            
            // Pasiektas lygis
            this.ctx.fillText(`Pasiektas lygis: ${this.gameState.level}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            // Instrukcija
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText('Spauskite R, kad pradėtumėte iš naujo', this.canvas.width / 2, this.canvas.height / 2 + 100);
        }
    }

    drawPowerUpIcons() {
        // Rodome aktyvius powerUps
        let i = 0;
        this.activePowerUps.forEach((expireTime, type) => {
            const timeLeft = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
            if (timeLeft > 0) {
                const x = 170; // Pradedame rodyti iškart po šoniniu skydeliu
                const y = 20 + i * 40;
                
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

    /**
     * Perjungia žaidimo pauzės būseną
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Jei žaidimas pristabdytas, pristabdome foninę muziką
            this.audioManager.pauseBackgroundMusic();
        } else {
            // Jei žaidimas tęsiamas, atnaujinama foninė muzika
            this.audioManager.resumeBackgroundMusic();
            // Išjungiame nustatymų meniu, jei jis buvo atidarytas
            this.showSettings = false;
        }
    }
    
    /**
     * Piešia pauzės meniu
     */
    drawPauseMenu() {
        // Pusiau permatomas fonas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.showSettings) {
            this.drawSettingsMenu();
            return;
        }
        
        // Pauzės antraštė
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUZĖ', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        // Instrukcijos
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('Spauskite P arba ESC, kad tęstumėte žaidimą', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Spauskite O, kad atidarytumėte nustatymus', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Spauskite R, kad pradėtumėte iš naujo', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
    
    /**
     * Perjungia nustatymų meniu rodymo būseną
     */
    toggleSettings() {
        this.showSettings = !this.showSettings;
    }
    
    /**
     * Piešia nustatymų meniu
     */
    drawSettingsMenu() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Pusiau permatomas tamsus fonas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Nustatymų meniu konteineris
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.roundRect(centerX - 250, centerY - 200, 500, 400, 20);
        this.ctx.fill();
        
        // Nustatymų antraštė
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NUSTATYMAI', centerX, centerY - 160);
        
        // Horizontali linija po antrašte
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - 200, centerY - 140);
        this.ctx.lineTo(centerX + 200, centerY - 140);
        this.ctx.stroke();
        
        // Sunkumo lygis - antraštė
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Sunkumo lygis', centerX - 220, centerY - 100);
        
        // Sunkumo lygio mygtukai
        const difficultyButtonWidth = 120;
        const difficultyButtonSpacing = 20;
        const difficultyButtonsStartX = centerX - 220;
        const difficultyButtonY = centerY - 70;
        
        // Lengvas
        this.drawSettingsButton(
            'Lengvas', 
            difficultyButtonsStartX, 
            difficultyButtonY, 
            difficultyButtonWidth, 
            40, 
            this.settings.difficulty === 'easy',
            '#4CAF50'
        );
        
        // Vidutinis
        this.drawSettingsButton(
            'Vidutinis', 
            difficultyButtonsStartX + difficultyButtonWidth + difficultyButtonSpacing, 
            difficultyButtonY, 
            difficultyButtonWidth, 
            40, 
            this.settings.difficulty === 'normal',
            '#2196F3'
        );
        
        // Sunkus
        this.drawSettingsButton(
            'Sunkus', 
            difficultyButtonsStartX + 2 * (difficultyButtonWidth + difficultyButtonSpacing), 
            difficultyButtonY, 
            difficultyButtonWidth, 
            40, 
            this.settings.difficulty === 'hard',
            '#F44336'
        );
        
        // Kamuoliuko greitis - antraštė
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Kamuoliuko greitis', centerX - 220, centerY);
        
        // Greičio mygtukai
        const speedButtonWidth = 80;
        const speedButtonSpacing = 20;
        const speedButtonsStartX = centerX - 220;
        const speedButtonY = centerY + 30;
        
        // 0.75x
        this.drawSettingsButton(
            '0.75x', 
            speedButtonsStartX, 
            speedButtonY, 
            speedButtonWidth, 
            40, 
            this.settings.ballSpeed === 0.75,
            '#00BCD4'
        );
        
        // 1.0x
        this.drawSettingsButton(
            '1.0x', 
            speedButtonsStartX + speedButtonWidth + speedButtonSpacing, 
            speedButtonY, 
            speedButtonWidth, 
            40, 
            this.settings.ballSpeed === 1.0,
            '#00BCD4'
        );
        
        // 1.25x
        this.drawSettingsButton(
            '1.25x', 
            speedButtonsStartX + 2 * (speedButtonWidth + speedButtonSpacing), 
            speedButtonY, 
            speedButtonWidth, 
            40, 
            this.settings.ballSpeed === 1.25,
            '#00BCD4'
        );
        
        // 1.5x
        this.drawSettingsButton(
            '1.5x', 
            speedButtonsStartX + 3 * (speedButtonWidth + speedButtonSpacing), 
            speedButtonY, 
            speedButtonWidth, 
            40, 
            this.settings.ballSpeed === 1.5,
            '#00BCD4'
        );
        
        // Trajektorijos rodymas - antraštė
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Rodyti trajektoriją', centerX - 220, centerY + 100);
        
        // Trajektorijos mygtukai
        const trajectoryButtonWidth = 120;
        const trajectoryButtonSpacing = 20;
        const trajectoryButtonsStartX = centerX - 220;
        const trajectoryButtonY = centerY + 130;
        
        // Įjungta
        this.drawSettingsButton(
            'Įjungta', 
            trajectoryButtonsStartX, 
            trajectoryButtonY, 
            trajectoryButtonWidth, 
            40, 
            this.settings.showTrajectory,
            '#9C27B0'
        );
        
        // Išjungta
        this.drawSettingsButton(
            'Išjungta', 
            trajectoryButtonsStartX + trajectoryButtonWidth + trajectoryButtonSpacing, 
            trajectoryButtonY, 
            trajectoryButtonWidth, 
            40, 
            !this.settings.showTrajectory,
            '#9C27B0'
        );
        
        // Grįžimo mygtukas
        this.drawSettingsButton(
            'Grįžti', 
            centerX - 80, 
            centerY + 180, 
            160, 
            50, 
            false,
            '#607D8B',
            true
        );
    }
    
    /**
     * Piešia nustatymų mygtuką
     */
    drawSettingsButton(text, x, y, width, height, isSelected, color = '#4CAF50', isSpecial = false) {
        // Mygtuko fonas
        const bgColor = isSelected ? color : 'rgba(255, 255, 255, 0.1)';
        const borderColor = isSelected ? color : 'rgba(255, 255, 255, 0.3)';
        
        // Šešėlis
        if (isSpecial) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
        }
        
        // Mygtuko fonas
        this.ctx.fillStyle = bgColor;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 10);
        this.ctx.fill();
        
        // Mygtuko rėmelis
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 10);
        this.ctx.stroke();
        
        // Atstatome šešėlio nustatymus
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Mygtuko tekstas
        this.ctx.fillStyle = isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = isSpecial ? 'bold 18px Arial' : '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
    }
    
    /**
     * Apdoroja paspaudimus nustatymų meniu
     */
    handleSettingsClick(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Sunkumo lygio mygtukai
        const difficultyButtonWidth = 120;
        const difficultyButtonSpacing = 20;
        const difficultyButtonsStartX = centerX - 220;
        const difficultyButtonY = centerY - 70;
        
        if (y >= difficultyButtonY && y <= difficultyButtonY + 40) {
            // Lengvas
            if (x >= difficultyButtonsStartX && x <= difficultyButtonsStartX + difficultyButtonWidth) {
                this.settings.difficulty = 'easy';
                this.updateDifficulty();
            }
            // Vidutinis
            else if (x >= difficultyButtonsStartX + difficultyButtonWidth + difficultyButtonSpacing && 
                     x <= difficultyButtonsStartX + 2 * difficultyButtonWidth + difficultyButtonSpacing) {
                this.settings.difficulty = 'normal';
                this.updateDifficulty();
            }
            // Sunkus
            else if (x >= difficultyButtonsStartX + 2 * (difficultyButtonWidth + difficultyButtonSpacing) && 
                     x <= difficultyButtonsStartX + 3 * difficultyButtonWidth + 2 * difficultyButtonSpacing) {
                this.settings.difficulty = 'hard';
                this.updateDifficulty();
            }
        }
        
        // Greičio mygtukai
        const speedButtonWidth = 80;
        const speedButtonSpacing = 20;
        const speedButtonsStartX = centerX - 220;
        const speedButtonY = centerY + 30;
        
        if (y >= speedButtonY && y <= speedButtonY + 40) {
            // 0.75x
            if (x >= speedButtonsStartX && x <= speedButtonsStartX + speedButtonWidth) {
                this.settings.ballSpeed = 0.75;
                this.updateBallSpeed();
            }
            // 1.0x
            else if (x >= speedButtonsStartX + speedButtonWidth + speedButtonSpacing && 
                     x <= speedButtonsStartX + 2 * speedButtonWidth + speedButtonSpacing) {
                this.settings.ballSpeed = 1.0;
                this.updateBallSpeed();
            }
            // 1.25x
            else if (x >= speedButtonsStartX + 2 * (speedButtonWidth + speedButtonSpacing) && 
                     x <= speedButtonsStartX + 3 * speedButtonWidth + 2 * speedButtonSpacing) {
                this.settings.ballSpeed = 1.25;
                this.updateBallSpeed();
            }
            // 1.5x
            else if (x >= speedButtonsStartX + 3 * (speedButtonWidth + speedButtonSpacing) && 
                     x <= speedButtonsStartX + 4 * speedButtonWidth + 3 * speedButtonSpacing) {
                this.settings.ballSpeed = 1.5;
                this.updateBallSpeed();
            }
        }
        
        // Trajektorijos mygtukai
        const trajectoryButtonWidth = 120;
        const trajectoryButtonSpacing = 20;
        const trajectoryButtonsStartX = centerX - 220;
        const trajectoryButtonY = centerY + 130;
        
        if (y >= trajectoryButtonY && y <= trajectoryButtonY + 40) {
            // Įjungta
            if (x >= trajectoryButtonsStartX && x <= trajectoryButtonsStartX + trajectoryButtonWidth) {
                this.settings.showTrajectory = true;
                this.showTrajectory = true;
            }
            // Išjungta
            else if (x >= trajectoryButtonsStartX + trajectoryButtonWidth + trajectoryButtonSpacing && 
                     x <= trajectoryButtonsStartX + 2 * trajectoryButtonWidth + trajectoryButtonSpacing) {
                this.settings.showTrajectory = false;
                this.showTrajectory = false;
            }
        }
        
        // Grįžimo mygtukas
        if (x >= centerX - 80 && x <= centerX + 80 && 
            y >= centerY + 180 && y <= centerY + 230) {
            this.showSettings = false;
        }
    }
    
    /**
     * Atnaujina žaidimo sunkumo lygį
     */
    updateDifficulty() {
        switch (this.settings.difficulty) {
            case 'easy':
                this.globalSpeedMultiplier = 0.8;
                break;
            case 'normal':
                this.globalSpeedMultiplier = 1.0;
                break;
            case 'hard':
                this.globalSpeedMultiplier = 1.2;
                break;
        }
    }
    
    /**
     * Atnaujina kamuoliuko greitį
     */
    updateBallSpeed() {
        this.balls.forEach(ball => {
            const baseSpeed = 5;
            const speedMultiplier = this.settings.ballSpeed;
            
            // Išsaugome krypties vektorių
            const dx = ball.dx > 0 ? 1 : -1;
            const dy = ball.dy > 0 ? 1 : -1;
            
            // Nustatome naują greitį
            ball.dx = dx * baseSpeed * speedMultiplier;
            ball.dy = dy * baseSpeed * speedMultiplier;
        });
    }

    /**
     * Rodo pranešimą žaidėjui
     * @param {string} text - Pranešimo tekstas
     * @param {string} type - Pranešimo tipas (info, success, warning, error)
     */
    showMessage(text, type = 'info') {
        this.messages.push({
            text,
            type,
            createdAt: Date.now()
        });
        
        console.log(`Game: Pranešimas (${type}): ${text}`);
    }
    
    /**
     * Atnaujina pranešimų būsenas
     */
    updateMessages() {
        const currentTime = Date.now();
        this.messages = this.messages.filter(message => 
            currentTime - message.createdAt < this.messageTimeout
        );
    }
    
    /**
     * Piešia pranešimus
     */
    drawMessages() {
        if (this.messages.length === 0) return;
        
        const messageHeight = 40;
        const padding = 10;
        const borderRadius = 15;
        
        // Centruojame pranešimus horizontaliai, bet pradedame nuo šoninio skydelio pabaigos
        const messageWidth = 350;
        const startX = 170;
        
        this.messages.forEach((message, index) => {
            const y = 20 + index * (messageHeight + padding); // Pradedame rodyti viršuje
            
            // Nustatome pranešimo fono spalvą pagal tipą
            let backgroundColor;
            switch (message.type) {
                case 'success':
                    backgroundColor = 'rgba(40, 167, 69, 0.8)';
                    break;
                case 'warning':
                    backgroundColor = 'rgba(255, 193, 7, 0.8)';
                    break;
                case 'error':
                    backgroundColor = 'rgba(220, 53, 69, 0.8)';
                    break;
                default: // info
                    backgroundColor = 'rgba(23, 162, 184, 0.8)';
            }
            
            // Piešiame pranešimo foną su šešėliu
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 3;
            
            this.ctx.fillStyle = backgroundColor;
            this.ctx.beginPath();
            this.ctx.roundRect(startX, y, messageWidth, messageHeight, borderRadius);
            this.ctx.fill();
            
            // Atstatome šešėlio nustatymus
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Piešiame pranešimo tekstą
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(message.text, startX + messageWidth / 2, y + messageHeight / 2);
        });
    }
    
    /**
     * Grąžina powerUp pavadinimą lietuvių kalba
     * @param {string} type - PowerUp tipas
     * @returns {string} - PowerUp pavadinimas lietuvių kalba
     */
    getPowerUpName(type) {
        switch (type) {
            case 'extraBall':
                return 'Papildomas kamuoliukas';
            case 'expandPaddle':
                return 'Platesnė platforma';
            case 'shrinkPaddle':
                return 'Siauresnė platforma';
            case 'fastBall':
                return 'Greitesnis kamuoliukas';
            case 'slowBall':
                return 'Lėtesnis kamuoliukas';
            case 'extraLife':
                return 'Papildoma gyvybė';
            case 'multiball':
                return 'Daug kamuoliukų';
            default:
                return type;
        }
    }
} 