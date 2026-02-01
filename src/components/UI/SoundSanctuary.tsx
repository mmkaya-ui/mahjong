'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SoundSanctuary.module.css';

interface Props {
    onClose: () => void;
}

export default function SoundSanctuary({ onClose }: Props) {
    const { frequency, setFrequency, isNatureOn, toggleNature, volume, setVolume, isPlaying, togglePlay } = useAudio();
    const { t } = useLanguage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.settings.soundSanctuary}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className={styles.scrollContent}>
                    <div className={styles.section}>
                        <h3>{t.sounds.healing} (Base)</h3>
                        <div className={styles.options}>
                            <button
                                className={`${styles.optionBtn} ${frequency === '528' ? styles.active : ''}`}
                                onClick={() => setFrequency('528')}
                            >
                                528 Hz (Love & Repair)
                            </button>
                            <button
                                className={`${styles.optionBtn} ${frequency === '432' ? styles.active : ''}`}
                                onClick={() => setFrequency('432')}
                            >
                                432 Hz (Peace & Nature)
                            </button>
                            <button
                                className={`${styles.optionBtn} ${frequency === 'off' ? styles.active : ''}`}
                                onClick={() => setFrequency('off')}
                            >
                                {t.sounds.off}
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Ambience Layer</h3>
                        <button
                            className={`${styles.optionBtn} ${isNatureOn ? styles.active : ''}`}
                            onClick={toggleNature}
                            style={{ width: '100%' }}
                        >
                            {isNatureOn ? '🌧️ Nature Sounds ON' : '☁️ Nature Sounds OFF'}
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '8px' }}>
                            Mixes gentle rain and chirps with the base frequency.
                        </p>
                    </div>

                    <div className={styles.section}>
                        <h3>Playback</h3>
                        <button
                            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                            onClick={togglePlay}
                        // disabled only if BOTH are off, or just allow play to start defaults?
                        // Let's allow play, if both off, silence plays (logic handles it).
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
                            step="0.05" // Coarser step to prevent event spam?
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className={styles.slider}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
