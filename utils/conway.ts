import { Coordinate as c } from '../types';

enum CellState {
  'DEAD' = 0,
  'ALIVE' = 1,
}

// Key for cell state map
type Coordinate = `${number},${number}`;

type CellMap = Map<Coordinate, CellState>;

const testCells: CellMap = new Map([
  ['-1,0', 1],
  ['0,0', 1],
  ['1,0', 1],
]);

function getNeighbors(coords: Coordinate): Coordinate[] {
  const relNeighbors = [
    [-1, 1],
    [0, 1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const nCoord = coords.split(',').map((i) => parseInt(i));
  const neighboringCoords: Coordinate[] = [];
  for (const neighbor of relNeighbors) {
    neighboringCoords.push(
      `${neighbor[0] + nCoord[0]},${neighbor[1] + nCoord[1]}`
    );
  }
  return neighboringCoords;
}

function tick(activeCells: CellMap) {
  const sortedCells = new Map(
    [...activeCells].sort((pairA, pairB) => {
      const pair1 = pairA[0].split(',').map((i) => parseInt(i));
      const pair2: number[] = pairB[0].split(',').map((i) => parseInt(i));
      return pair1[1] - pair2[1] || pair1[0] - pair2[0];
    })
  );
  console.log(sortedCells);

  for (const cell of sortedCells) {
    const neighbors = getNeighbors(cell[0]);
    console.log(neighbors);

    let activeNeighborCount = 0;
    for (const neighbor of neighbors) {
      if (activeCells.get(neighbor)) {
        activeNeighborCount += 1;
      }
    }

    console.log(activeNeighborCount);
  }
}

tick(testCells);
