'use client';

import React, { useEffect, useRef } from 'react';
import styles from './Celebration.module.css';

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

    return (
        <div className={styles.overlay}>
            <canvas ref={canvasRef} className={styles.canvas} />
            <div className={styles.catContainer}>
                <div className={styles.cat}>🐱</div>
                <div className={styles.cat}>😸</div>
                <div className={styles.cat}>😻</div>
                <div className={styles.box}></div>
            </div>
        </div>
    );
}
