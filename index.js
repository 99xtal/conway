'use strict';

let isClicking = false;
let timerId = null;
let framesPerSecond = 15;

class Coordinate {
    constructor(x, y) {
        this.x = parseInt(x, 10);
        this.y = parseInt(y, 10);;
    }

    toString() {
        return `${this.x},${this.y}`
    }

    getNeighbors() {
        const { x, y } = this;
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
        return this.map.forEach((v, k, m) => callback(v, this.#coordinateFromKey(k), m));
    }

    #coordinateFromKey(key) {
        const [x, y] = key.split(',');
        return new Coordinate(x, y);
    }
}

class Game {
    #cellMap;

    constructor(seed) {
        const cellMap = new CoordinateMap();
        for (const c of seed) {
            cellMap.set(c, true);
        }
        this.#cellMap = cellMap;
    }

    aliveCells() {
        const aliveCells = [];
        this.#cellMap.forEach((alive, cell) => {
            if (alive) {
                aliveCells.push(cell);
            }
        })
        return aliveCells;
    }

    nextTurn() {
        const currentState = this.#cellMap;
        const nextState = new CoordinateMap(currentState);
        const currentAliveCells = [];
        currentState.forEach((alive, cell) => {
            if (alive === true) {
                currentAliveCells.push(cell);
            }
        })
    
        for (const cell of currentAliveCells) {
            const neighbors = cell.getNeighbors();
            for (const neighbor of neighbors) {
                if (!nextState.get(neighbor)) {
                    nextState.set(neighbor, false);
                }
            }
        }

        nextState.forEach((_, cell) => {
            const neighbors = cell.getNeighbors();
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

        this.#cellMap = nextState;
    }
}

class PixelGrid {
    #stateMap;
    #lastMouseCanvasOffset;

    constructor(canvas, options) {
        this.canvas = canvas;
        this.canvas.width = options.width;
        this.canvas.height = options.height;
        this.cellSize = options?.cellSize ?? 15;
        this.lineColor = options?.lineColor ?? 'gray';
        this.fillColor = options?.fillColor ?? 'black';

        this.#stateMap = new CoordinateMap();
        this.editEnabled = true;
        this.#lastMouseCanvasOffset = null;

        this.reset();

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault(); 
            isClicking = true;

            if (!this.editEnabled) {
                return;
            }

            const c = this.#toCoordinate(e.offsetX, e.offsetY);
            if (this.#stateMap.get(c)) {
                this.clearCell(c);
            } else {
                this.fillCell(c);
            }
        })

        this.canvas.addEventListener('mousemove', (e) => {
            if (isClicking && this.editEnabled) {
                const points = getLine(this.#lastMouseCanvasOffset, [e.offsetX, e.offsetY], this.cellSize);
    
                const cellsToFill = points.map(([x, y]) => this.#toCoordinate(x,y)).filter((c) => !isNaN(c.x) &&  !isNaN(c.y));
                for (const c of cellsToFill) {
                    this.fillCell(c);
                }
            }
    
            this.#lastMouseCanvasOffset = [e.offsetX, e.offsetY]
        })

        this.canvas.addEventListener('mouseup', (e) => {
            isClicking = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            const bcr = e.target.getBoundingClientRect();
            const tapX = e.touches[0].clientX - bcr.x
            const tapY = e.touches[0].clientY - bcr.y;
    
            this.#lastMouseCanvasOffset = [tapX, tapY];
        })
    
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
    
            const bcr = e.target.getBoundingClientRect();
            const tapX = e.touches[0].clientX - bcr.x
            const tapY = e.touches[0].clientY - bcr.y;
    
            if (this.editEnabled) {
                const points = getLine(this.#lastMouseCanvasOffset, [tapX, tapY], this.cellSize);
    
                const cellsToFill = points.map(([x, y]) => this.#toCoordinate(x,y))
                for (const c of cellsToFill) {
                    this.fillCell(c);
                }
            }
    
            this.#lastMouseCanvasOffset = [tapX, tapY];
        });

        this.canvas.addEventListener('mouseover', (e) => {
            if (this.editEnabled) {
                canvas.style.cursor = "pointer";
            } else {
                canvas.style.cursor = "move";
            }
        });
    }

    setEdit(value) {
        this.editEnabled = value;
    }

    reset() {
        this.#stateMap = new CoordinateMap();

        const ctx = this.canvas.getContext('2d');
        const canvasHeight = ctx.canvas.height;
        const canvasWidth = ctx.canvas.width;
        ctx.strokeStyle = this.lineColor;
        for (let y = 0; y <= canvasHeight; y += this.cellSize) {
            for (let x = 0; x <= canvasWidth; x += this.cellSize) {
                ctx.clearRect(x, y, this.cellSize, this.cellSize);
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            }
        }
        ctx.save();
    }

    fillCell(coordinate) {
        const ctx = this.canvas.getContext('2d');

        const canvasX = coordinate.x * this.cellSize;
        const canvasY = coordinate.y * this.cellSize;
        ctx.fillStyle = this.fillColor;
        ctx.fillRect(canvasX, canvasY, this.cellSize, this.cellSize);

        this.#stateMap.set(coordinate, true);
    }

    clearCell(coordinate) {
        const ctx = this.canvas.getContext('2d');

        const canvasX = coordinate.x * this.cellSize;
        const canvasY = coordinate.y * this.cellSize;
        ctx.clearRect(canvasX, canvasY, this.cellSize, this.cellSize);
        ctx.strokeRect(canvasX, canvasY, this.cellSize, this.cellSize); 

        this.#stateMap.set(coordinate, false);
    }

    getSelectedCells() {
        const selectedCells = [];
        this.#stateMap.forEach((alive, cell) => {
            if (alive) {
                selectedCells.push(cell);
            }
        })
        return selectedCells; 
    }

    #toCoordinate(x0, y0) {
        const x = Math.floor(x0 / this.cellSize);
        const y = Math.floor(y0 / this.cellSize);
        return new Coordinate(x, y);
    }
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

function onResize(maxWidth, maxHeight, grid) {
    const canvas = document.getElementById('game');
    const header = document.querySelector('header')

    if (window.innerWidth < maxWidth) {
        canvas.width = window.innerWidth - 32;
    } else {
        canvas.width = maxWidth
    }

    if (window.innerHeight < maxHeight + header.offsetHeight + 64) {
        canvas.height = window.innerHeight - header.offsetHeight - 64;
    } else {
        canvas.height = maxHeight;
    }
}

function init() {
    const rulesBtn = document.getElementById('rules-btn');
    const closeBtn = document.getElementById('close-rules');
    const canvas = document.getElementById('game');
    const tpsInput = document.getElementById('tps-input');
    const rulesDialog = document.getElementById('rules-popup');
    const startStopBtn = document.getElementById('startstop');
    const resetBtn = document.getElementById('reset');

    const CANVAS_HEIGHT = 555;
    const CANVAS_WIDTH = 600;

    const grid = new PixelGrid(canvas, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
    });

    window.addEventListener('resize', () => onResize(CANVAS_WIDTH, CANVAS_HEIGHT));
    onResize(CANVAS_WIDTH, CANVAS_HEIGHT);

    grid.reset();

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

    tpsInput.addEventListener('change', (e) => {
        framesPerSecond = e.target.value;
        const game = new Game(grid.getSelectedCells());

        clearInterval(timerId);
        timerId = setInterval(() => {
            grid.reset();
            game.nextTurn();
            for (const c of game.aliveCells()) {
                grid.fillCell(c);
            }
        }, 1000 / framesPerSecond);
    })

    startStopBtn.addEventListener('click', () => {
        if (timerId) {
            grid.setEdit(true);
            clearInterval(timerId);
            timerId = null;
            startStopBtn.innerHTML = "Start";
        } else {
            const game = new Game(grid.getSelectedCells());
            grid.setEdit(false);
            timerId = setInterval(() => {
                grid.reset();
                game.nextTurn();
                for (const c of game.aliveCells()) {
                    grid.fillCell(c);
                }
            }, 1000 / framesPerSecond);
            startStopBtn.innerHTML = "Stop";
        }
    })

    resetBtn.addEventListener('click', () => {
        grid.reset();
        grid.editEnabled(true);
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
            startStopBtn.innerHTML = "Start";
        }
    });
}

init();
