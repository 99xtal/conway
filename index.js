'use strict';

const GRID_MAX_WIDTH = 600;
const GRID_MAX_HEIGHT = 555;
const CELL_COLOR = 'black';
const CELL_SIZE = 15;
const LINE_COLOR = 'gray';

let isClicking = false;
let lastToggledCell = null;
let lastMouseCanvasOffset = null;

class Coordinate {
    constructor(x, y) {
        this.x = parseInt(x, 10);
        this.y = parseInt(y, 10);;
    }

    toString() {
        return `${this.x},${this.y}`
    }
}

class CoordinateMap {
    map = new Map();

    constructor(initial) {
        if (initial?.map) {
            // Deep clone Map
            initial.map.forEach((value, key) => this.map.set(key, value));
        };
    }

    set(c, value) {
        this.map.set(c.toString(), value)
    }

    get(c) {
        return this.map.get(c.toString());
    }

    forEach(callback) {
        return this.map.forEach((v, k, m) => callback(v, coordinateFromKey(k), m));
    }
}

class Game {
    #turnsPerSecond = 15
    #cellMap = new CoordinateMap();
    #gameTimer = null;

    constructor(options) {
        if (options.turnsPerSecond) {
            this.#turnsPerSecond = options.turnsPerSecond;
        }
    }

    resetCellState() {
        this.#cellMap = new CoordinateMap();
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
        this.#cellMap.set(coordinates, value);
    }

    toggleCellState(coordinates) {
        const cellState = this.#cellMap.get(coordinates);
        if (!cellState) {
            this.#cellMap.set(coordinates, true);
        } else {
            this.#cellMap.set(coordinates, false)
        }
    }

    #getNeighbors(coordinates) {
        const { x, y } = coordinates
        const neighbors = [];
        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (i === x && j === y) {
                    continue;
                }
                neighbors.push(new Coordinate(i, j));
            }
        }
        return neighbors;
    }

    #createNextFrame(currentState) {
        const nextState = new CoordinateMap(currentState);
        const currentAliveCells = [];
        currentState.forEach((alive, cell) => {
            if (alive === true) {
                currentAliveCells.push(cell);
            }
        })
    
        for (const cell of currentAliveCells) {
            const neighbors = this.#getNeighbors(cell);
            for (const neighbor of neighbors) {
                if (!nextState.get(neighbor)) {
                    nextState.set(neighbor, false);
                }
            }
        }

        nextState.forEach((_, cell) => {
            const neighbors = this.#getNeighbors(cell);
            let numAliveNeighbors = 0
            for (const n of neighbors) {
                if (currentState.get(n)) {
                    numAliveNeighbors += 1;
                }
            }
            
            if (currentState.get(cell) === true) {
                if (numAliveNeighbors < 2) {
                    nextState.set(cell, false);
                } else if (numAliveNeighbors > 3) {
                    nextState.set(cell, false);
                } else {
                    nextState.set(cell, currentState.get(cell));
                }
            } else if (!currentState.get(cell) && numAliveNeighbors === 3) {
                nextState.set(cell, true);
            }
        });
    
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
    return new Coordinate(x, y);
}

function drawCell(ctx, coordinate) {
    const canvasX = coordinate.x * CELL_SIZE;
    const canvasY = coordinate.y * CELL_SIZE;
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
    cellMap.forEach((alive, cell) => {
        if (alive) {
            drawCell(ctx, cell);
        } else {
            clearCell(ctx, cell);
        } 
    });
}

function coordinateFromKey(key) {
    const [x, y] = key.split(',');
    return new Coordinate(x, y);
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

            const cellsToFill = points.map(([x, y]) => toCoordinate(x,y)).filter((c) => !isNaN(c.x) &&  !isNaN(c.y));
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
