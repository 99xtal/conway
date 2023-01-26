
function getNeighbors(x: number, y: number) {
    const neighbors: number[][] = [];
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


export function createNextFrame(currentGrid: number[][]) {
    const nextGrid: number[][] = [];
    for (let i = 0; i < currentGrid.length; i++ ) {
        const newRow: number[] = [];
        for (let j = 0; j < currentGrid[i].length; j++) {
            const cell = currentGrid[i][j];
            const neighbors = getNeighbors(i, j).filter(([x, y]) => x >= 0 && x < currentGrid.length && y >= 0 && y < currentGrid.length);
            let aliveCount = 0;
            for (const [x, y] of neighbors) {
              const neighbor = currentGrid[x][y];
              if (neighbor === 1) {
                aliveCount += 1;
              }
            }
            if (cell === 1 && aliveCount < 2) {
                newRow.push(0);
              } else if (cell === 1 && aliveCount >= 2 && aliveCount <= 3) {
                newRow.push(1);
              } else if (cell === 1 && aliveCount > 3) {
                newRow.push(0);
              } else if (cell === 0 && aliveCount === 3) {
                newRow.push(1);
              } else {
                newRow.push(cell);
              }
        }
        nextGrid.push(newRow)
    }
    return nextGrid;
}