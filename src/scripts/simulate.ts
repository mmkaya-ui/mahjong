
import { generateDeck, generateSolvableBoard, shuffleTiles, canMatch, Tile } from '../utils/mahjong';
import { TURTLE_LAYOUT, EASY_LAYOUT, HARD_LAYOUT, TilePosition } from '../utils/layouts';
import { BoardEngine } from '../core/game/BoardEngine';

// Mock Browser Environment for "window" or "env" if needed (unlikely for pure logic)
// But mahjong.ts uses console, which is fine.

async function runSimulation() {
    console.log("Starting Extensive Mahjong Simulation...");
    console.log("========================================");

    const MODES = ['zen', 'realism'] as const;
    const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
    const ITERATIONS = 100; // 100 games per configuration

    for (const diff of DIFFICULTIES) {
        for (const mode of MODES) {
            console.log(`\nTesting: Difficulty=[${diff.toUpperCase()}], Mode=[${mode.toUpperCase()}]`);
            let wins = 0;
            let stuck = 0;
            let errors = 0;

            for (let i = 0; i < ITERATIONS; i++) {
                try {
                    const result = simulateOneGame(diff, mode);
                    if (result === 'win') wins++;
                    else stuck++;
                } catch (e) {
                    console.error("Game Error:", e);
                    errors++;
                }

                // Progress indicator
                if (i % 20 === 0) process.stdout.write('.');
            }
            console.log(""); // newline
            console.log(`Results (${ITERATIONS} games):`);
            console.log(`✅ Wins: ${wins} (${(wins / ITERATIONS * 100).toFixed(1)}%)`);
            console.log(`❌ Stuck: ${stuck}`);
            if (errors > 0) console.log(`⚠️ Errors: ${errors}`);

            if (mode === 'zen' && wins < 90) {
                console.warn("⚠️ WARNING: Zen mode win rate is suspiciously low. Check generator.");
            }
        }
    }
}

function simulateOneGame(difficulty: string, mode: string): 'win' | 'stuck' {
    // 1. Setup Board
    let layout: TilePosition[] = TURTLE_LAYOUT;
    let targetCount = 144;

    if (difficulty === 'easy') {
        layout = EASY_LAYOUT;
        targetCount = 36;
    } else if (difficulty === 'hard') {
        layout = HARD_LAYOUT;
        targetCount = 144;
    }

    let deck = generateDeck(layout.length);
    // Deck handling matches GameContext behavior
    if (deck.length > layout.length) {
        deck = deck.slice(0, layout.length);
    }

    let tiles: Tile[] = [];

    if (mode === 'realism') {
        // True Random
        // Shuffle deck
        const shuffledDeck = [...deck];
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
        }

        tiles = layout.map((pos, i) => ({
            ...pos,
            id: shuffledDeck[i].id,
            type: shuffledDeck[i].type,
            value: shuffledDeck[i].value,
            isVisible: true,
            isClickable: true,
            isSelected: false
        } as Tile));
    } else {
        // Zen
        tiles = generateSolvableBoard(layout, deck);
    }

    // Initialize Engine
    let engine = new BoardEngine(tiles);
    tiles = engine.updateAllStatus(tiles);

    // 2. Play Loop (Greedy Strategy)
    // Keep removing matching pairs until empty or stuck
    let movesMade = 0;
    while (tiles.length > 0) {
        // Get clickable tiles
        const clickables = tiles.filter(t => t.isClickable);

        // Find best match? Just first match.
        // Heuristic: Matches that "free" the most tiles? 
        // For verify, simple greedy is usually enough to test basic playability.
        let matchFound = false;

        // Optimize: Group by type+value to find matches fast
        const groups = new Map<string, Tile[]>();
        for (const t of clickables) {
            const key = `${t.type}-${t.value}`; // Value matching check logic is complex for flowers/seasons
            // Actually use canMatch helper, but that's O(N^2). 
            // N is small (max 144), clickable is smaller (~20-50). So N^2 is fine.
        }

        // Simple Scan O(N^2)
        outer: for (let i = 0; i < clickables.length; i++) {
            for (let j = i + 1; j < clickables.length; j++) {
                if (canMatch(clickables[i], clickables[j])) {
                    // Execute Move
                    const t1 = clickables[i];
                    const t2 = clickables[j];

                    // Remove
                    tiles = tiles.filter(t => t.id !== t1.id && t.id !== t2.id);

                    // Update Status
                    engine = new BoardEngine(tiles);
                    tiles = engine.updateAllStatus(tiles);

                    matchFound = true;
                    movesMade++;
                    break outer;
                }
            }
        }

        if (!matchFound) {
            // Stuck!
            // In Zen mode, stuck might happen due to greedy choice, but should be rare if "Solvable" is robust?
            // "Solvable" guarantees *A* solution exists. Greedy player might miss it.
            // But if generator is good, usually greedy works often.
            return 'stuck';
        }
    }

    return 'win';
}

runSimulation().catch(console.error);
