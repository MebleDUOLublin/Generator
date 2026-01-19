// src/apps/snake/main.js

const NeonSnake = {
    // Game state and properties will be attached to this object
    // e.g., this.canvas, this.ctx, this.gameState, etc.
};

NeonSnake.init = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
        console.error("Snake canvas not found!");
        return;
    }
    this.ctx = this.canvas.getContext('2d');

    // Unbind previous listeners if any, to prevent duplicates
    if (this.boundKeyDown) {
        document.removeEventListener('keydown', this.boundKeyDown);
    }

    this.GAME_STATES = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        GAME_OVER: 'GAME_OVER'
    };
    this.gameState = this.GAME_STATES.MENU;

    this.GRID_SIZE = 20;
    this.TILE_COUNT = this.canvas.width / this.GRID_SIZE;

    this.resetGame();

    this.boundKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.boundKeyDown);

    if (this.gameLoopInterval) {
        clearInterval(this.gameLoopInterval);
    }
    this.gameLoopInterval = setInterval(this.gameLoop.bind(this), 100);

    console.log("Neon Snake Initialized");
};

NeonSnake.resetGame = function() {
    this.snake = [{ x: 10, y: 10 }];
    this.food = this.getRandomFoodPosition();
    this.direction = { x: 0, y: 0 };
    this.score = 0;
    this.highScore = localStorage.getItem('snakeHighScore') || 0;
};

NeonSnake.getRandomFoodPosition = function() {
    let position;
    do {
        position = {
            x: Math.floor(Math.random() * this.TILE_COUNT),
            y: Math.floor(Math.random() * this.TILE_COUNT)
        };
    } while (this.isSnakeOn(position.x, position.y));
    return position;
};

NeonSnake.isSnakeOn = function(x, y) {
    return this.snake.some(segment => segment.x === x && segment.y === y);
};

NeonSnake.handleKeyDown = function(e) {
    switch (e.key) {
        case 'ArrowUp':
            if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
            break;
        case 'Enter':
        case ' ': // Spacebar
             if (this.gameState !== this.GAME_STATES.PLAYING) {
                this.gameState = this.GAME_STATES.PLAYING;
                this.resetGame();
            }
            e.preventDefault(); // Prevent spacebar from scrolling
            break;
    }
};


NeonSnake.gameLoop = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch(this.gameState) {
        case this.GAME_STATES.MENU:
            this.drawMenu();
            break;
        case this.GAME_STATES.PLAYING:
            this.updateGame();
            this.drawGame();
            break;
        case this.GAME_STATES.GAME_OVER:
            this.drawGameOver();
            break;
    }
};

NeonSnake.updateGame = function() {
    const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

    // Check for collisions
    if (head.x < 0 || head.x >= this.TILE_COUNT || head.y < 0 || head.y >= this.TILE_COUNT || this.isSnakeOn(head.x, head.y)) {
        this.gameState = this.GAME_STATES.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        return;
    }

    this.snake.unshift(head);

    // Check for food
    if (head.x === this.food.x && head.y === this.food.y) {
        this.score++;
        this.food = this.getRandomFoodPosition();
    } else {
        this.snake.pop();
    }
};

NeonSnake.drawGame = function() {
    this.drawGrid();

    // Draw food
    this.ctx.fillStyle = '#ff00ff';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#ff00ff';
    this.ctx.fillRect(this.food.x * this.GRID_SIZE, this.food.y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);

    // Draw snake
    this.ctx.fillStyle = '#00ffff';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#00ffff';
    this.snake.forEach((segment, index) => {
        this.ctx.globalAlpha = 1 - (index / this.snake.length) * 0.5;
        this.ctx.fillRect(segment.x * this.GRID_SIZE, segment.y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);
    });
    this.ctx.globalAlpha = 1.0;

    this.drawScore();
};

NeonSnake.drawGrid = function() {
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    this.ctx.shadowBlur = 0;
    for (let i = 0; i <= this.TILE_COUNT; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * this.GRID_SIZE, 0);
        this.ctx.lineTo(i * this.GRID_SIZE, this.canvas.height);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * this.GRID_SIZE);
        this.ctx.lineTo(this.canvas.width, i * this.GRID_SIZE);
        this.ctx.stroke();
    }
};

NeonSnake.drawScore = function() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px "JetBrains Mono", monospace';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = '#ffffff';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 150, 25);
};

NeonSnake.drawMenu = function() {
    this.drawText('NEON SNAKE', 60, this.canvas.height / 2 - 50);
    this.drawText('Press Enter to Start', 30, this.canvas.height / 2 + 20);
};

NeonSnake.drawGameOver = function() {
    this.drawText('GAME OVER', 60, this.canvas.height / 2 - 50);
    this.drawText(`Your Score: ${this.score}`, 40, this.canvas.height / 2 + 20);
    this.drawText('Press Enter to Restart', 20, this.canvas.height / 2 + 70);
};

NeonSnake.drawText = function(text, size, y) {
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = `bold ${size}px "JetBrains Mono", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#00ffff';
    this.ctx.fillText(text, this.canvas.width / 2, y);
    this.ctx.textAlign = 'left'; // Reset
};

window.SnakeApp = {
    init: () => NeonSnake.init('snakeCanvas')
};
