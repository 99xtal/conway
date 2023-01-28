
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

/**
 * Conway Algorithm v1
 * 
 * Traverse each cell in the grid, count the number of alive neighbors, and construct a new grid
 * with cell states after game rules have been applied.
 * 
 * Scales poorly with grid size, at time complexity:
 *    O(n) where n represents the grid area
 * 
 * @param currentGrid a matrix containing states (0 | 1) of all cells in grid space 
 * @returns a matrix containing states of all cells after 1 generation
 */
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

/**
 * Conway Algorithm v2
 * 
 * Given an array of alive cells, return an array containing the coordinates of all alive cells
 * after the rules have been applied.
 * 
 * - Create a stateMap containing every alive point indexed by coordinate ({ "2,1": 1, "3,2": 1 });
 * - Find neighbors of each point in aliveCells and add their neighbors to the stateMap ({ "1, 0": 0, "2,0": 0 })
 * - Using all of the indexed coordinates, determine their states in the next generation according to rules,
 *    and add them to new state map
 * - Iterate over stateMap keys to return aliveCells for next generation
 * 
 * @param aliveCells An array containing the coordinates of cells that are alive in the current generation
 */
export function createNextFrame2(stateMap: { [k: string]: number }) {
  const aliveCells = Object.keys(stateMap).map((k) => k.split(',').map((s) => parseInt(s)));

  for (const cell of aliveCells) {
      const neighbors = getNeighbors(cell[0], cell[1]);
      
      for (const n of neighbors) {
          if (!stateMap[n.join(',')]) {
              stateMap[n.join(',')] = 0;
          }
      }
  }

  console.log(stateMap);

  const n0 = Object.keys(stateMap).map((k) => k.split(',').map((s) => parseInt(s)));
  const newMap: {
      [k: string]: number;
  } = {};
  for (const cell of n0) {
      const neighbors = getNeighbors(cell[0], cell[1]);
      let numAliveNeighbors = 0
      for (const n of neighbors) {
          if (stateMap[n.join(',')] === 1) {
              numAliveNeighbors += 1;
          }
      }
      const cellKey = cell.join(',');
      
      if (stateMap[cellKey] === 1) {
          if (numAliveNeighbors < 2) {
              newMap[cellKey] = 0;
              continue;
          } else if (numAliveNeighbors > 3) {
              newMap[cellKey] = 0;
              continue;
          } else {
              newMap[cellKey] = stateMap[cellKey]
              continue;
          }
      } else if (stateMap[cellKey] === 0 && numAliveNeighbors === 3) {
          newMap[cellKey] = 1
          continue;
      }
  }

  const nextAliveCells = Object.entries(newMap).filter(([_, value]) => value === 1).map(([key, _]) => key.split(',').map((s) => parseInt(s)) )
  console.log('Next generation', nextAliveCells);
  return newMap;
}