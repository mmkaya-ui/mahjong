'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SoundSanctuary.module.css';

interface Props {
    onClose: () => void;
}

export default function SoundSanctuary({ onClose }: Props) {
    const { ambientType, setAmbientType, volume, setVolume, isPlaying, togglePlay } = useAudio();
    const { t } = useLanguage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.settings.soundSanctuary}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    <div className={styles.section}>
                        <h3>Frequency</h3>
                        <div className={styles.options}>
                            <button
                                className={`${styles.optionBtn} ${ambientType === 'healing' ? styles.active : ''}`}
                                onClick={() => setAmbientType('healing')}
                            >
                                {t.sounds.healing}
                            </button>
                            <button
                                className={`${styles.optionBtn} ${ambientType === 'nature' ? styles.active : ''}`}
                                onClick={() => setAmbientType('nature')}
                            >
                                {t.sounds.nature}
                            </button>
                            <button
                                className={`${styles.optionBtn} ${ambientType === 'off' ? styles.active : ''}`}
                                onClick={() => setAmbientType('off')}
                            >
                                {t.sounds.off}
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Playback</h3>
                        <button
                            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                            onClick={togglePlay}
                            disabled={ambientType === 'off'}
                        >
                            {isPlaying ? t.game.paused : t.game.start}
                        </button>
                    </div>

                    <div className={styles.section}>
                        <h3>Volume</h3>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
