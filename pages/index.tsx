import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Grid } from '../components/Grid';
import { useEffect, useRef, useState } from 'react';
import { Coordinate } from '../types';
import { createNextFrame } from '../utils/conway';
import { GLIDER_GUN } from '../patterns';

const GRID_SIZE = 50;

function initGrid(size: number) {
  const grid = [];
  for (let i = 0; i < size; i++) {
    grid.push(Array(size).fill(0));
  }
  return grid;
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [grid, setGrid] = useState(GLIDER_GUN);
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
    setGrid((curr) => createNextFrame(curr));
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
    <main>
      <div className="main">
        <div>
          <h1>Conway&apos;s Game of Life</h1>
          <ol>
            <li>Any live cell with fewer than two live neighbours dies, as if by underpopulation.</li>
            <li>Any live cell with two or three live neighbours lives on to the next generation.</li>
            <li>Any live cell with more than three live neighbours dies, as if by overpopulation.</li>
            <li>Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.</li>
          </ol>
        </div>
        <Grid grid={grid} onCoordinateClick={setCellState} />
      </div>
      <div className="settings">
        <p>{`Turns: ${turnCount}`}</p>
        <button onClick={isRunning ? handleStop : handleStart}>{isRunning ? 'Stop' : 'Start'}</button>
        <button onClick={clearGrid}>Clear</button>
      </div>
    </main>
  );
}
