/**
 * PESTECZKA OS - NEON SNAKE GAME v2.0
 * A more polished and feature-rich version of the classic snake game.
 */
const NeonSnake = (() => {
    // Canvas and rendering context
    let canvas, ctx;

    // Game state variables
    let snake, food, score, highScore, direction, gridSize, intervalId, isPaused, isGameOver, gameState;

    // Constants
    const TILE_SIZE = 20;
    const HIGH_SCORE_KEY = 'neonSnakeHighScore';

    // Game States
    const GAME_STATE = {
        MENU: 'menu',
        PLAYING: 'playing',
        GAME_OVER: 'game_over'
    };

    /**
     * Initializes the game engine.
     * @param {string} canvasId - The ID of the canvas element.
     */
    const init = (canvasId) => {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Dynamically set canvas size based on its container
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        gridSize = {
            width: Math.floor(canvas.width / TILE_SIZE),
            height: Math.floor(canvas.height / TILE_SIZE)
        };

        // Load high score from local storage
        highScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;

        // Setup event listeners
        document.removeEventListener('keydown', handleKeyPress); // Remove old listener
        document.addEventListener('keydown', handleKeyPress);

        // Set initial state
        gameState = GAME_STATE.MENU;

        // Start the main game loop
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(gameLoop, 100);
    };

    /**
     * Resets the game to its initial state and starts a new round.
     */
    const startGame = () => {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        isPaused = false;
        isGameOver = false; // Kept for simplicity in some checks
        gameState = GAME_STATE.PLAYING;
        spawnFood();
    };

    /**
     * The main game loop, called every 100ms.
     */
    const gameLoop = () => {
        if (isPaused) return;

        switch (gameState) {
            case GAME_STATE.PLAYING:
                update();
                break;
            case GAME_STATE.MENU:
            case GAME_STATE.GAME_OVER:
                // No update logic, just draw
                break;
        }
        draw();
    };

    /**
     * Updates the game state (snake position, collisions, etc.).
     */
    const update = () => {
        const head = { ...snake[0] };
        switch (direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check for wall or self-collision
        if (head.x < 0 || head.x >= gridSize.width || head.y < 0 || head.y >= gridSize.height || isCollidingWithBody(head)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        // Check for eating food
        if (head.x === food.x && head.y === food.y) {
            score++;
            spawnFood();
        } else {
            snake.pop();
        }
    };

    /**
     * Draws everything on the canvas.
     */
    const draw = () => {
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        switch (gameState) {
            case GAME_STATE.MENU:
                drawMenu();
                break;
            case GAME_STATE.PLAYING:
                drawGame();
                break;
            case GAME_STATE.GAME_OVER:
                drawGameOver();
                break;
        }
    };

    /**
     * Draws the main menu screen.
     */
    const drawMenu = () => {
        drawText('Neon Snake', canvas.width / 2, canvas.height / 2 - 80, 50, '#34d399');
        drawText('Use Arrow Keys or WASD to move', canvas.width / 2, canvas.height / 2);
        drawText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 40, 20);
    };

    /**
     * Draws the game elements (snake, food, score).
     */
    const drawGame = () => {
        // Draw food
        drawRect(food.x, food.y, '#f43f5e');

        // Draw snake
        snake.forEach((segment, index) => {
            const color = index === 0 ? '#34d399' : '#10b981';
            drawRect(segment.x, segment.y, color);
        });

        // Draw score
        drawText(`Score: ${score}`, 20, 30, 20, '#e2e8f0', 'left');
        drawText(`High Score: ${highScore}`, canvas.width - 20, 30, 20, '#e2e8f0', 'right');
    };

    /**
     * Draws the game over screen with a glitch effect.
     */
    const drawGameOver = () => {
        drawGame(); // Draw the final state of the game in the background

        // Overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glitch effect for text
        for (let i = 0; i < 5; i++) {
            const offsetX = Math.random() * 8 - 4;
            const offsetY = Math.random() * 8 - 4;
            const color = ['#f43f5e', '#34d399', '#e2e8f0'][Math.floor(Math.random() * 3)];
            drawText('GAME OVER', canvas.width / 2 + offsetX, canvas.height / 2 - 40 + offsetY, 50, color);
        }

        drawText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        drawText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60, 20);
    };

    /**
     * Helper function to draw styled text on the canvas.
     */
    const drawText = (text, x, y, size = 16, color = '#e2e8f0', align = 'center') => {
        ctx.fillStyle = color;
        ctx.font = `${size}px "JetBrains Mono", monospace`;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    };

    /**
     * Triggers the game over state.
     */
    const gameOver = () => {
        gameState = GAME_STATE.GAME_OVER;
        isGameOver = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_SCORE_KEY, highScore);
        }
    };

    /**
     * Draws a glowing rectangle for snake segments and food.
     */
    const drawRect = (x, y, color) => {
        const posX = x * TILE_SIZE;
        const posY = y * TILE_SIZE;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
        ctx.restore();
    };

    /**
     * Generates a new position for the food, ensuring it's not on the snake.
     */
    const spawnFood = () => {
        do {
            food = {
                x: Math.floor(Math.random() * gridSize.width),
                y: Math.floor(Math.random() * gridSize.height)
            };
        } while (isCollidingWithBody(food));
    };

    /**
     * Checks if a given position collides with the snake's body.
     */
    const isCollidingWithBody = (pos) => {
        return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
    };

    /**
     * Handles all key presses for game control.
     */
    const handleKeyPress = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (gameState === GAME_STATE.PLAYING) {
                isPaused = !isPaused;
            } else {
                startGame();
            }
            return;
        }

        if (gameState !== GAME_STATE.PLAYING) return;

        const keyMap = {
            'ArrowUp': 'up', 'w': 'up',
            'ArrowDown': 'down', 's': 'down',
            'ArrowLeft': 'left', 'a': 'left',
            'ArrowRight': 'right', 'd': 'right'
        };

        const newDirection = keyMap[e.key];
        if (newDirection) {
            e.preventDefault();
            const oppositeDirections = {
                'up': 'down', 'down': 'up',
                'left': 'right', 'right': 'left'
            };
            if (snake.length === 1 || direction !== oppositeDirections[newDirection]) {
                direction = newDirection;
            }
        }
    };

    return { init };
})();
