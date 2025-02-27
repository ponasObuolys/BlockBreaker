# Block Breaker

![Block Breaker Logo](https://via.placeholder.com/800x200/1a1a2e/ffffff?text=Block+Breaker)

## Apie projektą

"Block Breaker" yra modernus Arkanoid/Breakout stiliaus žaidimas, sukurtas naudojant JavaScript ir HTML5 Canvas. Žaidime reikia sunaikinti blokus, atmušant kamuoliuką nuo žaidėjo valdomos platformos. Žaidimas pasižymi įvairiais lygiais, bonusų sistema ir galimybe žaisti dviem žaidėjams.

### Pagrindinės funkcijos

- **Vieno arba dviejų žaidėjų režimai**
- **Progresuojantys lygiai** su didėjančiu sudėtingumu
- **Bonusų sistema** su skirtingais efektais:
  - Trajektorijos rodymas
  - Didesnis kamuoliukas
  - Trigubas kamuoliukas
  - Platesnė platforma
  - Sprogstantis kamuoliukas
- **Vizualiniai efektai** (dalelių sistema, fejerverkai)
- **Rezultatų išsaugojimas** ir geriausių rezultatų lentelė

## Kaip pradėti

### Reikalavimai

- Moderni interneto naršyklė su HTML5 ir JavaScript palaikymu
- Interneto ryšys (jei žaidžiama interneto svetainėje)

### Instaliavimas

1. Atsisiųskite arba klonuokite repozitoriją:
   ```
   git clone https://github.com/ponasObuolys/BlockBreaker.git
   ```

2. Atidarykite `index.html` failą savo naršyklėje arba naudokite lokalų serverį:
   ```
   npx http-server -o
   ```

## Kaip žaisti

### Valdymas

- **Vieno žaidėjo režimas**:
  - Judėjimas kairėn: `A` arba `←` (kairėn rodyklė)
  - Judėjimas dešinėn: `D` arba `→` (dešinėn rodyklė)
  - Paleisti kamuoliuką: `S` arba `↓` (žemyn rodyklė)

- **Dviejų žaidėjų režimas**:
  - **Kairysis žaidėjas**:
    - Judėjimas kairėn: `A`
    - Judėjimas dešinėn: `D`
    - Paleisti kamuoliuką: `S`
  - **Dešinysis žaidėjas**:
    - Judėjimas kairėn: `←` (kairėn rodyklė)
    - Judėjimas dešinėn: `→` (dešinėn rodyklė)
    - Paleisti kamuoliuką: `↓` (žemyn rodyklė)

### Žaidimo tikslas

Sunaikinti visus blokus kiekviename lygyje, atmušant kamuoliuką nuo platformos. Stenkitės neprarasti kamuoliuko - turite ribotą gyvybių skaičių. Rinkite bonusus, kurie padės įveikti sudėtingesnius lygius.

## Projekto struktūra

```
BlockBreaker/
├── index.html          # Pagrindinis HTML failas
├── src/                # Šaltinio kodas
│   ├── Game.js         # Pagrindinis žaidimo failas
│   ├── config/         # Konfigūracijos failai
│   │   └── constants.js
│   ├── entities/       # Žaidimo esybės
│   │   ├── Ball.js
│   │   ├── Block.js
│   │   └── Paddle.js
│   ├── effects/        # Vizualiniai efektai
│   │   ├── Effect.js
│   │   ├── Firework.js
│   │   └── PowerUp.js
│   └── managers/       # Žaidimo valdymo klasės
│       └── GameManager.js
└── ROADMAP.md          # Projekto vystymo planas
```

## Technologijos

- **JavaScript (ES6+)** - pagrindinė programavimo kalba
- **HTML5 Canvas** - žaidimo atvaizdavimui
- **React** - rezultatų lentelei
- **Tailwind CSS** - stilizavimui

## Vystymo planas

Žaidimo vystymo planas yra aprašytas [ROADMAP.md](ROADMAP.md) faile. Jame rasite informaciją apie planuojamus patobulinimus ir naujus funkcionalumus.

## Prisidėjimas

Norite prisidėti prie projekto? Puiku! Štai keletas būdų, kaip galite padėti:

1. Praneškite apie klaidas arba pasiūlykite naujus funkcionalumus
2. Pasiūlykite kodo pataisymus (Pull Requests)
3. Pasidalinkite žaidimu su draugais ir bendruomene

## Licencija

Šis projektas yra platinamas pagal MIT licenciją. Daugiau informacijos rasite [LICENSE](LICENSE) faile.

## Autorius

Sukurta su ❤️ [ponas Obuolys](https://github.com/ponasObuolys)

---

*Paskutinį kartą atnaujinta: 2023-02-26* 