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
    // Smart Shuffle:
    // 1. Collect all tile identities (type/value)
    // 2. Reposition all tiles into a flat grid (z=0) to ensure solvability and avoid stacks.
    // 3. Shuffle identities.

    const count = currentTiles.length;
    if (count === 0) return [];

    // Calculate Grid Dimensions
    // approximate square
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    // Center offset (approx based on Turtle center ~14,8)
    // Grid unit 2x2.
    // Start X = 14 - (cols * 2) / 2 = 14 - cols
    // Start Y = 8 - (rows * 2) / 2 = 8 - rows
    const startX = 14 - cols;
    const startY = 8 - rows;

    const newPositions: TilePosition[] = [];
    for (let i = 0; i < count; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        newPositions.push({
            x: (startX + c * 2),
            y: (startY + r * 2),
            z: 0
        });
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
        isClickable: true, // Flat grid always clickable
        isSelected: false
    } as Tile));
}

export function generateSolvableBoard(layout: TilePosition[], deck: Omit<Tile, 'x' | 'y' | 'z' | 'isVisible' | 'isClickable' | 'isSelected'>[]): Tile[] {
    // 1. Clone layout to track "remaining" tiles during generation
    // We strictly need to simulate the game in reverse? 
    // Actually, we simulate "Playing the game" to remove tiles, but we assign values as we go.
    // So: Start with FULL board of Unassigned tiles.
    // Find tiles that CAN be removed (unblocked).
    // Pick 2. Assign them a matching pair from the deck.
    // Remove them. 
    // Repeat.

    // We need to track which positions are currently "on the board" to calculate blocking.
    // Initially ALL layout positions are on the board.
    let pendingPositions = layout.map((p, i) => ({ ...p, id: `pos-${i}`, tempId: i }));
    const assignedTiles: Tile[] = [];

    // Shuffle the deck of values (pairs) so we assign random pairs
    // The deck needs to be pairs. generateDeck returns a flat list.
    // We should group them or just pop 2 matching? 
    // Deck is already fully populated. We just shuffle it.
    const shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }

    // We need to pair them up.
    // Actually simpler: Just sort deck by type+value to find pairs easily, THEN shuffle the PAIRS?
    // No, standard deck has 4 of each usually.
    // Let's just take the shuffled deck, find a match for the first item, remove both, use them.
    // Performance might be poor if we search every time.
    // Better: Group deck into pairs first.
    const pairs: [typeof deck[0], typeof deck[0]][] = [];
    while (shuffledDeck.length >= 2) {
        const first = shuffledDeck.pop()!;
        // Find a match
        const matchIndex = shuffledDeck.findIndex(t => canMatch({ ...t, x: 0, y: 0, z: 0, isVisible: true, isClickable: true, isSelected: false, id: 'temp' }, { ...first, x: 0, y: 0, z: 0, isVisible: true, isClickable: true, isSelected: false, id: 'temp2' }));

        if (matchIndex !== -1) {
            const second = shuffledDeck.splice(matchIndex, 1)[0];
            pairs.push([first, second]);
        } else {
            // Should not happen in a proper mahjong deck unless odd count
            console.warn("Odd tile found during pair generation", first);
        }
    }

    // Shuffle the pairs
    for (let i = pairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }

    // Simulation Loop
    // While positions remain:
    while (pendingPositions.length > 0) {
        // Find available positions
        // A position is available if !isBlocked.
        // We use BoardEngine.

        // Adapt pendingPositions to Tile[] for Engine
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
        // Engine's isBlocked is much faster.

        const availableIndices = pendingPositions
            .map((_, i) => i)
            .filter(i => !engine.isBlocked(currentBoardForCheck[i]));

        if (availableIndices.length < 2) {
            if (pendingPositions.length > 0) {
                console.error("Layout Stuck! No available moves during generation.");
                break;
            }
        }

        const idx1 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        let idx2 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        while (idx1 === idx2 && availableIndices.length > 1) {
            idx2 = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        }

        const pos1 = pendingPositions[idx1];
        const pos2 = pendingPositions[idx2];

        const pair = pairs.pop();
        if (!pair) break;

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

    return assignedTiles;
}
