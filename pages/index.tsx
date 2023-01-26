import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Grid } from '../components/Grid';
import { useRef, useState } from 'react';
import { Coordinate } from '../types';

const GRID_SIZE = 25;

function getNeighbors(c: Coordinate) {
  const neighbors = [
    {
      x: c.x - 1,
      y: c.y - 1,
    },
    {
      x: c.x,
      y: c.y - 1,
    },
    {
      x: c.x + 1,
      y: c.y - 1,
    },
    {
      x: c.x - 1,
      y: c.y,
    },
    {
      x: c.x + 1,
      y: c.y,
    },
    {
      x: c.x - 1,
      y: c.y + 1,
    },
    {
      x: c.x,
      y: c.y + 1,
    },
    {
      x: c.x + 1,
      y: c.y + 1,
    },
  ];

  return neighbors;
}

function calculateNextFrame(grid: number[][]) {
  const newGrid: number[][] = [];
  for (let j = 0; j < grid.length; j++) {
    const newRow: number[] = [];
    for (let i = 0; i < grid[j].length; i++) {
      const cell = grid[j][i];
      const neighbors = getNeighbors({ x: i, y: j }).filter(
        (n) => n.x >= 0 && n.x < grid.length && n.y >= 0 && n.y < grid.length
      );
      let aliveCount = 0;
      for (const n of neighbors) {
        const neighbor = grid[n.y][n.x];
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
    newGrid.push(newRow);
  }
  return newGrid;
}

function initGrid(size: number) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    grid.push(Array(size).fill(0));
  }
  return grid;
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [grid, setGrid] = useState(initGrid(GRID_SIZE));
  const [turnCount, setTurnCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timer>();

  function clearGrid() {
    setGrid(initGrid(GRID_SIZE));
    clearInterval(intervalRef.current);
    setTurnCount(0);
  }

  function setCellState({ x, y }: Coordinate) {
    setGrid((currentGrid) =>
      currentGrid.map((yRow, i) => {
        if (i === y) {
          return yRow.map((cell, j) => {
            if (j === x) {
              if (cell === 0) {
                return 1;
              } else {
                return 0;
              }
            }
            return cell;
          });
        }
        return yRow;
      })
    );
  }

  function tick() {
    setGrid((curr) => calculateNextFrame(curr));
    setTurnCount((curr) => curr + 1);
  }

  const handleStop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }

  const handleStart = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 100);
  }

  return (
    <div>
      <h1>Conway&apos;s Game of Life</h1>
      <h1>{`Turns: ${turnCount}`}</h1>
      <Grid grid={grid} onCoordinateClick={setCellState} />
      <button onClick={isRunning ? handleStop : handleStart}>{isRunning ? 'Stop' : 'Start'}</button>
      <button onClick={clearGrid}>Clear</button>
    </div>
  );
}
