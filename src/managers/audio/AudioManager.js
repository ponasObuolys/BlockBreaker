/**
 * AudioManager - garso valdymo klasė
 * 
 * Ši klasė yra atsakinga už visų žaidimo garsų valdymą:
 * - Garso efektų grojimą
 * - Foninės muzikos grojimą
 * - Garso nustatymų valdymą
 */
export class AudioManager {
    static instance = null;

    /**
     * Singleton pattern - grąžina vienintelę AudioManager instanciją
     */
    static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    constructor() {
        // Garso būsena
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;

        // Garso efektų cache
        this.soundEffects = new Map();
        
        // Foninė muzika
        this.backgroundMusic = null;
        
        // Garso failų keliai
        this.soundPaths = {
            ballHit: 'assets/audio/ball_hit.mp3',
            ballPaddle: 'assets/audio/ball_paddle.mp3',
            blockBreak: 'assets/audio/ball_break.mp3',
            gameOver: 'assets/audio/game_over.mp3',
            levelComplete: 'assets/audio/level_complete.mp3',
            powerUp: 'assets/audio/power_up.mp3',
            backgroundMusic: 'assets/audio/background_music.mp3'
        };
        
        // Bandome užkrauti garso nustatymus iš localStorage
        this.loadSettings();
        
        console.log('AudioManager: Sukurta nauja garso valdymo instancija');
    }

    /**
     * Užkrauna garso nustatymus iš localStorage
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('blockBreakerAudioSettings'));
            if (settings) {
                this.soundEnabled = settings.soundEnabled ?? true;
                this.musicEnabled = settings.musicEnabled ?? true;
                this.soundVolume = settings.soundVolume ?? 0.7;
                this.musicVolume = settings.musicVolume ?? 0.5;
                console.log('AudioManager: Garso nustatymai užkrauti iš localStorage');
            }
        } catch (error) {
            console.error('AudioManager: Klaida užkraunant garso nustatymus:', error);
        }
    }

    /**
     * Išsaugo garso nustatymus į localStorage
     */
    saveSettings() {
        try {
            const settings = {
                soundEnabled: this.soundEnabled,
                musicEnabled: this.musicEnabled,
                soundVolume: this.soundVolume,
                musicVolume: this.musicVolume
            };
            localStorage.setItem('blockBreakerAudioSettings', JSON.stringify(settings));
            console.log('AudioManager: Garso nustatymai išsaugoti į localStorage');
        } catch (error) {
            console.error('AudioManager: Klaida išsaugant garso nustatymus:', error);
        }
    }

    /**
     * Užkrauna garso efektą
     * @param {string} soundName - Garso efekto pavadinimas
     * @returns {Promise<AudioBuffer>} - Pažadas su garso bufferiu
     */
    async loadSound(soundName) {
        if (!this.soundPaths[soundName]) {
            console.error(`AudioManager: Garso efektas '${soundName}' nerastas`);
            return null;
        }

        if (this.soundEffects.has(soundName)) {
            return this.soundEffects.get(soundName);
        }

        try {
            const response = await fetch(this.soundPaths[soundName]);
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            this.soundEffects.set(soundName, {
                buffer: audioBuffer,
                context: audioContext
            });
            
            console.log(`AudioManager: Garso efektas '${soundName}' užkrautas`);
            return this.soundEffects.get(soundName);
        } catch (error) {
            console.error(`AudioManager: Klaida užkraunant garso efektą '${soundName}':`, error);
            return null;
        }
    }

    /**
     * Groja garso efektą
     * @param {string} soundName - Garso efekto pavadinimas
     */
    async playSound(soundName) {
        if (!this.soundEnabled) return;

        try {
            const sound = await this.loadSound(soundName);
            if (!sound) return;

            const source = sound.context.createBufferSource();
            source.buffer = sound.buffer;
            
            const gainNode = sound.context.createGain();
            gainNode.gain.value = this.soundVolume;
            
            source.connect(gainNode);
            gainNode.connect(sound.context.destination);
            
            source.start(0);
            console.log(`AudioManager: Grojamas garso efektas '${soundName}'`);
        } catch (error) {
            console.error(`AudioManager: Klaida grojant garso efektą '${soundName}':`, error);
        }
    }

    /**
     * Pradeda groti foninę muziką
     */
    async playBackgroundMusic() {
        if (!this.musicEnabled) return;
        if (this.backgroundMusic) return;

        try {
            const audio = new Audio(this.soundPaths.backgroundMusic);
            audio.loop = true;
            audio.volume = this.musicVolume;
            
            this.backgroundMusic = audio;
            
            // Pradedame groti tik po vartotojo sąveikos
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('AudioManager: Klaida grojant foninę muziką:', error);
                    // Jei nepavyko groti, bandysime vėl po vartotojo sąveikos
                    document.addEventListener('click', () => {
                        if (this.musicEnabled && !this.backgroundMusic.playing) {
                            this.backgroundMusic.play().catch(e => 
                                console.error('AudioManager: Klaida grojant foninę muziką po vartotojo sąveikos:', e)
                            );
                        }
                    }, { once: true });
                });
            }
            
            console.log('AudioManager: Pradėta groti foninė muzika');
        } catch (error) {
            console.error('AudioManager: Klaida grojant foninę muziką:', error);
        }
    }

    /**
     * Sustabdo foninę muziką
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusic = null;
            console.log('AudioManager: Sustabdyta foninė muzika');
        }
    }

    /**
     * Įjungia/išjungia garso efektus
     * @param {boolean} enabled - Ar garso efektai įjungti
     */
    toggleSound(enabled) {
        this.soundEnabled = enabled !== undefined ? enabled : !this.soundEnabled;
        this.saveSettings();
        console.log(`AudioManager: Garso efektai ${this.soundEnabled ? 'įjungti' : 'išjungti'}`);
    }

    /**
     * Įjungia/išjungia foninę muziką
     * @param {boolean} enabled - Ar foninė muzika įjungta
     */
    toggleMusic(enabled) {
        this.musicEnabled = enabled !== undefined ? enabled : !this.musicEnabled;
        
        if (this.musicEnabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        
        this.saveSettings();
        console.log(`AudioManager: Foninė muzika ${this.musicEnabled ? 'įjungta' : 'išjungta'}`);
    }

    /**
     * Nustato garso efektų garsumą
     * @param {number} volume - Garso efektų garsumas (0-1)
     */
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
        console.log(`AudioManager: Garso efektų garsumas nustatytas į ${this.soundVolume}`);
    }

    /**
     * Nustato foninės muzikos garsumą
     * @param {number} volume - Foninės muzikos garsumas (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
        
        this.saveSettings();
        console.log(`AudioManager: Foninės muzikos garsumas nustatytas į ${this.musicVolume}`);
    }
} 