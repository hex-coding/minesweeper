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
        SoundManager.playExplode();
    } else {
        revealCell(index);
        SoundManager.playClick();
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
            SoundManager.playFlag();
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
        HighScoreManager.checkScore(currentDifficulty, timer);
        SoundManager.playWin();
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


// High Score Manager
const HighScoreManager = {
    scores: {
        beginner: { time: 999, name: 'Anonymous' },
        intermediate: { time: 999, name: 'Anonymous' },
        expert: { time: 999, name: 'Anonymous' }
    },

    init() {
        const savedScores = localStorage.getItem('minesweeperScores');
        if (savedScores) {
            this.scores = JSON.parse(savedScores);
        }
        this.updateUI();
    },

    checkScore(difficulty, time) {
        if (time < this.scores[difficulty].time) {
            const name = prompt(`New High Score for ${difficulty}! Enter your name:`, 'Anonymous');
            this.scores[difficulty] = {
                time: time,
                name: name || 'Anonymous'
            };
            this.save();
            this.updateUI();
            this.showModal();
        }
    },

    save() {
        localStorage.setItem('minesweeperScores', JSON.stringify(this.scores));
    },

    reset() {
        this.scores = {
            beginner: { time: 999, name: 'Anonymous' },
            intermediate: { time: 999, name: 'Anonymous' },
            expert: { time: 999, name: 'Anonymous' }
        };
        this.save();
        this.updateUI();
    },

    updateUI() {
        document.getElementById('best-beginner-time').innerText = this.scores.beginner.time;
        document.getElementById('best-beginner-name').innerText = this.scores.beginner.name;
        document.getElementById('best-intermediate-time').innerText = this.scores.intermediate.time;
        document.getElementById('best-intermediate-name').innerText = this.scores.intermediate.name;
        document.getElementById('best-expert-time').innerText = this.scores.expert.time;
        document.getElementById('best-expert-name').innerText = this.scores.expert.name;
    },

    showModal() {
        document.getElementById('best-times-modal').classList.add('show');
    },

    hideModal() {
        document.getElementById('best-times-modal').classList.remove('show');
    }
};

// Sound Manager
const SoundManager = {
    audioCtx: null,
    enabled: true,

    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
        this.updateUI();
    },

    toggle() {
        this.enabled = !this.enabled;
        this.updateUI();
    },

    updateUI() {
        const toggle = document.getElementById('sound-toggle');
        toggle.innerText = `Sound: ${this.enabled ? 'On' : 'Off'}`;
    },

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled || !this.audioCtx) return;

        // Resume context if suspended (browser policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playClick() {
        this.playTone(800, 'square', 0.05, 0.05);
    },

    playFlag() {
        this.playTone(400, 'triangle', 0.1, 0.1);
    },

    playExplode() {
        if (!this.enabled || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const bufferSize = this.audioCtx.sampleRate * 0.5; // 0.5 seconds
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        noise.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start();
    },

    playWin() {
        if (!this.enabled) return;
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.2, 0.1), i * 150);
        });
    }
};

// Menu Logic
const gameMenuTrigger = document.getElementById('game-menu-trigger');
const gameMenuDropdown = document.getElementById('game-menu-dropdown');
const difficultyItems = document.querySelectorAll('.dropdown-item[data-difficulty]');
const bestTimesItem = document.getElementById('best-times-item');
const soundToggle = document.getElementById('sound-toggle');
const closeBestTimesBtn = document.getElementById('close-best-times');
const okBestTimesBtn = document.getElementById('ok-best-times-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');

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

bestTimesItem.addEventListener('click', () => {
    HighScoreManager.showModal();
});

soundToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Keep menu open
    SoundManager.toggle();
});

closeBestTimesBtn.addEventListener('click', () => {
    HighScoreManager.hideModal();
});

okBestTimesBtn.addEventListener('click', () => {
    HighScoreManager.hideModal();
});

resetScoresBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all high scores?')) {
        HighScoreManager.reset();
    }
});

function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
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

let currentDifficulty = 'beginner';
HighScoreManager.init();
SoundManager.init();
initGame();
