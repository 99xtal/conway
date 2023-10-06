'use strict';

const GRID_MAX_WIDTH = 600;
const GRID_MAX_HEIGHT = 555;
const CELL_COLOR = 'black';
const CELL_SIZE = 15;
const LINE_COLOR = 'gray';

let isClicking = false;
let lastToggledCell = null;
let lastMouseCanvasOffset = null;

class Game {
    #turnsPerSecond = 15
    #cellMap = {};
    #gameTimer = null;

    constructor(options) {
        if (options.turnsPerSecond) {
            this.#turnsPerSecond = options.turnsPerSecond;
        }
    }

    resetCellState() {
        this.#cellMap = {};
    }

    start() {
        if (this.#gameTimer) {
            throw new Error("Game timer already running");
        }

        this.#gameTimer = setInterval(() => {
            this.#cellMap = this.#createNextFrame(this.#cellMap);
        }, 1000 / this.#turnsPerSecond);
    }

    stop() {
        clearInterval(this.#gameTimer);
        this.#gameTimer = null;
    }

    isRunning() {
        return !!this.#gameTimer;
    }

    setTPS(tps) {
        this.#turnsPerSecond = tps;

        if (this.isRunning()) {
            this.stop();
            this.start();
        }
    }

    getCellMap() {
        return this.#cellMap;
    }

    setCellState(coordinates, value) {
        this.#cellMap[this.#key(coordinates)] = value;
    }

    toggleCellState(coordinates) {
        const cellState = this.#cellMap[this.#key(coordinates)];
        if (!cellState) {
            this.#cellMap[this.#key(coordinates)] = true;
        } else {
            this.#cellMap[this.#key(coordinates)] = false;
        }
    }

    #key(coordinate) {
        return `${coordinate[0]},${coordinate[1]}`;
    }

    #getNeighbors(coordinates) {
        const [x, y] = coordinates;
        const neighbors = [];
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (i === x && j === y) {
                    continue;
                }
                neighbors.push([i, j]);
            }
        }
        return neighbors;
    }

    #createNextFrame(currentState) {
        const nextState = { ...currentState };
        const currentAliveCells = Object.entries(currentState).filter(([_, alive]) => alive).map(([k]) => coordinateFromKey(k));
    
        for (const cell of currentAliveCells) {
            const neighbors = this.#getNeighbors(cell);
            for (const neighbor of neighbors) {
                if (!nextState[this.#key(neighbor)]) {
                    nextState[this.#key(neighbor)] = false;
                }
            }
        }
    
        for (const cell of Object.keys(nextState).map(coordinateFromKey)) {
            const neighbors = this.#getNeighbors(cell);
            let numAliveNeighbors = 0
            for (const n of neighbors) {
                if (currentState[this.#key(n)]) {
                    numAliveNeighbors += 1;
                }
            }
            
            const cellKey = this.#key(cell);
            if (currentState[cellKey] === true) {
                if (numAliveNeighbors < 2) {
                    nextState[cellKey] = false;
                    continue;
                } else if (numAliveNeighbors > 3) {
                    nextState[cellKey] = false;
                    continue;
                } else {
                    nextState[cellKey] = currentState[cellKey]
                    continue;
                }
            } else if (!currentState[cellKey] && numAliveNeighbors === 3) {
                nextState[cellKey] = true
                continue;
            }
        }
    
        return nextState;
    }
}

function drawGrid(ctx, options = {
    cellSize: CELL_SIZE,
    lineColor: LINE_COLOR,
}) {
    const canvasHeight = ctx.canvas.height;
    const canvasWidth = ctx.canvas.width;
    ctx.strokeStyle = options.lineColor;
    for (let y = 0; y <= canvasHeight; y += options.cellSize) {
        for (let x = 0; x <= canvasWidth; x += options.cellSize) {
            ctx.strokeRect(x, y, options.cellSize, options.cellSize);
        }
    }
    ctx.save();
}

function getLine(c0, c1, step) {
    const dx = c1[0] - c0[0];
    const dy = c1[1] - c0[1];
    let m = dy / dx;
    if (isNaN(m)) {
        m = 0;
    }
    const b = c1[1] - (m * c1[0]);
    const points = [];
    const xDir = dx / Math.abs(dx);

    for (let x = c0[0]; xDir > 0 ? x <= c1[0] : x >= c1[0]; x += xDir * step) {
        const y = m*x + b;
        points.push([x, y]);
    }
    return points;
}

function toCoordinate(x0, y0) {
    const x = Math.floor(x0 / CELL_SIZE);
    const y = Math.floor(y0 / CELL_SIZE);
    return [x, y];
}

function drawCell(ctx, coordinate) {
    const canvasX = coordinate[0] * CELL_SIZE;
    const canvasY = coordinate[1] * CELL_SIZE;
    ctx.fillStyle = CELL_COLOR;
    ctx.fillRect(canvasX, canvasY, CELL_SIZE, CELL_SIZE);
}

function clearCell(ctx, coordinate) {
    const canvasX = coordinate[0] * CELL_SIZE;
    const canvasY = coordinate[1] * CELL_SIZE;
    ctx.clearRect(canvasX, canvasY, CELL_SIZE, CELL_SIZE);
    ctx.strokeRect(canvasX, canvasY, CELL_SIZE, CELL_SIZE);
}

function drawState(ctx, cellMap) {
    for (const [key, alive] of Object.entries(cellMap)) {
        const coordinate = coordinateFromKey(key);
        if (alive) {
            drawCell(ctx, coordinate);
        } else {
            clearCell(ctx, coordinate);
        }
    }
}

function coordinateFromKey(key) {
    return key.split(',').map((k) => parseInt(k, 10));
}

function onResize() {
    const canvas = document.getElementById('game');
    const header = document.querySelector('header')

    if (window.innerWidth < GRID_MAX_WIDTH) {
        canvas.width = window.innerWidth - 32;
    } else {
        canvas.width = GRID_MAX_WIDTH
    }

    if (window.innerHeight < GRID_MAX_HEIGHT + header.offsetHeight + 64) {
        canvas.height = window.innerHeight - header.offsetHeight - 64;
    } else {
        canvas.height = GRID_MAX_HEIGHT;
    }
}

function draw(game) {
    const ctx = document.getElementById('game').getContext('2d');
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx);
    drawState(ctx, game.getCellMap());
    
    window.requestAnimationFrame(() => draw(game));
}

function init() {
    const rulesBtn = document.getElementById('rules-btn');
    const closeBtn = document.getElementById('close-rules');
    const canvas = document.getElementById('game');
    const tpsInput = document.getElementById('tps-input');
    const rulesDialog = document.getElementById('rules-popup');
    const startStopBtn = document.getElementById('startstop');
    const resetBtn = document.getElementById('reset');

    const game = new Game({
        turnsPerSecond: 15
    });

    window.addEventListener('resize', onResize);
    onResize();

    rulesBtn.addEventListener('click', () => {
        rulesDialog.showModal();
    });

    rulesDialog.addEventListener('click', (e) => {
        if (e.target === rulesDialog) {
            rulesDialog.close();
        }
    })

    closeBtn.addEventListener('click', () => {
        rulesDialog.close();
    })

    canvas.addEventListener('mousedown', (e) => {
        isClicking = true;
        if (!game.isRunning()) {
            const coordinates = toCoordinate(e.offsetX, e.offsetY);
            game.toggleCellState(coordinates);
        }
    })
    
    canvas.addEventListener('mouseup', (e) => {
        isClicking = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isClicking && !game.isRunning()) {
            const points = getLine(lastMouseCanvasOffset, [e.offsetX, e.offsetY], CELL_SIZE);

            const cellsToFill = points.map(([x, y]) => toCoordinate(x,y))
            for (const c of cellsToFill) {
                game.setCellState(c, true);
            }
        }

        lastMouseCanvasOffset = [e.offsetX, e.offsetY]
    })

    canvas.addEventListener('mouseover', (e) => {
        if (game.isRunning()) {
            canvas.style.cursor = "move";
        } else {
            canvas.style.cursor = "pointer";
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        const bcr = e.target.getBoundingClientRect();
        const tapX = e.touches[0].clientX - bcr.x
        const tapY = e.touches[0].clientY - bcr.y;

        lastMouseCanvasOffset = [tapX, tapY];
    })

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();

        const bcr = e.target.getBoundingClientRect();
        const tapX = e.touches[0].clientX - bcr.x
        const tapY = e.touches[0].clientY - bcr.y;

        if (!game.isRunning()) {
            const points = getLine(lastMouseCanvasOffset, [tapX, tapY], CELL_SIZE);

            const cellsToFill = points.map(([x, y]) => toCoordinate(x,y))
            for (const c of cellsToFill) {
                game.setCellState(c, true);
            }
        }

        lastMouseCanvasOffset = [tapX, tapY];
    })

    tpsInput.addEventListener('change', (e) => {
        game.setTPS(e.target.value);
    })

    startStopBtn.addEventListener('click', () => {
        if (game.isRunning()) {
            game.stop();
            startStopBtn.innerHTML = "Start";
        } else {
            game.start();
            startStopBtn.innerHTML = "Stop";
        }
    })

    resetBtn.addEventListener('click', () => {
        game.resetCellState();
        if (game.isRunning()) {
            game.stop();
            startStopBtn.innerHTML = "Start"
        }
    })

    window.requestAnimationFrame(() => draw(game));
}

init();
