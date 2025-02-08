const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Žaidimo objektai
const paddle = {
    x: canvas.width/2 - 50,
    y: canvas.height - 30,
    width: 100,
    height: 10,
    speed: 8,
    color: 'blue'
};

const ball = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 5,
    speed: 2,
    dx: 2,
    dy: -2,
    color: 'red'
};

const blocks = [];
const blockColors = ['red', 'orange', 'yellow', 'green', 'blue'];
let score = 0;
let gameOver = false;
let gameWon = false;

// Blokų sukūrimas
function createBlocks() {
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 8; j++) {
            blocks.push({
                x: 50 + j * 70,
                y: 50 + i * 30,
                width: 60,
                height: 20,
                color: blockColors[i],
                visible: true
            });
        }
    }
}

// Žaidimo valdymas
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (e.key === 'ArrowRight' && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
    if (e.key === 'r' && (gameOver || gameWon)) {
        resetGame();
    }
});

function resetGame() {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.dx = 2;
    ball.dy = -2;
    score = 0;
    blocks.length = 0;
    createBlocks();
    gameOver = false;
    gameWon = false;
}

function draw() {
    // Išvalome canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Piešiame kamuoliuką
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
    
    // Piešiame platformą
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Piešiame blokus
    blocks.forEach(block => {
        if (block.visible) {
            ctx.fillStyle = block.color;
            ctx.fillRect(block.x, block.y, block.width, block.height);
        }
    });
    
    // Rodome rezultatą
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Score: ${score}`, 8, 20);
    
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', canvas.width/2 - 120, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2 - 80, canvas.height/2 + 50);
    }
    
    if (gameWon) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.fillText('YOU WIN!', canvas.width/2 - 100, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2 - 80, canvas.height/2 + 50);
    }
}

function update() {
    if (gameOver || gameWon) return;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Sienos kolizijos
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }
    
    // Žaidimo pabaiga
    if (ball.y + ball.radius > canvas.height) {
        gameOver = true;
    }
    
    // Platformos kolizija
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        ball.dy = -Math.abs(ball.dy);
    }
    
    // Blokų kolizija
    blocks.forEach(block => {
        if (block.visible &&
            ball.x > block.x &&
            ball.x < block.x + block.width &&
            ball.y > block.y &&
            ball.y < block.y + block.height) {
            ball.dy *= -1;
            block.visible = false;
            score += 10;
            
            // Tikriname pergalę
            if (blocks.every(block => !block.visible)) {
                gameWon = true;
            }
        }
    });
}

function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

createBlocks();
gameLoop(); 