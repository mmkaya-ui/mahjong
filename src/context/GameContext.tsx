'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Tile, generateDeck, canMatch, shuffleTiles, generateSolvableBoard } from '@/utils/mahjong';
import { TURTLE_LAYOUT, EASY_LAYOUT, HARD_LAYOUT } from '@/utils/layouts';
import { useAudio } from './AudioContext';
import { BoardEngine } from '@/core/game/BoardEngine';
import { GAME_CONSTANTS } from '@/config/constants';

type Difficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'zen' | 'realism' | 'hardcore' | 'maximum';

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
    canShuffle: boolean;
    shufflesRemaining: number;
    hint: Tile[] | null;
    requestHint: () => void;
    difficulty: Difficulty;
    setDifficulty: (diff: Difficulty) => void;
    gameMode: GameMode;
    setGameMode: (mode: GameMode) => void;
    gameId: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [matches, setMatches] = useState(0);
    const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
    const [hint, setHint] = useState<Tile[] | null>(null);
    const [isWon, setIsWon] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [gameMode, setGameMode] = useState<GameMode>('zen');
    const [gameId, setGameId] = useState(0); // For forcing re-renders

    // Hardcore mode specific
    const [shufflesRemaining, setShufflesRemaining] = useState(GAME_CONSTANTS.FREE_SHUFFLES);

    const lastInteractionRef = useRef<number>(Date.now());
    const { playClickSound } = useAudio();

    // Auto-hint logic for Easy mode
    useEffect(() => {
        if (difficulty !== 'easy') return;
        const checkIdle = setInterval(() => {
            const now = Date.now();
            if (now - lastInteractionRef.current > GAME_CONSTANTS.HINT_IDLE_MS && !hint && !isWon && !isGameOver) {
                requestHint();
            }
        }, GAME_CONSTANTS.HINT_CHECK_INTERVAL);
        return () => clearInterval(checkIdle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [difficulty, hint, isWon, isGameOver, tiles]);

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

        // Zen = Solvable. Others = Random.
        if (gameMode === 'zen') {
            initialTiles = generateSolvableBoard(layout, deck);
        } else {
            // True Random Shuffle (Realism, Hardcore, Maximum)
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
        setIsGameOver(false);
        setShufflesRemaining(GAME_CONSTANTS.FREE_SHUFFLES);
        setGameId(prev => prev + 1);
        lastInteractionRef.current = Date.now();
    }, [difficulty, gameMode]);

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Check for moves availability
    const checkMoves = (currentTiles: Tile[]) => {
        const openTiles = currentTiles.filter(t => t.isClickable);
        let hasMove = false;
        for (let i = 0; i < openTiles.length; i++) {
            for (let j = i + 1; j < openTiles.length; j++) {
                if (canMatch(openTiles[i], openTiles[j])) {
                    hasMove = true;
                    break;
                }
            }
            if (hasMove) break;
        }

        if (!hasMove) {
            console.log("No moves available!");
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('mahjong-no-moves'));
            }

            // Strict Mode Logic
            if (gameMode === 'maximum') {
                // Instant Loss
                setIsGameOver(true);
            } else if (gameMode === 'hardcore') {
                // Check if shuffle is possible
                const canPay = score >= GAME_CONSTANTS.SHUFFLE_PENALTY;
                const hasFree = shufflesRemaining > 0;
                if (!hasFree && !canPay) {
                    // Can't afford shuffle -> Loss
                    setIsGameOver(true);
                }
            }
        }
    };

    const selectTile = (tile: Tile) => {
        if (!tile.isClickable || isGameOver || isWon) return;

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
                } else {
                    checkMoves(updated);
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
        if (isGameOver || isWon) return;

        // Mode Rules
        if (gameMode === 'maximum') return; // Should be disabled in UI

        if (gameMode === 'hardcore') {
            if (shufflesRemaining > 0) {
                setShufflesRemaining(p => p - 1);
            } else {
                if (score >= GAME_CONSTANTS.SHUFFLE_PENALTY) {
                    setScore(s => s - GAME_CONSTANTS.SHUFFLE_PENALTY);
                } else {
                    // Fail safe: Can't shuffle
                    return;
                }
            }
        }

        lastInteractionRef.current = Date.now();
        const shuffled = shuffleTiles(tiles);

        const engine = new BoardEngine(shuffled);
        const updated = engine.updateAllStatus(shuffled);

        setTiles(updated);
        setSelectedTile(null);
        setHint(null);

        // Re-check moves after shuffle (should vary rarely happen that shuffle is also stuck)
        checkMoves(updated);
    };

    const requestHint = () => {
        if (isGameOver || isWon) return;
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

    // Check if player can shuffle
    const canShuffle = useMemo(() => {
        if (gameMode === 'zen' || gameMode === 'realism') return true;
        if (gameMode === 'maximum') return false;
        if (gameMode === 'hardcore') {
            return shufflesRemaining > 0 || score >= GAME_CONSTANTS.SHUFFLE_PENALTY;
        }
        return true;
    }, [gameMode, shufflesRemaining, score]);

    return (
        <GameContext.Provider
            value={{
                tiles,
                score,
                matches,
                isGameOver,
                isWon,
                selectedTile,
                selectTile,
                resetGame: initGame,
                shuffle,
                canShuffle,
                shufflesRemaining,
                hint,
                requestHint,
                difficulty,
                setDifficulty,
                gameMode,
                setGameMode,
                gameId
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
