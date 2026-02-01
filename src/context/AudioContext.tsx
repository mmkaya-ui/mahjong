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
                if (Math.random() > 0.4) {
                    // Procedural Bird Chirp - Could move to Engine.playBird()
                    // Re-implementing simplified chirp here or exposing engine method?
                    // Let's implement playBird in engine for cleaner code.
                    // For now, inline to save complexity of adding to Engine just yet.

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const startFreq = 1500 + Math.random() * 1000;
                    osc.frequency.setValueAtTime(startFreq, t);
                    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.8, t + 0.15);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.08 * volume, t + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.35);
                }
                nextChirpTimeRef.current = t + 5 + Math.random() * 8;
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
