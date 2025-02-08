// Žaidimo lygių konfigūracija
export const LEVELS = [
    { rows: 5, cols: 8 },
    { rows: 6, cols: 9 },
    { rows: 7, cols: 10 },
    { rows: 8, cols: 11 },
    { rows: 9, cols: 12 }
];

// Bonusų tipai ir jų parametrai
export const POWERUPS = {
    TRAJECTORY: {
        icon: '📍',
        duration: 15000,
        chance: 0.1,
        color: '#ffff00'
    },
    LARGE_BALL: {
        icon: '⚪',
        duration: 10000,
        chance: 0.1,
        color: '#ff4444'
    },
    TRIPLE_BALL: {
        icon: '🔮',
        duration: 20000,
        chance: 0.05,
        color: '#44ff44'
    },
    WIDE_PADDLE: {
        icon: '📏',
        duration: 25000,
        chance: 0.15,
        color: '#4444ff'
    },
    EXPLOSIVE_BALL: {
        icon: '💣',
        duration: 12000,
        chance: 0.08,
        color: '#ff44ff'
    }
};

// Žaidimo konfigūracija
export const GAME_CONFIG = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 600,
    INITIAL_LIVES: 3,
    MAX_LIVES: 3,
    PADDLE_WIDTH: 100,
    PADDLE_HEIGHT: 10,
    PADDLE_SPEED: 6,
    BALL_RADIUS: 5,
    BALL_SPEED: 1.5,
    BLOCK_WIDTH: 50,
    BLOCK_HEIGHT: 20,
    BLOCK_PADDING: 10,
    SPEED_INCREASE_INTERVAL: 10000,
    SPEED_INCREASE_FACTOR: 1.05,
    LEVEL_SPEED_INCREASE: 1.1
}; 