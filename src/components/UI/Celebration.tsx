'use client';

import React, { useEffect, useRef } from 'react';
import styles from './Celebration.module.css';
import { useUnlockedItems } from '@/context/UnlockedItemsContext';
import { useLanguage } from '@/context/LanguageContext';
import { REWARD_DATA } from '@/data/rewards';

export default function Celebration() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Confetti Engine
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#f1c40f', '#e74c3c', '#3498db', '#9b59b6', '#2ecc71', '#e67e22'];

        // Create particles
        const createParticle = () => {
            const x = Math.random() * canvas.width;
            const y = -20;
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const speedY = Math.random() * 3 + 2;
            const speedX = Math.random() * 4 - 2;
            const rotation = Math.random() * 360;
            const rotationSpeed = Math.random() * 10 - 5;

            particles.push({ x, y, size, color, speedY, speedX, rotation, rotationSpeed });
        };

        let frameId: number;

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Spawn new particles occasionally
            if (particles.length < 150) {
                createParticle();
            }

            // Update & Draw
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();

                // Remove if off screen
                if (p.y > canvas.height + 20) {
                    particles.splice(i, 1);
                    i--;
                }
            }

            frameId = requestAnimationFrame(loop);
        };

        loop();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const { unlockItem } = useUnlockedItems();
    const { t, language } = useLanguage();
    const [hasOpened, setHasOpened] = React.useState(false);
    const [reward, setReward] = React.useState<any | null>(null);
    const [showRewardModal, setShowRewardModal] = React.useState(false);

    const handleBoxClick = () => {
        if (hasOpened) return;

        // Unlock a random item
        const newItem = unlockItem();

        setReward(newItem);
        setHasOpened(true);
        setShowRewardModal(true);
    };

    // Auto-open after delay if user doesn't click
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!hasOpened) {
                handleBoxClick();
            }
        }, 1500); // 1.5 seconds
        return () => clearTimeout(timer);
    }, [hasOpened]);

    // Resolve localized reward data
    const rewardData = reward ? REWARD_DATA.find(r => r.id === reward.id) : null;

    return (
        <div className={styles.overlay}>
            <canvas ref={canvasRef} className={styles.canvas} />
            <div className={styles.catContainer}>
                <div className={styles.cat}>🐱</div>
                <div className={styles.cat}>😸</div>
                <div className={styles.cat}>😻</div>

                {/* Interactive Box */}
                <div
                    className={`${styles.box} ${hasOpened ? styles.opened : ''}`}
                    onClick={handleBoxClick}
                    style={{ cursor: hasOpened ? 'default' : 'pointer' }}
                >
                    {!hasOpened && <span style={{ position: 'absolute', bottom: '-40px', fontSize: '1rem', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 10px', borderRadius: '10px', whiteSpace: 'nowrap' }}>{t.rewards.tapToOpen}</span>}
                </div>
            </div>

            {/* Simple Reward Popup within Celebration */}
            {showRewardModal && rewardData && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.8)',
                    animation: 'fadeIn 0.3s ease-out',
                    pointerEvents: 'auto'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #2c3e50, #000000)',
                        padding: '40px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        border: '2px solid #f1c40f',
                        boxShadow: '0 0 50px rgba(241, 196, 15, 0.3)',
                        maxWidth: '90%',
                        width: '400px'
                    }}>
                        <h2 style={{ color: '#f1c40f', fontSize: '2rem', marginBottom: '10px' }}>🌟 {t.rewards.unlocked} 🌟</h2>
                        <div style={{ fontSize: '6rem', margin: '20px 0', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                            {reward.icon}
                        </div>
                        <h3 style={{ color: 'white', marginBottom: '30px' }}>{rewardData.name[language]}</h3>
                        <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '0.9rem' }}>{rewardData.category[language]}</p>
                        <button
                            onClick={() => setShowRewardModal(false)}
                            style={{
                                background: '#f1c40f',
                                color: '#000',
                                border: 'none',
                                padding: '12px 30px',
                                fontSize: '1.2rem',
                                borderRadius: '30px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                boxShadow: '0 5px 15px rgba(241, 196, 15, 0.4)'
                            }}
                        >
                            {t.rewards.awesome}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
