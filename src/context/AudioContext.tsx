'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '@/core/audio/AudioEngine';
import { AUDIO_CONSTANTS } from '@/config/constants';

type FrequencyType = keyof typeof AUDIO_CONSTANTS.FREQUENCIES | 'off';

interface AudioLayers {
    rain: boolean;
    birds: boolean;
    waves: boolean;
}

interface AudioContextType {
    frequency: FrequencyType;
    setFrequency: (type: FrequencyType) => void;
    layers: AudioLayers;
    toggleLayer: (layer: keyof AudioLayers) => void;
    isPlaying: boolean;
    togglePlay: () => void;
    playClickSound: () => void;
    volume: number;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [frequency, setFrequency] = useState<FrequencyType>('528');
    const [layers, setLayers] = useState<AudioLayers>({ rain: false, birds: false, waves: false });
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);

    // Singleton Ref
    const engineRef = useRef<AudioEngine | null>(null);

    // Birds Logic (React Side Loop)
    const nextChirpTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        engineRef.current = new AudioEngine();
        return () => {
            engineRef.current?.stopAll();
        };
    }, []);

    const updateEngine = useCallback(() => {
        const engine = engineRef.current;
        if (!engine) return;

        if (!isPlaying) {
            engine.stopAll();
            // Also stop birds
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        engine.setVolume(volume);
        engine.setFrequency(frequency);
        engine.toggleRain(layers.rain);
        engine.toggleWaves(layers.waves);

    }, [isPlaying, frequency, layers, volume]);

    // Birds Loop
    useEffect(() => {
        if (!isPlaying || !layers.birds) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            return;
        }

        const birdsLoop = () => {
            if (!engineRef.current || !engineRef.current.context) return;
            const ctx = engineRef.current.context;
            const t = ctx.currentTime;

            if (t >= nextChirpTimeRef.current) {
                // Higher chance to chirp (80%)
                if (Math.random() > 0.2) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle'; // Variation

                    // Higher pitch range for more "bird-like" sound
                    const startFreq = 2000 + Math.random() * 1500;
                    osc.frequency.setValueAtTime(startFreq, t);

                    // Complex envelope for "Chirp-chirp" effect sometimes
                    if (Math.random() > 0.7) {
                        // Double chirp
                        osc.frequency.linearRampToValueAtTime(startFreq + 500, t + 0.1);
                        osc.frequency.linearRampToValueAtTime(startFreq, t + 0.2);
                    } else {
                        // Single slide
                        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, t + 0.15);
                    }

                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.1 * volume, t + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.3);
                }
                // Much shorter interval: 2 to 6 seconds
                nextChirpTimeRef.current = t + 2 + Math.random() * 4;
            }
            animationFrameRef.current = requestAnimationFrame(birdsLoop);
        };

        // Start loop
        const ctx = engineRef.current?.context;
        if (ctx) {
            nextChirpTimeRef.current = ctx.currentTime + 1;
            birdsLoop();
        }

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, layers.birds, volume]);


    useEffect(() => {
        updateEngine();
    }, [updateEngine]);


    const playClickSound = () => {
        engineRef.current?.playClick();
    };

    return (
        <AudioContext.Provider
            value={{
                frequency,
                setFrequency,
                layers,
                toggleLayer: (l) => setLayers(prev => ({ ...prev, [l]: !prev[l] })),
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
