import React, { useEffect, useState } from 'react';
import styles from '../styles/Grid.module.css';
import { range } from '../utils/utils';
function Cell({ alive, onClick, mouseDown }) {
    return (<div onMouseOver={() => {
            if (mouseDown) {
                onClick();
            }
        }} onClick={onClick} className={alive ? styles.active : styles.gridElement}></div>);
}
export function Grid({ grid, onCoordinateClick }) {
    const [mouseDown, setMouseDown] = useState(false);
    useEffect(() => {
        window.addEventListener('mousedown', () => {
            setMouseDown(true);
        });
        window.addEventListener('mouseup', () => {
            setMouseDown(false);
        });
    }, []);
    return (<div className={styles.container}>
      {range(grid.length).map((y) => (<div className={styles.gridRow} key={y}>
          {range(grid.length).map((x) => {
                const coord = { x, y };
                return (<Cell mouseDown={mouseDown} alive={grid[y][x]} onClick={() => onCoordinateClick(coord)} key={`${x},${y}`}/>);
            })}
        </div>))}
    </div>);
}
