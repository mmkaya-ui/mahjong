import { TilePosition } from './layouts';

export interface Tile extends TilePosition {
    id: string; // unique id
    type: string; // 'dots', 'bamboo', 'character', 'wind', 'dragon', 'flower', 'season'
    value: number | string; // 1-9, 'east', 'green', etc.
    isVisible: boolean; // Is not covered by another tile directly on top
    isClickable: boolean; // Is strictly free (sides open & top open)
    isSelected: boolean;
}

// 34 types * 4 = 136 + 8 bonus = 144
const SUITS = ['dots', 'bamboo', 'character'];
const WINDS = ['east', 'south', 'west', 'north'];
const DRAGONS = ['red', 'green', 'white'];
const FLOWERS = ['plum', 'orchid', 'bamboo', 'chrysanthemum']; // 1 of each
const SEASONS = ['spring', 'summer', 'autumn', 'winter']; // 1 of each

export function generateDeck(): Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[] {
    const deck: Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[] = [];
    let id = 0;

    // Suits 1-9 (4 each)
    SUITS.forEach(suit => {
        for (let v = 1; v <= 9; v++) {
            for (let i = 0; i < 4; i++) {
                deck.push({ id: `tile-${id++}`, type: suit, value: v });
            }
        }
    });

    // Winds (4 each)
    WINDS.forEach(wind => {
        for (let i = 0; i < 4; i++) {
            deck.push({ id: `tile-${id++}`, type: 'wind', value: wind });
        }
    });

    // Dragons (4 each)
    DRAGONS.forEach(dragon => {
        for (let i = 0; i < 4; i++) {
            deck.push({ id: `tile-${id++}`, type: 'dragon', value: dragon });
        }
    });

    // Flowers (1 each)
    FLOWERS.forEach(f => {
        deck.push({ id: `tile-${id++}`, type: 'flower', value: f });
    });

    // Seasons (1 each)
    SEASONS.forEach(s => {
        deck.push({ id: `tile-${id++}`, type: 'season', value: s });
    });

    return deck;
}

export function isBlocked(tile: Tile, allTiles: Tile[]): boolean {
    // A tile is blocked if:
    // 1. There is a tile directly on top (z + 1) covering any part of it.
    // 2. There are tiles on BOTH left and right sides (same z).
    //    (Or blocked on left OR right? Standard Mahjong is accessible if Left OR Right is free)
    //    Wait, standard rule: "A tile is free if it has no tile on top AND it has a free space on either its left or right side."

    // Checking Top:
    // Tiles are 2x2. Overlap happens if distance < 2.
    const hasTop = allTiles.some(other =>
        other.z === tile.z + 1 &&
        Math.abs(other.x - tile.x) < 2 &&
        Math.abs(other.y - tile.y) < 2
    );
    if (hasTop) return true;

    // Checking Sides (Left/Right) at same Z
    // Left: x - 2. Right: x + 2.
    // Overlap on Y axis must be significant (almost full overlap).
    // Actually, purely grid based: adjacent implies |dx| = 2.
    // If there's a tile at x-2 overlapping in Y.

    const hasLeft = allTiles.some(other =>
        other.z === tile.z &&
        other.x === tile.x - 2 &&
        Math.abs(other.y - tile.y) < 2
    );

    const hasRight = allTiles.some(other =>
        other.z === tile.z &&
        other.x === tile.x + 2 &&
        Math.abs(other.y - tile.y) < 2
    );

    return hasLeft && hasRight;
}

export function canMatch(t1: Tile, t2: Tile): boolean {
    if (t1.id === t2.id) return false;
    if (t1.type !== t2.type) {
        // Special cases: Flowers and Seasons match any of their kind
        if (t1.type === 'flower' && t2.type === 'flower') return true;
        if (t1.type === 'season' && t2.type === 'season') return true;
        return false;
    }
    // Same type, check value
    if (t1.type === 'flower' || t1.type === 'season') return true;
    return t1.value === t2.value;
}

export function shuffleTiles(currentTiles: Tile[]): Tile[] {
    // Keep the same positions, but shuffle the content (identity) of the remaining tiles.
    // Get active tiles
    const deck = currentTiles.map(t => ({ id: t.id, type: t.type, value: t.value }));
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Reassign to current positions
    // Note: positions input might be all original positions, but we only have `currentTiles` remaining.
    // We should preserve the (x,y,z) of current tiles but swap the (type, value).

    return currentTiles.map((t, i) => ({
        ...t,
        id: deck[i].id, // Swap identity
        type: deck[i].type,
        value: deck[i].value,
        isSelected: false
    }));
}
