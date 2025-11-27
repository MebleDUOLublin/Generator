/**
 * PESTECZKA OS - NEON SNAKE GAME
 */
const NeonSnake = (() => {
    let canvas, ctx;
    let snake, food, score, direction, gridSize, intervalId;
    const TILE_SIZE = 20;

    const init = (canvasId) => {
        canvas = document.getElementById(canvasId);
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Set canvas size based on its container
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        gridSize = {
            width: Math.floor(canvas.width / TILE_SIZE),
            height: Math.floor(canvas.height / TILE_SIZE)
        };

        document.addEventListener('keydown', handleKeyPress);
        startGame();
    };

    const startGame = () => {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        spawnFood();

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(gameLoop, 100);
    };

    const gameLoop = () => {
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
            startGame();
            return;
        }

        snake.unshift(head);

        // Check for food
        if (head.x === food.x && head.y === food.y) {
            score++;
            spawnFood();
        } else {
            snake.pop();
        }
    };

    const draw = () => {
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw food
        drawRect(food.x, food.y, '#f43f5e', '#f43f5e');

        // Draw snake
        snake.forEach((segment, index) => {
            const color = index === 0 ? '#34d399' : '#10b981';
            drawRect(segment.x, segment.y, color, color);
        });

        // Draw score
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '20px "JetBrains Mono", monospace';
        ctx.fillText(`Score: ${score}`, 20, 30);
    };

    const drawRect = (x, y, fillStyle, strokeStyle) => {
        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
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
