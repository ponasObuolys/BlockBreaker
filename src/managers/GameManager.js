import { Game } from '../Game.js';
import { AudioManager } from './audio/AudioManager.js';
import { AudioSettings } from './audio/AudioSettings.js';

export class GameError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GameError';
    }
}

export class GameManager {
    static instance = null;

    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    constructor() {
        this.game1 = null;
        this.game2 = null;
        this.gameLoop = null;
        this.isRunning = false;
        
        // Inicializuojame garso valdiklį
        this.audioManager = AudioManager.getInstance();
        
        // Sukuriame garso nustatymų mygtuką
        this.createAudioSettingsButton();
    }

    /**
     * Sukuria garso nustatymų mygtuką
     */
    createAudioSettingsButton() {
        // Sukuriame mygtuką
        const button = document.createElement('button');
        button.textContent = '🔊';
        button.title = 'Garso nustatymai';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 20px;
            border: none;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
        `;
        
        // Pridedame hover efektą
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
        
        // Sukuriame konteinerį nustatymams
        const settingsContainer = document.createElement('div');
        settingsContainer.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 999;
            display: none;
        `;
        
        // Sukuriame garso nustatymų komponentą
        const audioSettings = new AudioSettings(settingsContainer);
        
        // Pridedame įvykio klausytoją mygtukui
        button.addEventListener('click', () => {
            if (settingsContainer.style.display === 'none') {
                settingsContainer.style.display = 'block';
            } else {
                settingsContainer.style.display = 'none';
            }
        });
        
        // Pridedame elementus į DOM
        document.body.appendChild(button);
        document.body.appendChild(settingsContainer);
    }

    validateCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new GameError(`Canvas elementas '${canvasId}' nerastas`);
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new GameError(`Nepavyko gauti 2D konteksto canvas elementui '${canvasId}'`);
        }
        return { canvas, ctx };
    }

    startGame(mode) {
        console.log('GameManager: Pradedamas žaidimas, režimas:', mode);
        try {
            this.stopCurrentGame();
            
            if (mode === 'single') {
                const { canvas: canvas1 } = this.validateCanvas('gameCanvas1');
                this.game1 = new Game('gameCanvas1', {
                    left: ['a', 'ArrowLeft'],
                    right: ['d', 'ArrowRight'],
                    down: ['s', 'ArrowDown']
                });
                console.log('GameManager: Sukurtas vieno žaidėjo režimas');
            } else {
                const { canvas: canvas1 } = this.validateCanvas('gameCanvas1');
                const { canvas: canvas2 } = this.validateCanvas('gameCanvas2');
                
                this.game1 = new Game('gameCanvas1', {
                    left: ['a'],
                    right: ['d'],
                    down: ['s']
                });
                this.game2 = new Game('gameCanvas2', {
                    left: ['ArrowLeft'],
                    right: ['ArrowRight'],
                    down: ['ArrowDown']
                });
                console.log('GameManager: Sukurtas dviejų žaidėjų režimas');
            }

            this.startGameLoop();
            this.isRunning = true;
            console.log('GameManager: Žaidimas sėkmingai paleistas');
        } catch (error) {
            console.error('GameManager klaida:', error);
            this.handleError(error);
        }
    }

    stopCurrentGame() {
        if (this.gameLoop) {
            console.log('GameManager: Stabdomas esamas žaidimas');
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        this.game1 = null;
        this.game2 = null;
        this.isRunning = false;
        
        // Sustabdome foninę muziką
        this.audioManager.stopBackgroundMusic();
    }

    startGameLoop() {
        const loop = () => {
            try {
                if (this.game1) {
                    this.game1.update();
                    this.game1.draw();
                }
                if (this.game2) {
                    this.game2.update();
                    this.game2.draw();
                }
                this.gameLoop = requestAnimationFrame(loop);
            } catch (error) {
                console.error('Žaidimo ciklo klaida:', error);
                this.handleError(error);
            }
        };
        
        console.log('GameManager: Pradedamas žaidimo ciklas');
        loop();
    }

    handleError(error) {
        const errorMessage = error instanceof GameError ? error.message : 'Įvyko nenumatyta klaida';
        alert(`Klaida: ${errorMessage}`);
        this.stopCurrentGame();
    }
} 