'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tile, generateDeck, isBlocked, canMatch, shuffleTiles } from '@/utils/mahjong';
import { TURTLE_LAYOUT } from '@/utils/layouts';
import { useAudio } from './AudioContext';

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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [matches, setMatches] = useState(0);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
    const [hint, setHint] = useState<Tile[] | null>(null);
    const [isWon, setIsWon] = useState(false);

    const { playClickSound } = useAudio();

    const initGame = useCallback(() => {
        const deck = generateDeck();
        // Assign deck to layout
        // Shuffle deck first randomly
        deck.sort(() => Math.random() - 0.5);

        // Take first 144 positions (or max available)
        const newTiles: Tile[] = TURTLE_LAYOUT.slice(0, deck.length).map((pos, i) => ({
            ...pos,
            ...deck[i],
            isVisible: true,
            isClickable: true, // Will calculate
            isSelected: false
        }));

        // Calculate initial clickability
        const playableTiles = newTiles.map(t => ({
            ...t,
            isClickable: !isBlocked(t, newTiles)
        }));

        setTiles(playableTiles);
        setScore(0);
        setMatches(0);
        setSelectedTile(null);
        setHint(null);
        setIsWon(false);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const selectTile = (tile: Tile) => {
        if (!tile.isClickable) return;

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
                    isSelected: false // Clear selection
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
                requestHint
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
