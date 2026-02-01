'use client';

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SoundSanctuary.module.css';

interface Props {
    onClose: () => void;
}

export default function SoundSanctuary({ onClose }: Props) {
    const { frequency, setFrequency, layers, toggleLayer, volume, setVolume, isPlaying, togglePlay } = useAudio();
    const { t } = useLanguage();

    const frequencies = [
        { id: 'off', label: 'OFF', desc: 'Silence' },
        { id: '396', label: '396 Hz', desc: 'Liberation of Fear' },
        { id: '432', label: '432 Hz', desc: 'Peace & Nature' },
        { id: '528', label: '528 Hz', desc: 'Repair & Love' },
        { id: '639', label: '639 Hz', desc: 'Connection' },
        { id: '741', label: '741 Hz', desc: 'Awakening Intuition' },
        { id: '852', label: '852 Hz', desc: 'Spiritual Order' },
    ] as const;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.settings.soundSanctuary}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className={styles.scrollContent}>

                    {/* Playback Control (Master) */}
                    <div className={styles.section}>
                        <button
                            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
                            onClick={togglePlay}
                        >
                            {isPlaying ? '⏸ PAUSE AUDIO' : '▶ START AUDIO'}
                        </button>
                    </div>

                    <div className={styles.section}>
                        <h3>Healing Frequencies</h3>
                        <div className={styles.gridOptions}>
                            {frequencies.map((f) => (
                                <button
                                    key={f.id}
                                    className={`${styles.gridBtn} ${frequency === f.id ? styles.active : ''}`}
                                    onClick={() => setFrequency(f.id as any)}
                                >
                                    <strong>{f.label}</strong>
                                    <span>{f.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Nature Mixer 🌿</h3>
                        <div className={styles.mixerStack}>
                            <button
                                className={`${styles.mixerBtn} ${layers.rain ? styles.activeLayer : ''}`}
                                onClick={() => toggleLayer('rain')}
                            >
                                🌧️ Rain
                            </button>
                            <button
                                className={`${styles.mixerBtn} ${layers.birds ? styles.activeLayer : ''}`}
                                onClick={() => toggleLayer('birds')}
                            >
                                🐦 Birds (Chirping)
                            </button>
                            <button
                                className={`${styles.mixerBtn} ${layers.waves ? styles.activeLayer : ''}`}
                                onClick={() => toggleLayer('waves')}
                            >
                                🌊 Ocean Waves
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Master Volume</h3>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
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
