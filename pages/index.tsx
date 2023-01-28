import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Grid } from '../components/Grid';
import { useEffect, useRef, useState } from 'react';
import { Coordinate } from '../types';
import { createNextFrame, createNextFrame2 } from '../utils/conway';
import { GLIDER_GUN } from '../patterns';

import { createRoot } from 'react-dom/client'
import { Canvas, MeshProps, useFrame } from '@react-three/fiber'

function Box(props: MeshProps) {
  // This reference will give us direct access to the mesh
  const mesh = useRef(null!)
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // @ts-ignore
  useFrame((state, delta) => (mesh.current.rotation.x += delta))
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  )
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
  const [activeCells, setActiveCells] = useState<{ [k: string]: number }>({ '2,1': 1, '3,2': 1, '3,3': 1, '2,3': 1, '1,3': 1 })
  const height = 50;
  const width = 50;
  const [turnCount, setTurnCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timer>();

  function clearGrid() {
    setActiveCells({});
    clearInterval(intervalRef.current);
    setTurnCount(0);
  }

  function setCellState({ x, y }: Coordinate) {
    setActiveCells((current) => {
      const cellKey = `${x},${y}`;
      console.log(cellKey)
      if (current[cellKey] === 0 || !current[cellKey]) {
        console.log('was empty')
        return {
          ...current,
          cellKey: 1,
        }
      } else {
        return {
          ...current,
          cellKey: 0
        }
      }
    })
  }

  function tick() {
    setActiveCells((curr) => createNextFrame2(curr))
    setTurnCount((curr) => curr + 1);
  }

  const handleStop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }

  const handleStart = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 50);
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
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Box position={[-1.2, 0, 0]} />
          <Box position={[1.2, 0, 0]} />
        </Canvas>
        {/* <Grid width={width} height={height} activeCells={activeCells} onCoordinateClick={setCellState} /> */}
      </div>
      <div className="settings">
        <p>{`Turns: ${turnCount}`}</p>
        <button onClick={isRunning ? handleStop : handleStart}>{isRunning ? 'Stop' : 'Start'}</button>
        <button onClick={clearGrid}>Clear</button>
      </div>
    </main>
  );
}
