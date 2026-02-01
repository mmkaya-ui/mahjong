'use client';

import React, { useState } from 'react';
import { Shuffle, Lightbulb, Volume2, Globe, Signal, CircleHelp } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Controls.module.css';
import HelpModal from './HelpModal';
import Celebration from './Celebration';

interface Props {
    onOpenSound: () => void;
}

export default function Controls({ onOpenSound }: Props) {
    const { score, shuffle, requestHint, isWon, resetGame, difficulty, setDifficulty, gameMode, setGameMode } = useGame();
    const { t, language, setLanguage } = useLanguage();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const toggleLanguage = () => {
        const next: Record<string, 'tr' | 'en' | 'de'> = { tr: 'en', en: 'de', de: 'tr' };
        setLanguage(next[language]);
    };

    const toggleDifficulty = () => {
        const next: Record<string, 'easy' | 'normal' | 'hard'> = {
            easy: 'normal',
            normal: 'hard',
            hard: 'easy'
        };
        setDifficulty(next[difficulty]);
    };

    return (
        <>
            {isWon && <Celebration />}
            <div className={styles.controlsBar}>
                <div className={styles.stats}>
                    <div className={styles.scoreBlock}>
                        <span className={styles.label}>{t.game.score}</span>
                        <span className={styles.value}>{score}</span>
                    </div>
                    {isWon && <div className={styles.wonBadge}>{t.game.won}</div>}
                </div>

                <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={shuffle} aria-label={t.game.shuffle}>
                        <Shuffle size={18} />
                        <span>{t.game.shuffle}</span>
                    </button>
                    <button className={styles.actionBtn} onClick={requestHint} aria-label={t.game.hint}>
                        <Lightbulb size={18} />
                        <span>{t.game.hint}</span>
                    </button>
                    <button
                        className={styles.diffBtn}
                        onClick={toggleDifficulty}
                        style={{
                            background: difficulty === 'easy' ? '#2ecc71' : difficulty === 'hard' ? '#e74c3c' : '#f1c40f',
                            color: '#fff',
                        }}
                        title="Change Difficulty"
                    >
                        <Signal size={16} />
                        <span>{t.difficulties[difficulty]}</span>
                    </button>
                    <button
                        className={styles.diffBtn}
                        onClick={() => setGameMode(gameMode === 'zen' ? 'realism' : 'zen')}
                        style={{
                            background: gameMode === 'zen' ? '#1abc9c' : '#8e44ad',
                            color: '#fff'
                        }}
                        title="Change Game Mode"
                    >
                        <span>{gameMode === 'zen' ? '☯️ ZEN' : '🎲 REAL'}</span>
                    </button>
                    <div className={styles.iconGroup}>
                        <button className={styles.iconBtn} onClick={onOpenSound} aria-label="Sound Settings">
                            <Volume2 size={20} />
                        </button>
                        <button className={styles.iconBtn} onClick={toggleLanguage} aria-label="Change Language">
                            <Globe size={20} />
                            <span className={styles.langBadgbe}>{language.toUpperCase()}</span>
                        </button>
                        <button className={styles.iconBtn} onClick={() => setIsHelpOpen(true)} aria-label="Help">
                            <CircleHelp size={20} />
                        </button>
                    </div>
                </div>

                {isWon && (
                    <button className={styles.resetBtn} onClick={resetGame}>
                        Play Again
                    </button>
                )}
            </div>

            {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
        </>
    );
}
