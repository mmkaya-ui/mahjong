import React from 'react';
import { Tile as TileType } from '@/utils/mahjong';
import styles from './Tile.module.css';

interface TileProps {
    tile: TileType;
    onClick: (tile: TileType) => void;
    isHinted?: boolean;
    difficulty?: 'easy' | 'normal' | 'hard';
}

// ... (getTileContent and getTileColor remain the same)

const Tile = React.memo(({ tile, onClick, isHinted, difficulty = 'normal' }: TileProps) => { // Default to normal
    // Tile Dimensions:
    // Base width/height. We scale using CSS font-size.

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(tile);
    };

    // Determine difficulty class
    const diffClass = difficulty === 'hard' ? styles.hardMode : (difficulty === 'normal' ? styles.normalMode : '');

    return (
        <div
            className={`${styles.tileWrapper} ${tile.isClickable ? styles.clickable : styles.blocked} ${tile.isSelected ? styles.selected : ''} ${isHinted ? styles.hinted : ''} ${diffClass}`}
            style={{
                // Dynamic centering based on min/max is handled by container size usually, 
                // but since we are Absolute positioning, we need to ensure the group is centered.
                // However, the Board component doesn't actually re-center the group, it just scales.
                // We should center the tiles relative to the bounding box?
                // OR simpler: The CSS scale transforms from center? no default is center.
                // Let's just keep the absolute positions and let the flex container center the scaled board?
                // Board.module.css uses flex center? 
                // Actually BoardContent is: position: relative.
                // We should just translate them to be positive coordinates relative to minX/minY?
                // No, to keep it simple, let's just stick to the calculation but verify centering.
                // For now, keep as is, but maybe adjust offset if needed.
                left: `calc(50% + ${(tile.x - 14) * 26}px)`, // Centering logic around assumed center 14
                top: `calc(50% + ${(tile.y - 8) * 32}px)`,
            }}
            onClick={handleClick}
        >
            <div className={styles.tileMove} style={{ transform: `translateY(${-tile.z * 7}px)` }}>
                <div className={styles.tileFace} style={{ color: getTileColor(tile) }}>
                    {/* Render simplified SVG or Char */}
                    <span className={styles.symbol}>{getTileContent(tile)}</span>
                </div>
                <div className={styles.tileSide}></div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return prev.tile.id === next.tile.id &&
        prev.tile.isClickable === next.tile.isClickable &&
        prev.tile.isSelected === next.tile.isSelected &&
        prev.isHinted === next.isHinted &&
        prev.difficulty === next.difficulty && // Check difficulty
        prev.tile.isVisible === next.tile.isVisible &&
        prev.tile.x === next.tile.x && // Should not change usually
        prev.tile.y === next.tile.y &&
        prev.tile.z === next.tile.z &&
        prev.onClick === next.onClick; // Critical: Check handler to avoid stale closures
});

export default Tile;
