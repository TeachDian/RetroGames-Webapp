document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tetrisCanvas');
    const context = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const playerNameInput = document.getElementById('playerName');
    const startGameButton = document.getElementById('startGame');
    const pauseGameButton = document.getElementById('pauseGame');
    const resumeGameButton = document.getElementById('resumeGame');
    const highScoreList = document.getElementById('highScoreList');
    const scale = 32;
    const rows = 20;
    const cols = 10;
    let board = createBoard();
    let score = 0;
    let paused = false;
    let playerName = '';

    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D',
        '#FFE138',
        '#3877FF',
    ];

    const tetrominoes = [
        [[1, 1, 1, 1]],
        [[2, 2], [2, 2]],
        [[0, 3, 0], [3, 3, 3]],
        [[4, 4, 0], [0, 4, 4]],
        [[0, 5, 5], [5, 5, 0]],
        [[6, 6, 6], [0, 0, 6]],
        [[7, 7, 7], [7, 0, 0]],
    ];

    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        score: 0
    };

    function createBoard() {
        const board = [];
        for (let row = 0; row < rows; row++) {
            board.push(new Array(cols).fill(0));
        }
        return board;
    }

    function drawBoard() {
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawMatrix(board, { x: 0, y: 0 });
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
                    context.strokeStyle = '#000';
                    context.lineWidth = 1;
                    context.strokeRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
                }
            });
        });
    }

    function merge(board, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    function collide(board, player) {
        const [matrix, offset] = [player.matrix, player.pos];
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0 &&
                    (board[y + offset.y] &&
                        board[y + offset.y][x + offset.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                        matrix[y][x],
                        matrix[x][y],
                    ];
            }
        }

        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function playerDrop() {
        player.pos.y++;
        if (collide(board, player)) {
            player.pos.y--;
            merge(board, player);
            playerReset();
            boardSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(board, player)) {
            player.pos.x -= dir;
        }
    }

    function playerReset() {
        const pieces = 'TJLOSZI';
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.pos.y = 0;
        player.pos.x = (board[0].length / 2 | 0) -
            (player.matrix[0].length / 2 | 0);
        if (collide(board, player)) {
            saveHighScore(playerName, player.score);
            loadHighScores();
            board.forEach(row => row.fill(0));
            player.score = 0;
            updateScore();
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(board, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function boardSweep() {
        outer: for (let y = board.length - 1; y > 0; --y) {
            for (let x = 0; x < board[y].length; ++x) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }

            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            ++y;

            player.score += 10;
        }
    }

    function createPiece(type) {
        switch (type) {
            case 'T':
                return [
                    [0, 0, 0],
                    [1, 1, 1],
                    [0, 1, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'L':
                return [
                    [0, 0, 3],
                    [3, 3, 3],
                    [0, 0, 0],
                ];
            case 'J':
                return [
                    [4, 0, 0],
                    [4, 4, 4],
                    [0, 0, 0],
                ];
            case 'I':
                return [
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                    [0, 5, 0, 0],
                ];
            case 'S':
                return [
                    [0, 6, 6],
                    [6, 6, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [7, 7, 0],
                    [0, 7, 7],
                    [0, 0, 0],
                ];
        }
    }

    function updateScore() {
        scoreDisplay.innerText = `Score: ${player.score}`;
    }

    function saveHighScore(name, score) {
        if (!name) return; // Don't save if name is empty

        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];

        highScores.push({ name, score });
        highScores.sort((a, b) => b.score - a.score); // Sort descending by score

        // Keep only top 10 scores
        if (highScores.length > 10) {
            highScores.splice(10);
        }

        localStorage.setItem('highScores', JSON.stringify(highScores));
    }

    function loadHighScores() {
        const highScores = JSON.parse(localStorage.getItem('highScores')) || [];

        highScoreList.innerHTML = highScores.map((score, index) => {
            return `<li>${index + 1}. ${score.name}: ${score.score}</li>`;
        }).join('');
    }

    function togglePause() {
        paused = !paused;
        if (paused) {
            pauseGameButton.style.display = 'none';
            resumeGameButton.style.display = 'inline-block';
        } else {
            pauseGameButton.style.display = 'inline-block';
            resumeGameButton.style.display = 'none';
            update();
        }
    }

    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;

    function update(time = 0) {
        if (paused) {
            return;
        }

        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        drawBoard();
        drawMatrix(player.matrix, player.pos);
        requestAnimationFrame(update);
    }

    document.addEventListener('keydown', event => {
        if (event.keyCode === 37) {
            playerMove(-1); // Left arrow key
        } else if (event.keyCode === 39) {
            playerMove(1); // Right arrow key
        } else if (event.keyCode === 40) {
            playerDrop(); // Down arrow key
        } else if (event.keyCode === 81) {
            playerRotate(-1); // Q key
        } else if (event.keyCode === 87) {
            playerRotate(1); // W key
        } else if (event.keyCode === 80) {
            togglePause(); // P key for pause/resume
        }
    });

    startGameButton.addEventListener('click', () => {
        playerName = playerNameInput.value.trim();
        if (playerName) {
            playerReset();
            updateScore();
            loadHighScores();
            playerNameInput.disabled = true;
            startGameButton.disabled = true;
            startGameButton.innerText = 'Game in progress...';
            pauseGameButton.style.display = 'inline-block';
            resumeGameButton.style.display = 'none';
            update();
        } else {
            alert('Please enter your name before starting the game.');
        }
    });

    pauseGameButton.addEventListener('click', togglePause);
    resumeGameButton.addEventListener('click', togglePause);

    // Initialize high scores on page load
    loadHighScores();

});
