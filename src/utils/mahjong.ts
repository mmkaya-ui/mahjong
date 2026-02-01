import { TilePosition } from './layouts';
import { BoardEngine } from '@/core/game/BoardEngine';

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

export function generateDeck(targetCount: number = 144): Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[] {
    const deck: Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[] = [];
    let id = 0;

    if (targetCount === 36) {
        // Easy mode: Only use a few suits/types for simplicity. 
        // Need 18 pairs.
        // Use Seasons (4), Flowers (4) -> 8 tiles.
        // Use Dragons (3*4) -> 12 tiles.
        // Use Winds (4*4) -> 16 tiles.
        // Total 36.
        SEASONS.forEach(s => deck.push({ id: `tile-${id++}`, type: 'season', value: s }));
        FLOWERS.forEach(f => deck.push({ id: `tile-${id++}`, type: 'flower', value: f }));
        DRAGONS.forEach(d => { for (let i = 0; i < 4; i++) deck.push({ id: `tile-${id++}`, type: 'dragon', value: d }) });
        WINDS.forEach(w => { for (let i = 0; i < 4; i++) deck.push({ id: `tile-${id++}`, type: 'wind', value: w }) });
        return deck;
    }

    // Standard/Hard (144)
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

// NOTE: functions isBlocked removed, use BoardEngine

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
    // Smart Shuffle v2:
    // 1. Maintain the "footprint" of the original layout (Turtle ~28x16) to prevent camera jumps.
    // 2. Prevent deep stacks (max z=1 or 2) to avoid deadlocks.
    // 3. Ensure tiles are centered.

    const count = currentTiles.length;
    if (count === 0) return [];

    // Target footprint: Width ~24-28 (12-14 cols), Height ~16 (8 rows)
    const MAX_COLS = 12; // 24 units wide
    const MAX_ROWS = 8;  // 16 units high
    // Capacity per layer = 12 * 8 = 96.
    // With 144 tiles, we need z=0 and z=1 (partial).

    // Center calculation (Turtle center is 14, 8)
    // Our block width 24. StartX = 14 - 12 = 2.
    // Our block height 16. StartY = 8 - 8 = 0.
    const startX = 2;
    const startY = 0;

    const newPositions: TilePosition[] = [];
    let layer = 0;
    let index = 0;

    // Fill layers
    while (index < count) {
        for (let r = 0; r < MAX_ROWS && index < count; r++) {
            for (let c = 0; c < MAX_COLS && index < count; c++) {
                // Skew/Pattern to avoid "perfect alignment" blocking? 
                // Using step=2 is standard.
                // To minimize blocking, we can try step "checkerboard"? 
                // No, just fill straightforwardly. z=1 layer will be "on top" and easily removable.
                // z=0 layer edges will be removable.
                // It's a dense block, but shallow.

                newPositions.push({
                    x: startX + (c * 2),
                    y: startY + (r * 2),
                    z: layer
                });
                index++;
            }
        }
        layer++;
    }

    // Shuffle Identities
    const deck = currentTiles.map(t => ({ id: t.id, type: t.type, value: t.value }));
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Merge
    return newPositions.map((pos, i) => ({
        ...pos,
        id: deck[i].id,
        type: deck[i].type,
        value: deck[i].value,
        isVisible: true,
        // Clickable will be recalculated by BoardEngine, but set true for initial state safe
        isClickable: true,
        isSelected: false
    } as Tile));
}

export function generateSolvableBoard(layout: TilePosition[], deck: Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[]): Tile[] {
    // Retry loop to prevent stuck generation
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            // 1. Clone layout to track "remaining" tiles during generation
            let pendingPositions = layout.map((p, i) => ({ ...p, id: `pos-${i}`, tempId: i }));
            const assignedTiles: Tile[] = [];

            const shuffledDeck = [...deck];
            // Shuffle Deck
            for (let i = shuffledDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
            }

            // Create Pairs
            const pairs: [typeof deck[0], typeof deck[0]][] = [];
            while (shuffledDeck.length >= 2) {
                const first = shuffledDeck.pop()!;
                const matchIndex = shuffledDeck.findIndex(t => canMatch({ ...t, x: 0, y: 0, z: 0, isVisible: true, isClickable: true, isSelected: false, id: 'temp' }, { ...first, x: 0, y: 0, z: 0, isVisible: true, isClickable: true, isSelected: false, id: 'temp2' }));

                if (matchIndex !== -1) {
                    const second = shuffledDeck.splice(matchIndex, 1)[0];
                    pairs.push([first, second]);
                }
            }

            // Shuffle pairs
            for (let i = pairs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
            }

            // Simulation Loop
            while (pendingPositions.length > 0) {
                const currentBoardForCheck = pendingPositions.map(p => ({
                    ...p,
                    id: `temp-${p.tempId}`,
                    type: 'dummy',
                    value: 0,
                    isVisible: true,
                    isClickable: true,
                    isSelected: false
                } as Tile));

                const engine = new BoardEngine(currentBoardForCheck);

                const availableIndices = pendingPositions
                    .map((_, i) => i)
                    .filter(i => !engine.isBlocked(currentBoardForCheck[i]));

                if (availableIndices.length < 2) {
                    // Stuck! Throw to retry.
                    throw new Error("Layout Stuck! No available moves during generation.");
                }

                const idx1 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                let idx2 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                // Ensure distinct
                let retries = 0;
                while (idx1 === idx2 && availableIndices.length > 1 && retries < 10) {
                    idx2 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                    retries++;
                }

                if (idx1 === idx2) throw new Error("Could not find distinct pair");

                const pos1 = pendingPositions[idx1];
                const pos2 = pendingPositions[idx2];

                const pair = pairs.pop();
                if (!pair) break; // Should not happen if count matches

                assignedTiles.push({
                    ...pos1,
                    id: pair[0].id,
                    type: pair[0].type,
                    value: pair[0].value,
                    isVisible: true,
                    isClickable: true,
                    isSelected: false
                } as Tile);

                assignedTiles.push({
                    ...pos2,
                    id: pair[1].id,
                    type: pair[1].type,
                    value: pair[1].value,
                    isVisible: true,
                    isClickable: true,
                    isSelected: false
                } as Tile);

                pendingPositions = pendingPositions.filter(p => p.tempId !== pos1.tempId && p.tempId !== pos2.tempId);
            }

            // Validation
            if (assignedTiles.length === layout.length) {
                return assignedTiles;
            }
        } catch (e) {
            console.warn(`Generation attempt ${attempt + 1} failed, retrying...`);
            continue;
        }
    }

    // Fail safe: Random (Unsolvable Risk) but better than crash
    console.error("Solvable generation failed 5 attempts. Falling back to simple random shuffle.");
    // Just map layout to deck
    const failSafeDeck = [...deck];
    for (let i = failSafeDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [failSafeDeck[i], failSafeDeck[j]] = [failSafeDeck[j], failSafeDeck[i]];
    }
    return layout.map((pos, i) => ({
        ...pos,
        id: failSafeDeck[i]?.id || `failsafe-${i}`,
        type: failSafeDeck[i]?.type || 'dots',
        value: failSafeDeck[i]?.value || 1,
        isVisible: true,
        isClickable: true,
        isSelected: false
    } as Tile));
}
