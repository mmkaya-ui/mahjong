'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Tile, generateDeck, isBlocked, canMatch, shuffleTiles, generateSolvableBoard } from '@/utils/mahjong';
import { TURTLE_LAYOUT, EASY_LAYOUT, HARD_LAYOUT } from '@/utils/layouts';
import { useAudio } from './AudioContext';

type Difficulty = 'easy' | 'standard' | 'hard';

interface GameContextType {
    tiles: Tile[];
    score: number;
    matches: number;
    isGameOver: boolean;
    isWon: boolean;
    selectedTile: Tile | null;
    selectTile: (tile: Tile) => void;
    resetGame: () => void;
    shuffle: () => void;
    hint: Tile[] | null;
    requestHint: () => void;
    difficulty: Difficulty;
    setDifficulty: (diff: Difficulty) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [matches, setMatches] = useState(0);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
    const [hint, setHint] = useState<Tile[] | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('standard');

    const lastInteractionRef = useRef<number>(Date.now());
    const { playClickSound } = useAudio();

    // Auto-hint logic for Easy mode
    useEffect(() => {
        if (difficulty !== 'easy') return;

        const checkIdle = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionRef.current > 10000 && !hint && !isWon) {
                requestHint();
            }
        }, 2000);

        return () => clearInterval(checkIdle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty, hint, isWon, tiles]); // visual deps

    const initGame = useCallback(() => {
        let layout = TURTLE_LAYOUT;
        let targetCount = 144;

        if (difficulty === 'easy') {
            layout = EASY_LAYOUT;
            targetCount = 36;
        } else if (difficulty === 'hard') {
            layout = HARD_LAYOUT;
            targetCount = 144;
        }

        let deck = generateDeck(layout.length);

        // Safety: ensure deck is large enough or trimmed
        if (deck.length > layout.length) {
            deck = deck.slice(0, layout.length);
        }
        // If deck < layout, we have a problem (impossible to fill). 
        // Our layouts should match deck sizes (36, 144).

        // Use Solvable Board Generator
        const initialTiles = generateSolvableBoard(layout, deck);

        // Final update of state properties
        const readyTiles = initialTiles.map(t => ({
            ...t,
            isVisible: true,
            isClickable: !isBlocked(t, initialTiles),
            isSelected: false
        }));

        setTiles(readyTiles);
        setScore(0);
        setMatches(0);
        setSelectedTile(null);
        setHint(null);
        setIsWon(false);
        lastInteractionRef.current = Date.now();
    }, [difficulty]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const selectTile = (tile: Tile) => {
        if (!tile.isClickable) return;

        lastInteractionRef.current = Date.now();
        playClickSound();

        if (selectedTile && selectedTile.id === tile.id) {
            // Deselect
            setSelectedTile(null);
            setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isSelected: false } : t));
            return;
        }

        if (selectedTile) {
            // Attempt match
            if (canMatch(selectedTile, tile)) {
                // MATCH!
                const newScore = score + 10; // Simple scoring
                setScore(newScore);
                setMatches(m => m + 1);

                // Remove tiles
                const remaining = tiles.filter(t => t.id !== selectedTile.id && t.id !== tile.id);

                // Recalculate clickability for ALL remaining tiles (could be optimized)
                const updated = remaining.map(t => ({
                    ...t,
                    isClickable: !isBlocked(t, remaining),
                    isSelected: false
                }));

                setTiles(updated);
                setSelectedTile(null);
                setHint(null); // Clear hint on move

                if (updated.length === 0) {
                    setIsWon(true);
                }
            } else {
                // No match, swap selection
                setTiles(prev => prev.map(t => {
                    if (t.id === selectedTile.id) return { ...t, isSelected: false };
                    if (t.id === tile.id) return { ...t, isSelected: true };
                    return t;
                }));
                setSelectedTile(tile);
            }
        } else {
            // Select first
            setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isSelected: true } : t));
            setSelectedTile(tile);
        }
    };

    const shuffle = () => {
        lastInteractionRef.current = Date.now();
        const shuffled = shuffleTiles(tiles);
        // Recalculate blocked status (positions same, but just safety)
        const updated = shuffled.map(t => ({
            ...t,
            isClickable: !isBlocked(t, shuffled),
            isSelected: false
        }));
        setTiles(updated);
        setSelectedTile(null);
        setHint(null);
    };

    const requestHint = () => {
        // Find any open pair
        const openTiles = tiles.filter(t => t.isClickable);
        for (let i = 0; i < openTiles.length; i++) {
            for (let j = i + 1; j < openTiles.length; j++) {
                if (canMatch(openTiles[i], openTiles[j])) {
                    setHint([openTiles[i], openTiles[j]]);
                    return;
                }
            }
        }
    };

    return (
        <GameContext.Provider
            value={{
                tiles,
                score,
                matches,
                isGameOver: false, // TODO: Implement check for no moves
                isWon,
                selectedTile,
                selectTile,
                resetGame: initGame,
                shuffle,
                hint,
                requestHint,
                difficulty,
                setDifficulty
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
