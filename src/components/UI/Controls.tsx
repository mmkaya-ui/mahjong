'use client';

import React from 'react';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Controls.module.css';

interface Props {
    onOpenSound: () => void;
}

export default function Controls({ onOpenSound }: Props) {
    const { score, shuffle, requestHint, isWon, resetGame, difficulty, setDifficulty } = useGame();
    const { t, language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        const next: Record<string, 'tr' | 'en' | 'de'> = { tr: 'en', en: 'de', de: 'tr' };
        setLanguage(next[language]);
    };

    const toggleDifficulty = () => {
        const next: Record<string, 'easy' | 'standard' | 'hard'> = {
            easy: 'standard',
            standard: 'hard',
            hard: 'easy'
        };
        setDifficulty(next[difficulty]);
    };

    return (
        <div className={styles.controlsBar}>
            <div className={styles.stats}>
                <div className={styles.scoreBlock}>
                    <span className={styles.label}>{t.game.score}</span>
                    <span className={styles.value}>{score}</span>
                </div>
                {isWon && <div className={styles.wonBadge}>{t.game.won}</div>}
            </div>

            <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={shuffle}>
                    {t.game.shuffle}
                </button>
                <button className={styles.actionBtn} onClick={requestHint}>
                    {t.game.hint}
                </button>
                <button
                    className={styles.diffBtn}
                    onClick={toggleDifficulty}
                    style={{
                        background: difficulty === 'easy' ? '#2ecc71' : difficulty === 'hard' ? '#e74c3c' : '#f1c40f',
                        color: '#fff'
                    }}
                    title="Change Difficulty"
                >
                    {difficulty.toUpperCase()}
                </button>
                <button className={styles.iconBtn} onClick={onOpenSound} aria-label="Sound Settings">
                    🎵
                </button>
                <button className={styles.iconBtn} onClick={toggleLanguage} aria-label="Change Language">
                    {language.toUpperCase()}
                </button>
            </div>

            {isWon && (
                <button className={styles.resetBtn} onClick={resetGame}>
                    Play Again
                </button>
            )}
        </div>
    );
}
