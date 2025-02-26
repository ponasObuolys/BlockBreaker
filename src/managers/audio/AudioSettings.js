/**
 * AudioSettings - garso nustatymų komponentas
 * 
 * Šis komponentas sukuria garso nustatymų vartotojo sąsają,
 * kuri leidžia vartotojui valdyti garso efektų ir muzikos garsumą,
 * bei įjungti/išjungti garsą ir muziką.
 */
import { AudioManager } from './AudioManager.js';

export class AudioSettings {
    /**
     * Sukuria garso nustatymų komponentą
     * @param {HTMLElement} container - HTML elementas, kuriame bus rodomi garso nustatymai
     */
    constructor(container) {
        this.container = container;
        this.audioManager = AudioManager.getInstance();
        this.render();
    }

    /**
     * Atvaizduoja garso nustatymų komponentą
     */
    render() {
        // Išvalome konteinerį
        this.container.innerHTML = '';
        
        // Sukuriame garso nustatymų konteinerį
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'audio-settings';
        settingsContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            padding: 15px;
            color: white;
            font-family: 'Segoe UI', system-ui, sans-serif;
            width: 100%;
            max-width: 300px;
        `;
        
        // Antraštė
        const title = document.createElement('h3');
        title.textContent = 'Garso nustatymai';
        title.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
            text-align: center;
        `;
        settingsContainer.appendChild(title);
        
        // Garso efektų nustatymai
        settingsContainer.appendChild(this.createToggle(
            'Garso efektai',
            this.audioManager.soundEnabled,
            (enabled) => this.audioManager.toggleSound(enabled)
        ));
        
        settingsContainer.appendChild(this.createSlider(
            'Garso efektų garsumas',
            this.audioManager.soundVolume,
            (volume) => this.audioManager.setSoundVolume(volume)
        ));
        
        // Muzikos nustatymai
        settingsContainer.appendChild(this.createToggle(
            'Foninė muzika',
            this.audioManager.musicEnabled,
            (enabled) => this.audioManager.toggleMusic(enabled)
        ));
        
        settingsContainer.appendChild(this.createSlider(
            'Muzikos garsumas',
            this.audioManager.musicVolume,
            (volume) => this.audioManager.setMusicVolume(volume)
        ));
        
        // Pridedame nustatymus į konteinerį
        this.container.appendChild(settingsContainer);
    }

    /**
     * Sukuria jungiklį (toggle)
     * @param {string} label - Jungiklio etiketė
     * @param {boolean} initialValue - Pradinė jungiklio reikšmė
     * @param {Function} onChange - Funkcija, kuri bus iškviesta, kai jungiklio reikšmė pasikeis
     * @returns {HTMLElement} - Jungiklio elementas
     */
    createToggle(label, initialValue, onChange) {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        `;
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        
        const toggle = document.createElement('div');
        toggle.style.cssText = `
            width: 50px;
            height: 24px;
            background-color: ${initialValue ? '#4CAF50' : '#ccc'};
            border-radius: 12px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s;
        `;
        
        const slider = document.createElement('div');
        slider.style.cssText = `
            width: 20px;
            height: 20px;
            background-color: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: ${initialValue ? '28px' : '2px'};
            transition: left 0.3s;
        `;
        
        toggle.appendChild(slider);
        
        toggle.addEventListener('click', () => {
            const newValue = !toggle.classList.contains('active');
            if (newValue) {
                toggle.classList.add('active');
                toggle.style.backgroundColor = '#4CAF50';
                slider.style.left = '28px';
            } else {
                toggle.classList.remove('active');
                toggle.style.backgroundColor = '#ccc';
                slider.style.left = '2px';
            }
            onChange(newValue);
        });
        
        if (initialValue) {
            toggle.classList.add('active');
        }
        
        container.appendChild(labelElement);
        container.appendChild(toggle);
        
        return container;
    }

    /**
     * Sukuria slankiklį (slider)
     * @param {string} label - Slankiklio etiketė
     * @param {number} initialValue - Pradinė slankiklio reikšmė (0-1)
     * @param {Function} onChange - Funkcija, kuri bus iškviesta, kai slankiklio reikšmė pasikeis
     * @returns {HTMLElement} - Slankiklio elementas
     */
    createSlider(label, initialValue, onChange) {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-bottom: 15px;
        `;
        
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        labelElement.style.cssText = `
            display: block;
            margin-bottom: 5px;
        `;
        
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = initialValue;
        slider.style.cssText = `
            flex-grow: 1;
            height: 5px;
            -webkit-appearance: none;
            background: #ddd;
            outline: none;
            border-radius: 5px;
        `;
        
        // Stilius slankiklio "nykščiui"
        const thumbStyle = `
            slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
            
            slider::-moz-range-thumb {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = thumbStyle.replace(/slider/g, `.${slider.className}`);
        document.head.appendChild(style);
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = Math.round(initialValue * 100) + '%';
        valueDisplay.style.cssText = `
            min-width: 40px;
            text-align: right;
        `;
        
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            valueDisplay.textContent = Math.round(value * 100) + '%';
            onChange(value);
        });
        
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        
        container.appendChild(labelElement);
        container.appendChild(sliderContainer);
        
        return container;
    }
} 