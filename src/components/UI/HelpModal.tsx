'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './SoundSanctuary.module.css'; // Reusing modal styles

interface Props {
    onClose: () => void;
}

export default function HelpModal({ onClose }: Props) {
    const { t } = useLanguage();

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{t.help.title}</h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
                </div>

                <div className={styles.scrollContent}>
                    <div className={styles.section}>
                        <h3>{t.help.goal} 🎯</h3>
                        <p style={{ color: '#2c3e50', marginBottom: '8px' }}>{t.help.goalDesc}</p>
                    </div>

                    <div className={styles.section}>
                        <h3>{t.help.rules} 📜</h3>
                        <p style={{ color: '#2c3e50', marginBottom: '8px' }}>{t.help.rulesDesc}</p>
                    </div>

                    <div className={styles.section}>
                        <h3>{t.help.modes} 🎲</h3>
                        <p style={{ color: '#2c3e50', marginBottom: '8px' }}>{t.help.modesDesc}</p>
                    </div>

                    <div className={styles.section}>
                        <h3>{t.help.controls} 🎮</h3>
                        <p style={{ color: '#2c3e50', marginBottom: '8px' }}>{t.help.controlsDesc}</p>
                    </div>

                    <button
                        className={styles.playBtn}
                        onClick={onClose}
                        style={{ marginTop: '10px' }}
                    >
                        {t.help.close}
                    </button>
                </div>
            </div>
        </div>
    );
}
