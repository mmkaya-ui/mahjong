'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Tile, generateDeck, canMatch, shuffleTiles, generateSolvableBoard } from '@/utils/mahjong';
import { TURTLE_LAYOUT, EASY_LAYOUT, HARD_LAYOUT } from '@/utils/layouts';
import { useAudio } from './AudioContext';
import { BoardEngine } from '@/core/game/BoardEngine';
import { GAME_CONSTANTS } from '@/config/constants';

type Difficulty = 'easy' | 'normal' | 'hard';

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
    gameMode: 'zen' | 'realism';
    setGameMode: (mode: 'zen' | 'realism') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [matches, setMatches] = useState(0);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
    const [hint, setHint] = useState<Tile[] | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [gameMode, setGameMode] = useState<'zen' | 'realism'>('zen');

    const lastInteractionRef = useRef<number>(Date.now());
    const { playClickSound } = useAudio();

    // Auto-hint logic for Easy mode
    useEffect(() => {
        if (difficulty !== 'easy') return;
        const checkIdle = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionRef.current > GAME_CONSTANTS.HINT_IDLE_MS && !hint && !isWon) {
                requestHint();
            }
        }, GAME_CONSTANTS.HINT_CHECK_INTERVAL);
        return () => clearInterval(checkIdle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty, hint, isWon, tiles]);

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

        if (deck.length > layout.length) {
            deck = deck.slice(0, layout.length);
        }

        let initialTiles: Tile[] = [];

        if (gameMode === 'realism') {
            // True Random Shuffle
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            initialTiles = layout.map((pos, i) => ({
                ...pos,
                id: deck[i].id,
                type: deck[i].type,
                value: deck[i].value,
                isVisible: true,
                isClickable: true,
                isSelected: false
            } as Tile));
        } else {
            // Zen Mode: Solvable
            initialTiles = generateSolvableBoard(layout, deck);
        }

        // Optimized Engine Update
        const engine = new BoardEngine(initialTiles);
        const readyTiles = engine.updateAllStatus(initialTiles);

        setTiles(readyTiles);
        setScore(0);
        setMatches(0);
        setSelectedTile(null);
        setHint(null);
        setIsWon(false);
        lastInteractionRef.current = Date.now();
    }, [difficulty, gameMode]);

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
            if (canMatch(selectedTile, tile)) {
                // MATCH!
                const newScore = score + GAME_CONSTANTS.SCORE_MATCH;
                setScore(newScore);
                setMatches(m => m + 1);

                // Remove tiles
                const remaining = tiles.filter(t => t.id !== selectedTile.id && t.id !== tile.id);

                // Optimized Update
                const engine = new BoardEngine(remaining);
                const updated = engine.updateAllStatus(remaining);

                setTiles(updated);
                setSelectedTile(null);
                setHint(null);

                if (updated.length === 0) {
                    setIsWon(true);
                }
            } else {
                // No match
                setTiles(prev => prev.map(t => {
                    if (t.id === selectedTile.id) return { ...t, isSelected: false };
                    if (t.id === tile.id) return { ...t, isSelected: true };
                    return t;
                }));
                setSelectedTile(tile);
            }
        } else {
            setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, isSelected: true } : t));
            setSelectedTile(tile);
        }
    };

    const shuffle = () => {
        lastInteractionRef.current = Date.now();
        const shuffled = shuffleTiles(tiles);

        const engine = new BoardEngine(shuffled);
        const updated = engine.updateAllStatus(shuffled);

        setTiles(updated);
        setSelectedTile(null);
        setHint(null);
    };

    const requestHint = () => {
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
                isGameOver: false,
                isWon,
                selectedTile,
                selectTile,
                resetGame: initGame,
                shuffle,
                hint,
                requestHint,
                difficulty,
                setDifficulty,
                gameMode,
                setGameMode
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
