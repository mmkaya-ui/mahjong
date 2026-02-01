'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/context/GameContext';
import Tile from './Tile';
import styles from './Board.module.css';

export default function Board() {
    const { tiles, selectTile, hint } = useGame();
    const boardRef = useRef<HTMLDivElement>(null);
    const [viewState, setViewState] = useState({ scale: 1, shiftX: 0, shiftY: 0 });

    // Auto-scale to fit screen
    useEffect(() => {
        const handleResize = () => {
            if (!boardRef.current || tiles.length === 0) return;
            const parent = boardRef.current.parentElement;
            if (!parent) return;

            // Calculate dynamic bounding box
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            tiles.forEach(t => {
                if (t.x < minX) minX = t.x;
                if (t.x > maxX) maxX = t.x;
                if (t.y < minY) minY = t.y;
                if (t.y > maxY) maxY = t.y;
            });

            // Grid units to Pixels (approx)
            // 26px horiz step, 32px vert step.
            // Add padding (40px)
            const widthPixels = ((maxX - minX) * 26) + 48 + 40;
            const heightPixels = ((maxY - minY) * 32) + 64 + 40;

            // Calculate content center relative to Tile.tsx hardcoded origin (14, 8)
            const currentCenterX = (minX + maxX) / 2;
            const currentCenterY = (minY + maxY) / 2;

            // Tile.tsx assumes center is 14, 8. 
            // We need to shift opposite to the specific tiles' offset from that 14,8 center.
            const shiftX = -(currentCenterX - 14) * 26;
            const shiftY = -(currentCenterY - 8) * 32;

            // Ensure minimum reasonable bounds
            const contentWidth = Math.max(300, widthPixels);
            const contentHeight = Math.max(300, heightPixels);

            const availWidth = parent.clientWidth;
            const availHeight = parent.clientHeight;

            const scaleX = availWidth / contentWidth;
            const scaleY = availHeight / contentHeight;

            // Use 96% of available space
            const newScale = Math.min(scaleX, scaleY) * 0.96;

            setViewState({
                scale: Math.max(0.35, Math.min(newScale, 1.8)),
                shiftX,
                shiftY
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial

        return () => window.removeEventListener('resize', handleResize);
    }, [tiles.length, tiles]); // Dep on tiles to rescale if layout changes

    return (
        <div className={styles.boardContainer}>
            <div
                ref={boardRef}
                className={styles.boardContent}
                style={{ transform: `scale(${viewState.scale}) translate(${viewState.shiftX}px, ${viewState.shiftY}px)` }}
            >
                {tiles
                    .sort((a, b) => {
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
