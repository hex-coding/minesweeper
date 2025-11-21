const grid = document.getElementById('grid');
const mineCounter = document.getElementById('mine-counter');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');

let ROWS = 9;
let COLS = 9;
let MINES = 10;

let cells = [];
let mineLocations = [];
let flags = 0;
let gameOver = false;
let timer = 0;
let timerInterval;
let firstClick = true;

function initGame() {
    grid.innerHTML = '';
    cells = [];
    mineLocations = [];
    flags = 0;
    gameOver = false;
    timer = 0;
    firstClick = true;
    clearInterval(timerInterval);
    timerDisplay.innerText = '000';
    mineCounter.innerText = formatNumber(MINES);
    resetBtn.innerText = '🙂';

    // Create grid
    for (let i = 0; i < ROWS * COLS; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleLeftClick);
        cell.addEventListener('contextmenu', handleRightClick);
        cell.addEventListener('mousedown', () => { if (!gameOver) resetBtn.innerText = '😮'; });
        cell.addEventListener('mouseup', () => { if (!gameOver) resetBtn.innerText = '🙂'; });
        grid.appendChild(cell);
        cells.push({
            element: cell,
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0
        });
    }
}

function placeMines(excludeIndex) {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
        const index = Math.floor(Math.random() * ROWS * COLS);
        if (!cells[index].isMine && index !== excludeIndex) {
            cells[index].isMine = true;
            mineLocations.push(index);
            minesPlaced++;
        }
    }
    calculateNeighbors();
}

function calculateNeighbors() {
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].isMine) continue;
        let count = 0;
        const neighbors = getNeighbors(i);
        neighbors.forEach(neighborIndex => {
            if (cells[neighborIndex].isMine) count++;
        });
        cells[i].neighborMines = count;
    }
}

function getNeighbors(index) {
    const neighbors = [];
    const row = Math.floor(index / COLS);
    const col = index % COLS;

    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                const neighborIndex = r * COLS + c;
                if (neighborIndex !== index) {
                    neighbors.push(neighborIndex);
                }
            }
        }
    }
    return neighbors;
}

function handleLeftClick(e) {
    if (gameOver) return;
    const index = parseInt(e.target.dataset.index);
    const cell = cells[index];

    if (cell.isFlagged || cell.isRevealed) return;

    if (firstClick) {
        placeMines(index);
        startTimer();
        firstClick = false;
    }

    if (cell.isMine) {
        gameOver = true;
        revealAllMines();
        cell.element.style.backgroundColor = 'red';
        resetBtn.innerText = '😵';
        clearInterval(timerInterval);
    } else {
        revealCell(index);
        checkWin();
    }
}

function handleRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const index = parseInt(e.target.dataset.index);
    const cell = cells[index];

    if (cell.isRevealed) return;

    if (cell.isFlagged) {
        cell.isFlagged = false;
        cell.element.innerText = '';
        cell.element.classList.remove('flagged');
        flags--;
    } else {
        if (flags < MINES) {
            cell.isFlagged = true;
            cell.element.innerText = '🚩';
            cell.element.classList.add('flagged');
            flags++;
        }
    }
    mineCounter.innerText = formatNumber(MINES - flags);
}

function revealCell(index) {
    const cell = cells[index];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    cell.element.classList.add('revealed');

    if (cell.neighborMines > 0) {
        cell.element.innerText = cell.neighborMines;
        cell.element.dataset.num = cell.neighborMines;
    } else {
        const neighbors = getNeighbors(index);
        neighbors.forEach(neighborIndex => {
            revealCell(neighborIndex);
        });
    }
}

function revealAllMines() {
    mineLocations.forEach(index => {
        const cell = cells[index];
        if (!cell.isFlagged) {
            cell.element.innerText = '💣';
            cell.element.classList.add('revealed');
        }
    });
    // Check for wrong flags
    cells.forEach(cell => {
        if (cell.isFlagged && !cell.isMine) {
            cell.element.innerText = '❌';
        }
    });
}

function checkWin() {
    let revealedCount = 0;
    cells.forEach(cell => {
        if (cell.isRevealed) revealedCount++;
    });

    if (revealedCount === (ROWS * COLS) - MINES) {
        gameOver = true;
        resetBtn.innerText = '😎';
        clearInterval(timerInterval);
        // Flag all remaining mines
        mineLocations.forEach(index => {
            if (!cells[index].isFlagged) {
                cells[index].isFlagged = true;
                cells[index].element.innerText = '🚩';
                cells[index].element.classList.add('flagged');
            }
        });
        mineCounter.innerText = '000';
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        if (timer > 999) timer = 999;
        timerDisplay.innerText = formatNumber(timer);
    }, 1000);
}

function formatNumber(num) {
    return num.toString().padStart(3, '0');
}

resetBtn.addEventListener('click', initGame);


// Menu Logic
const gameMenuTrigger = document.getElementById('game-menu-trigger');
const gameMenuDropdown = document.getElementById('game-menu-dropdown');
const difficultyItems = document.querySelectorAll('.dropdown-item');

gameMenuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    gameMenuDropdown.classList.toggle('show');
});

document.addEventListener('click', () => {
    gameMenuDropdown.classList.remove('show');
});

difficultyItems.forEach(item => {
    item.addEventListener('click', () => {
        const difficulty = item.dataset.difficulty;
        setDifficulty(difficulty);
    });
});

function setDifficulty(difficulty) {
    switch (difficulty) {
        case 'beginner':
            ROWS = 9;
            COLS = 9;
            MINES = 10;
            break;
        case 'intermediate':
            ROWS = 16;
            COLS = 16;
            MINES = 40;
            break;
        case 'expert':
            ROWS = 16;
            COLS = 30;
            MINES = 99;
            break;
    }
    // Update grid columns
    grid.style.gridTemplateColumns = `repeat(${COLS}, 20px)`;
    grid.style.gridTemplateRows = `repeat(${ROWS}, 20px)`;

    initGame();
}

initGame();
