import React, { useEffect, useState } from 'react';
import styles from '../styles/Grid.module.css';
import { Coordinate } from '../types';
import { range } from '../utils/utils';

interface GridProps {
  width: number;
  height: number;
  activeCells: { [k: string]: number};
  onCoordinateClick: (c: Coordinate) => void;
}

interface GridElementProps {
  mouseDown: boolean;
  alive?: number;
  onClick: () => void;
}

function Cell({ alive, onClick, mouseDown }: GridElementProps) {
  return (
    <div
      onMouseOver={() => {
        if (mouseDown) {
          onClick();
        }
      }}
      onClick={onClick}
      className={alive ? styles.active : styles.gridElement}
    ></div>
  );
}

export function Grid({ width, height, activeCells, onCoordinateClick }: GridProps) {
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    window.addEventListener('mousedown', () => {
      setMouseDown(true);
    });

    window.addEventListener('mouseup', () => {
      setMouseDown(false);
    });
  }, []);

  return (
    <div className={styles.container}>
      {range(height).map((y) => (
        <div className={styles.gridRow} key={y}>
          {range(width).map((x) => {
            const coord = { x, y };
            return (
              <Cell
                mouseDown={mouseDown}
                alive={activeCells[`${x},${y}`] === 1 ? 1 : 0}
                onClick={() => onCoordinateClick(coord)}
                key={`${x},${y}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
