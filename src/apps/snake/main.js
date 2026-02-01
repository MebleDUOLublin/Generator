// src/apps/snake/main.js

(function() {
    let appWindow = null;
    let canvas = null;
    let ctx = null;
    let gameState = 'MENU';
    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = { x: 0, y: 0 };
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameLoopInterval = null;

    const GRID_SIZE = 20;
    const GAME_STATES = { MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };

    function init(profile, windowEl) {
        appWindow = windowEl;
        canvas = windowEl.querySelector('#snakeCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        document.addEventListener('keydown', handleKeyDown);

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, 100);

        console.log("Neon Snake Initialized");
    }

    function resetGame() {
        snake = [{ x: 10, y: 10 }];
        food = getRandomFoodPosition();
        direction = { x: 0, y: 0 };
        score = 0;
        highScore = localStorage.getItem('snakeHighScore') || 0;
    }

    function getRandomFoodPosition() {
        const tileCount = canvas.width / GRID_SIZE;
        let position;
        do {
            position = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
        } while (snake.some(s => s.x === position.x && s.y === position.y));
        return position;
    }

    function handleKeyDown(e) {
        // Only handle keys if the snake window is focused
        if (!appWindow.classList.contains('focused')) return;

        switch (e.key) {
            case 'ArrowUp': if (direction.y === 0) direction = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (direction.y === 0) direction = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (direction.x === 0) direction = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (direction.x === 0) direction = { x: 1, y: 0 }; break;
            case 'Enter':
            case ' ':
                if (gameState !== GAME_STATES.PLAYING) {
                    gameState = GAME_STATES.PLAYING;
                    resetGame();
                }
                e.preventDefault();
                break;
        }
    }

    function gameLoop() {
        if (!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch(gameState) {
            case GAME_STATES.MENU: drawMenu(); break;
            case GAME_STATES.PLAYING: updateGame(); drawGame(); break;
            case GAME_STATES.GAME_OVER: drawGameOver(); break;
        }
    }

    function updateGame() {
        const tileCount = canvas.width / GRID_SIZE;
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || snake.some(s => s.x === head.x && s.y === head.y)) {
            gameState = GAME_STATES.GAME_OVER;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
            }
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            food = getRandomFoodPosition();
        } else {
            snake.pop();
        }
    }

    function drawGame() {
        drawGrid();
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        snake.forEach((segment, index) => {
            ctx.globalAlpha = 1 - (index / snake.length) * 0.5;
            ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        });
        ctx.globalAlpha = 1.0;
        drawScore();
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.shadowBlur = 0;
        const tileCount = canvas.width / GRID_SIZE;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE); ctx.stroke();
        }
    }

    function drawScore() {
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.fillText(`Score: ${score}`, 10, 25);
        ctx.fillText(`High Score: ${highScore}`, canvas.width - 150, 25);
    }

    function drawMenu() {
        drawText('NEON SNAKE', 60, canvas.height / 2 - 50);
        drawText('Press Enter to Start', 30, canvas.height / 2 + 20);
    }

    function drawGameOver() {
        drawText('GAME OVER', 60, canvas.height / 2 - 50);
        drawText(`Your Score: ${score}`, 40, canvas.height / 2 + 20);
        drawText('Press Enter to Restart', 20, canvas.height / 2 + 70);
    }

    function drawText(text, size, y) {
        ctx.fillStyle = '#00ffff';
        ctx.font = `bold ${size}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillText(text, canvas.width / 2, y);
        ctx.textAlign = 'left';
    }

    window.SnakeApp = { init };
})();
