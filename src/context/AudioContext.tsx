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
                    // ORGANIC BIRD SYNTHESIS (FM)
                    // Carrier: Main pitch
                    // Modulator: Adds texture/timbre

                    const carrier = ctx.createOscillator();
                    const modulator = ctx.createOscillator();
                    const modGain = ctx.createGain();
                    const masterGain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();

                    // 1. Base Pitch (Natural Range: 1500Hz - 4000Hz)
                    const baseFreq = 1500 + Math.random() * 2500;

                    // 2. Variations (Simple vs Complex Chirp)
                    const isComplex = Math.random() > 0.6;
                    const duration = isComplex ? 0.15 + Math.random() * 0.15 : 0.08 + Math.random() * 0.05;

                    // Carrier Setup
                    carrier.type = 'sine';
                    carrier.frequency.setValueAtTime(baseFreq, t);

                    // Pitch Envelope (The "Chirp" slide)
                    // Slide down slightly or up-down for complex
                    if (isComplex) {
                        carrier.frequency.linearRampToValueAtTime(baseFreq + 500, t + duration * 0.3);
                        carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + duration);
                    } else {
                        carrier.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + duration);
                    }

                    // Modulator Setup (FM Ratio often 2:1 or non-integer for bell/nature sounds)
                    const ratio = 2 + Math.random(); // 2x to 3x ratio
                    modulator.type = 'sine';
                    modulator.frequency.value = baseFreq * ratio;

                    // Modulation Index Envelope (Timbre changes: Bright -> Pure)
                    // High modulation at attack (noisy beep), fading to pure sine
                    const modDepth = baseFreq * 0.5; // Depth of FM
                    modGain.gain.setValueAtTime(modDepth, t);
                    modGain.gain.exponentialRampToValueAtTime(10, t + duration); // Fadout modulation

                    // Filter (Soften edges)
                    filter.type = 'lowpass';
                    filter.frequency.value = 5000;

                    // Volume Envelope (Quick attack, smooth decay)
                    masterGain.gain.setValueAtTime(0, t);
                    masterGain.gain.linearRampToValueAtTime(0.15 * volume, t + 0.01); // Attack
                    masterGain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Decay

                    // Wiring
                    // Modulator -> ModGain -> Carrier.frequency
                    modulator.connect(modGain);
                    modGain.connect(carrier.frequency); // FM happens here

                    carrier.connect(filter);
                    filter.connect(masterGain);
                    masterGain.connect(ctx.destination);

                    // Start/Stop
                    carrier.start(t);
                    modulator.start(t);

                    const stopTime = t + duration + 0.1;
                    carrier.stop(stopTime);
                    modulator.stop(stopTime);

                    // Disconnect cleanup for GC
                    setTimeout(() => {
                        carrier.disconnect();
                        modulator.disconnect();
                        modGain.disconnect();
                        masterGain.disconnect();
                        filter.disconnect();
                    }, (duration + 0.5) * 1000);
                }

                // Natural Phrasing: Sometimes rapid fire, sometimes long pause
                const rapidFire = Math.random() > 0.7; // 30% chance of double chirp
                const nextInterval = rapidFire ? 0.15 + Math.random() * 0.3 : 2 + Math.random() * 5;

                nextChirpTimeRef.current = t + nextInterval;
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
