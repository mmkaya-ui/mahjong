'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type SoundType = 'healing' | 'nature' | 'off';

interface AudioContextType {
    ambientType: SoundType;
    setAmbientType: (type: SoundType) => void;
    isPlaying: boolean;
    togglePlay: () => void;
    playClickSound: () => void;
    volume: number;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [ambientType, setAmbientType] = useState<SoundType>('off');
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    const initAudioContext = () => {
        if (!audioCtxRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const stopOscillator = useCallback(() => {
        if (oscillatorRef.current && audioCtxRef.current) {
            try {
                const ctx = audioCtxRef.current;
                // Fade out
                if (gainNodeRef.current) {
                    gainNodeRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
                }
                // Stop after fade
                setTimeout(() => {
                    oscillatorRef.current?.stop();
                    oscillatorRef.current?.disconnect();
                    oscillatorRef.current = null;
                }, 600);
            } catch (e) {
                console.error(e);
            }
        }
    }, []); // Stable

    const startOscillator = useCallback(() => {
        initAudioContext();
        stopOscillator(); // Stop existing

        if (ambientType === 'off' || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // 528Hz (Love) or 432Hz (Nature)
        const frequency = ambientType === 'healing' ? 528 : 432;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2); // Fade in

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
    }, [ambientType, volume, stopOscillator]);

    useEffect(() => {
        // Initialize AudioContext on user interaction/mount (lazily)
        // but actual start must be user triggered usually.
        return () => {
            stopOscillator();
            if (audioCtxRef.current) {
                audioCtxRef.current.close();
            }
        };
    }, [stopOscillator]);

    useEffect(() => {
        if (isPlaying) {
            startOscillator();
        } else {
            stopOscillator();
        }
    }, [isPlaying, ambientType, startOscillator, stopOscillator]);

    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current?.currentTime || 0, 0.1);
        }
    }, [volume]);

    const playClickSound = () => {
        // Wood-on-wood clack sound synthesis
        if (!audioCtxRef.current) initAudioContext();
        if (!audioCtxRef.current) return;

        const ctx = audioCtxRef.current;

        // Impact
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Wood-like
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

        gain.gain.setValueAtTime(0.5 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(t + 0.15);


        // Resonance (Deep wood)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, t);
        osc2.frequency.exponentialRampToValueAtTime(50, t + 0.2);

        gain2.gain.setValueAtTime(0.3 * volume, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start();
        osc2.stop(t + 0.25);
    };

    return (
        <AudioContext.Provider
            value={{
                ambientType,
                setAmbientType,
                isPlaying,
                togglePlay: () => setIsPlaying(!isPlaying),
                playClickSound,
                volume,
                setVolume
            }}
        >
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within a AudioProvider');
    }
    return context;
}
