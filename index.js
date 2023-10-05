'use strict';

const GRID_MAX_WIDTH = 600;
const GRID_MAX_HEIGHT = 555;
const CELL_COLOR = 'black';
const CELL_SIZE = 15;
const LINE_COLOR = 'gray';

let turnsPerSecond = 15;
let cellMap = {};
let timerId = null;
let running = false;
let isClicking = false;
let lastToggledCell = null;

function resetGameState() {
    const btn = document.getElementById('startstop');
    cellMap = {};
    if (timerId) {
        clearInterval(timerId);
        btn.innerHTML = "Start"
    }
}

function toggleStartStop() {
    running = !running;
    const btn = document.getElementById('startstop');
    if (running) {
        timerId = setInterval(() => {
            cellMap = createNextFrame(cellMap);
        }, 1000 / turnsPerSecond);
        btn.innerHTML = "Stop"
    } else if (timerId) {
        clearInterval(timerId);
        btn.innerHTML = "Start"
    }
}

function toggleCellState(coordinates) {
    const cellState = cellMap[key(coordinates)];
    if (!cellState) {
        cellMap[key(coordinates)] = true;
    } else {
        cellMap[key(coordinates)] = false;
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

function getTapCoordinate(e) {
    const bcr = e.target.getBoundingClientRect();
    const x = Math.floor((e.touches[0].clientX - bcr.x) / CELL_SIZE);
    const y = Math.floor((e.touches[0].clientY - bcr.y) / CELL_SIZE);
    return [x, y]; 
}

function getMouseCoordinate(e) {
    const x = Math.floor(e.offsetX / CELL_SIZE);
    const y = Math.floor(e.offsetY / CELL_SIZE);
    return [x, y];
}

function fillCell(ctx, coordinate) {
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

function key(coordinate) {
    return `${coordinate[0]},${coordinate[1]}`;
}

function coordinateFromKey(key) {
    return key.split(',').map((k) => parseInt(k, 10));
}

function getNeighbors(coordinates) {
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

function createNextFrame(currentState) {
    const nextState = { ...currentState };
    const currentAliveCells = Object.entries(currentState).filter(([_, alive]) => alive).map(([k]) => coordinateFromKey(k));

    for (const cell of currentAliveCells) {
        const neighbors = getNeighbors(cell);
        for (const neighbor of neighbors) {
            if (!nextState[key(neighbor)]) {
                nextState[key(neighbor)] = false;
            }
        }
    }

    for (const cell of Object.keys(nextState).map(coordinateFromKey)) {
        const neighbors = getNeighbors(cell);
        let numAliveNeighbors = 0
        for (const n of neighbors) {
            if (currentState[key(n)]) {
                numAliveNeighbors += 1;
            }
        }
        
        const cellKey = key(cell);
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

function draw() {
    const ctx = document.getElementById('game').getContext('2d');
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawGrid(ctx);

    for (const [key, alive] of Object.entries(cellMap)) {
        const coordinate = coordinateFromKey(key);
        if (alive) {
            fillCell(ctx, coordinate);
        } else {
            clearCell(ctx, coordinate);
        }
    }
    
    window.requestAnimationFrame(draw);
}

function init() {
    const rulesBtn = document.getElementById('rules-btn');
    const closeBtn = document.getElementById('close-rules');
    const canvas = document.getElementById('game');
    const tpsInput = document.getElementById('tps-input');
    const rulesDialog = document.getElementById('rules-popup');

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
    })
    
    canvas.addEventListener('mouseup', (e) => {
        if (!running) {
            const coordinates = getMouseCoordinate(e);
            toggleCellState(coordinates);
        }
        isClicking = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isClicking && !running) {
            const coordinates = getMouseCoordinate(e);

            if (!lastToggledCell || key(coordinates) !== lastToggledCell) {
                cellMap[key(coordinates)] = true;
                lastToggledCell = key(coordinates);
            }
        }

    })

    canvas.addEventListener('mouseover', (e) => {
        if (running) {
            canvas.style.cursor = "move";
        } else {
            canvas.style.cursor = "pointer";
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (running) {
            return;
        }

        const coordinates = getTapCoordinate(e);
        if (!lastToggledCell || key(coordinates) !== lastToggledCell) {
            cellMap[key(coordinates)] = true;
            lastToggledCell = key(coordinates);
        }
    })

    tpsInput.addEventListener('change', (e) => {
        turnsPerSecond = e.target.value;
    })

    tpsInput.addEventListener('blur', () => {
        if (timerId) {
            clearInterval(timerId);
            timerId = setInterval(() => {
                cellMap = createNextFrame(cellMap);
            }, 1000 / turnsPerSecond);
        }
    })

    window.requestAnimationFrame(draw);
}

init();
