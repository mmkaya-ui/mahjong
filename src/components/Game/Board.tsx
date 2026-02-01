'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/context/GameContext';
import Tile from './Tile';
import styles from './Board.module.css';

export default function Board() {
    const { tiles, selectTile, hint } = useGame();
    const boardRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Auto-scale to fit screen
    useEffect(() => {
        const handleResize = () => {
            if (!boardRef.current) return;
            const parent = boardRef.current.parentElement;
            if (!parent) return;

            // Turtle layout dim approx: 30x18 grid units (approx 1440x? px at full size?)
            // Tile size: 48x64.
            // Max Width: approx 30 cols * 24px (half-width step) + 48 = ~768px?
            // Max Height: approx 18 rows * 32px (half-height step) + 64 = ~640px?

            // Let's assume logical width ~800px, height ~600px
            const contentWidth = 800;
            const contentHeight = 600;

            const availWidth = parent.clientWidth;
            const availHeight = parent.clientHeight;

            const scaleX = availWidth / contentWidth;
            const scaleY = availHeight / contentHeight;

            // Keep aspect ratio, apply padding
            const newScale = Math.min(scaleX, scaleY) * 0.9;
            setScale(Math.max(0.3, Math.min(newScale, 1.2))); // Clamp
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={styles.boardContainer}>
            <div
                ref={boardRef}
                className={styles.boardContent}
                style={{ transform: `scale(${scale})` }}
            >
                {tiles
                    .sort((a, b) => {
                        // Render order: Z first, then Y, then X?
                        // Actually, HTML/CSS painting order:
                        // Lower Z first.
                        // Within same Z: Lower Y first (top to bottom) to ensure overlapping looks right if any?
                        // Actually for 3D stacks, we want strict Z order.
                        if (a.z !== b.z) return a.z - b.z;
                        if (a.y !== b.y) return a.y - b.y;
                        return a.x - b.x;
                    })
                    .map(tile => {
                        const isHinted = hint ? hint.some(h => h.id === tile.id) : false;
                        return (
                            <Tile
                                key={tile.id}
                                tile={tile}
                                onClick={selectTile}
                                isHinted={isHinted}
                            />
                        );
                    })}
            </div>
        </div>
    );
}
