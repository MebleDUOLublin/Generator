/**
 * PESTECZKA OS - NEON SNAKE GAME
 */
const NeonSnake = (() => {
    let canvas, ctx;
    let snake, food, score, highScore, direction, gridSize, intervalId, isPaused, isGameOver, isShaking, shakeIntervalId;
    const TILE_SIZE = 20;
    const HIGH_SCORE_KEY = 'neonSnakeHighScore';

    const init = (canvasId) => {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (shakeIntervalId) clearInterval(shakeIntervalId);

        // Set canvas size based on its container
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        gridSize = {
            width: Math.floor(canvas.width / TILE_SIZE),
            height: Math.floor(canvas.height / TILE_SIZE)
        };

        highScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;
        document.addEventListener('keydown', handleKeyPress);
        canvas.addEventListener('click', handleCanvasClick);
        startGame();
    };

    const startGame = () => {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        isPaused = false;
        isGameOver = false;
        isShaking = false;
        if (shakeIntervalId) clearInterval(shakeIntervalId);
        spawnFood();

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(gameLoop, 100);
    };

    const gameLoop = () => {
        if (isPaused || isGameOver) return;
        update();
        draw();
    };

    const update = () => {
        const head = { ...snake[0] };
        switch (direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for collisions
        if (head.x < 0 || head.x >= gridSize.width || head.y < 0 || head.y >= gridSize.height || isCollidingWithBody(head)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        // Check for food
        if (head.x === food.x && head.y === food.y) {
            score++;
            spawnFood();
            // Increase speed every 5 points
            if (score % 5 === 0) {
                clearInterval(intervalId);
                const newSpeed = Math.max(50, 100 - (score / 5) * 10);
                intervalId = setInterval(gameLoop, newSpeed);
            }
        } else {
            snake.pop();
        }
    };

    const draw = () => {
        ctx.save();
        if (isShaking) {
            const shakeX = Math.random() * 10 - 5;
            const shakeY = Math.random() * 10 - 5;
            ctx.translate(shakeX, shakeY);
        }
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

        // Draw food
        const foodPulse = Math.abs(Math.sin(Date.now() / 200));
        const foodColor = `rgba(244, 63, 94, ${0.7 + foodPulse * 0.3})`;
        drawRect(food.x, food.y, foodColor, foodColor);

        // Draw snake
        snake.forEach((segment, index) => {
            const color = index === 0 ? '#34d399' : '#10b981';
            drawRect(segment.x, segment.y, color, color);
        });

        // Draw score
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText(`Score: ${score}`, 20, 30);
        ctx.fillText(`High Score: ${highScore}`, canvas.width - 200, 30);

        if (isGameOver) {
            drawGameOver();
        }
        ctx.restore();
    };

    const gameOver = () => {
        isGameOver = true;
        clearInterval(intervalId);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_SCORE_KEY, highScore);
        }
        isShaking = true;
        if (shakeIntervalId) clearInterval(shakeIntervalId);
        shakeIntervalId = setInterval(draw, 30);

        setTimeout(() => {
            isShaking = false;
            clearInterval(shakeIntervalId);
            draw();
        }, 500);
        draw(); // One final draw to show the game over screen
    };

    const drawGameOver = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

        ctx.font = '48px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        if (isShaking) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.fillText('Game Over', canvas.width / 2 + Math.random() * 6 - 3, canvas.height / 2 - 60);
            ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
            ctx.fillText('Game Over', canvas.width / 2 + Math.random() * 6 - 3, canvas.height / 2 - 60);
        }

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = '48px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 60);

        ctx.font = '24px "JetBrains Mono", monospace';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '16px "JetBrains Mono", monospace';
        ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 50);
        ctx.textAlign = 'left';
    };

    const handleCanvasClick = () => {
        if (isGameOver) {
            startGame();
        }
    };

    const drawRect = (x, y, fillStyle, strokeStyle) => {
        ctx.shadowBlur = 20;
        ctx.shadowColor = fillStyle;

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    };

    const spawnFood = () => {
        food = {
            x: Math.floor(Math.random() * gridSize.width),
            y: Math.floor(Math.random() * gridSize.height)
        };
    };

    const isCollidingWithBody = (head) => {
        return snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    };

    const handleKeyPress = (e) => {
        if (e.key === ' ') {
            isPaused = !isPaused;
            return;
        }

        const keyMap = {
            'ArrowUp': 'up', 'w': 'up',
            'ArrowDown': 'down', 's': 'down',
            'ArrowLeft': 'left', 'a': 'left',
            'ArrowRight': 'right', 'd': 'right'
        };

        const newDirection = keyMap[e.key];
        if (newDirection) {
            const oppositeDirections = {
                'up': 'down', 'down': 'up',
                'left': 'right', 'right': 'left'
            };
            if (direction !== oppositeDirections[newDirection]) {
                direction = newDirection;
            }
        }
    };

    return { init };
})();
