import React from 'react';
import { Tile as TileType } from '@/utils/mahjong';
import styles from './Tile.module.css';

interface TileProps {
    tile: TileType;
    onClick: (tile: TileType) => void;
    isHinted?: boolean;
}

// Map types/values to Unicode or Custom display
const getTileContent = (tile: TileType) => {
    // Unicode mapping
    // U+1F000 - Mahjong Tiles
    // Base offset logic:
    // East: 1F000
    // South: 1F001 ...

    // Implementation detail: Unicode block 1F000
    // Winds: East(00), South(01), West(02), North(03) -> 1F000..3
    // Dragons: Red(04), Green(05), White(06) -> 1F004..6
    // Characters 1-9: 1F007..F
    // Bamboos 1-9: 1F010..8
    // Dots 1-9: 1F019..1F021
    // Flowers: 1F022..5
    // Seasons: 1F026..9

    const base = 0x1F000;
    let offset = 0;

    switch (tile.type) {
        case 'wind':
            const winds = ['east', 'south', 'west', 'north'];
            offset = winds.indexOf(tile.value as string);
            break;
        case 'dragon':
            const dragons = ['red', 'green', 'white'];
            offset = 4 + dragons.indexOf(tile.value as string);
            break;
        case 'character':
            offset = 7 + (typeof tile.value === 'number' ? tile.value - 1 : 0);
            break;
        case 'bamboo':
            offset = 16 + (typeof tile.value === 'number' ? tile.value - 1 : 0);
            break;
        case 'dots':
            offset = 25 + (typeof tile.value === 'number' ? tile.value - 1 : 0);
            break;
        case 'flower':
            // flowers: plum, orchid, bamboo, chrysanthemum
            const flowers = ['plum', 'orchid', 'bamboo', 'chrysanthemum'];
            offset = 34 + flowers.indexOf(tile.value as string);
            break;
        case 'season':
            // seasons: spring, summer, autumn, winter
            const seasons = ['spring', 'summer', 'autumn', 'winter'];
            offset = 38 + seasons.indexOf(tile.value as string);
            break;
    }

    return String.fromCodePoint(base + offset);
};

// Colors for the face content
const getTileColor = (tile: TileType) => {
    if (tile.type === 'dragon' && tile.value === 'red') return '#e74c3c';
    if (tile.type === 'dragon' && tile.value === 'green') return '#27ae60';
    if (tile.type === 'dragon' && tile.value === 'white') return '#2980b9'; // Blue for white dragon usually
    if (tile.type === 'bamboo') return '#27ae60';
    if (tile.type === 'character') return '#e67e22'; // Orange/Red
    if (tile.type === 'dots') return '#2980b9';
    if (tile.type === 'flower') return '#d63384'; // Pink
    if (tile.type === 'season') return '#8e44ad'; // Purple
    return '#34495e';
};

export default function Tile({ tile, onClick, isHinted }: TileProps) {
    // Tile Dimensions:
    // Base width/height. We scale using CSS font-size.

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(tile);
    };

    return (
        <div
            className={`${styles.tileWrapper} ${tile.isClickable ? styles.clickable : styles.blocked} ${tile.isSelected ? styles.selected : ''} ${isHinted ? styles.hinted : ''}`}
            style={{
                left: `calc(50% + ${(tile.x - 14) * 26}px)`, // Centering logic: offset from center (14ish)
                top: `calc(50% + ${(tile.y - 8) * 32}px)`,
                zIndex: tile.z * 10 + (tile.y), // zIndex based on layer AND Y-position to prevent occlusion issues
                // Note: Mahjong visual stacking. Tiles lower in Y should be "in front" of tiles behind them if at same Z?
                // Actually, CSS z-index is mainly for layers. Within a layer, DOM order or explicit Z matters.
                // We need (tile.x, tile.y, tile.z).
                // Standard projection:
                // x-offset = x * W/2
                // y-offset = y * H/2 - z * depth
            }}
            onClick={handleClick}
        >
            <div className={styles.tileMove} style={{ transform: `translateY(${-tile.z * 5}px)` }}>
                <div className={styles.tileFace} style={{ color: getTileColor(tile) }}>
                    {/* Render simplified SVG or Char */}
                    <span className={styles.symbol}>{getTileContent(tile)}</span>
                </div>
                <div className={styles.tileSide}></div>
            </div>
        </div>
    );
}
