'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type FrequencyType = '528' | '432' | 'off';

interface AudioContextType {
    frequency: FrequencyType;
    setFrequency: (type: FrequencyType) => void;
    isNatureOn: boolean;
    toggleNature: () => void;
    isPlaying: boolean;
    togglePlay: () => void;
    playClickSound: () => void;
    volume: number;
    setVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [frequency, setFrequency] = useState<FrequencyType>('528');
    const [isNatureOn, setIsNatureOn] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);

    const audioCtxRef = useRef<AudioContext | null>(null);

    // Nodes for Frequency (Drone)
    const oscRef = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);

    // Nodes for Nature (Rain/Chirps)
    const natureGainRef = useRef<GainNode | null>(null);
    const rainNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const nextChirpTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    const initAudioContext = () => {
        if (!audioCtxRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    };

    // --- Signal Generators ---

    const createPinkNoise = (ctx: AudioContext) => {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Paul Kellett's refined method
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // compensate for gain
            b6 = white * 0.115926;
        }
        return buffer;
    };

    const playChirp = (ctx: AudioContext, targetOpt: GainNode) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;

        // Bird-like chirp: Sine wave sweeping down or up slightly
        osc.type = 'sine';
        // Random pitch between 2000 and 4000
        const startFreq = 2000 + Math.random() * 2000;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, t + 0.1);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1 * volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(targetOpt);

        osc.start(t);
        osc.stop(t + 0.2);
    };

    // --- Control Logic ---

    const stopAudio = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        // Fade out Drone
        if (droneGainRef.current) {
            try {
                droneGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
            } catch (e) { console.error(e); }
        }

        // Fade out Nature
        if (natureGainRef.current) {
            try {
                natureGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
            } catch (e) { console.error(e); }
        }

        // Cleanup after fade
        setTimeout(() => {
            if (oscRef.current) {
                oscRef.current.stop();
                oscRef.current.disconnect();
                oscRef.current = null;
            }
            if (rainNodeRef.current) {
                rainNodeRef.current.stop();
                rainNodeRef.current.disconnect();
                rainNodeRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }, 600);
    }, []);

    const startAudio = useCallback(() => {
        const ctx = initAudioContext();

        // --- 1. Base Frequency (Drone) ---
        if (frequency !== 'off') {
            // Stop existing if any (quick swap)
            if (oscRef.current) { oscRef.current.stop(); oscRef.current.disconnect(); }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const freqValue = frequency === '528' ? 528 : 432;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freqValue, ctx.currentTime);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(volume * 0.6, ctx.currentTime + 2); // Drone max 60% vol

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            oscRef.current = osc;
            droneGainRef.current = gain;
        }

        // --- 2. Nature Layer (Rain + Chirps) ---
        if (isNatureOn) {
            // Rain (Pink Noise)
            if (rainNodeRef.current) { rainNodeRef.current.stop(); rainNodeRef.current.disconnect(); }

            const rainSource = ctx.createBufferSource();
            rainSource.buffer = createPinkNoise(ctx);
            rainSource.loop = true;

            const rainGain = ctx.createGain();
            const rainFilter = ctx.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.value = 800; // Muffled rain sound

            rainGain.gain.setValueAtTime(0, ctx.currentTime);
            rainGain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 3); // Rain max 40% vol

            rainSource.connect(rainFilter);
            rainFilter.connect(rainGain);
            rainGain.connect(ctx.destination);
            rainSource.start();

            rainNodeRef.current = rainSource;
            natureGainRef.current = rainGain;

            // Chirps Loop
            const natureLoop = () => {
                if (!isPlaying || !isNatureOn) return;

                const now = ctx.currentTime;
                if (now >= nextChirpTimeRef.current) {
                    // Play a chirp
                    // Probability check to keep it sparse
                    if (Math.random() > 0.3) {
                        playChirp(ctx, rainGain); // Use rainGain as output route so it shares volume? Or separate? Better separate but simple logic: connect to rainGain for master vol.
                        // Actually playChirp creates its own path. Let's connect to destination but respect volume.
                        // Re-implement inside playChirp to use volume state.
                    }
                    // Schedule next chirp in 5-15 seconds
                    nextChirpTimeRef.current = now + 5 + Math.random() * 10;
                }
                animationFrameRef.current = requestAnimationFrame(natureLoop);
            };
            nextChirpTimeRef.current = ctx.currentTime + 2; // First chirp delay
            natureLoop();
        }

    }, [frequency, isNatureOn, volume, isPlaying]);

    // Volume Updates - Throttle/Safe update
    useEffect(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const now = ctx.currentTime;

        if (droneGainRef.current) {
            try {
                droneGainRef.current.gain.setTargetAtTime(frequency === 'off' ? 0 : volume * 0.6, now, 0.1);
            } catch (e) { }
        }

        if (natureGainRef.current) {
            try {
                natureGainRef.current.gain.setTargetAtTime(isNatureOn ? volume * 0.4 : 0, now, 0.1);
            } catch (e) { }
        }

    }, [volume, frequency, isNatureOn]);

    // Play/Pause Trigger
    useEffect(() => {
        if (isPlaying) {
            startAudio();
        } else {
            stopAudio();
        }
        return () => stopAudio();
    }, [isPlaying, startAudio, stopAudio]);

    // Re-trigger if settings change while playing (Hot swap)
    // Actually the volume effect above handles gain changes.
    // We only need full restart if adding/removing nodes (Frequency switch, Nature toggle) called for.
    useEffect(() => {
        if (isPlaying) {
            startAudio();
        }
    }, [frequency, isNatureOn]);


    const playClickSound = () => {
        const ctx = initAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

        gain.gain.setValueAtTime(0.5 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(t + 0.15);

        // Sub layer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, t);
        osc2.frequency.exponentialRampToValueAtTime(50, t + 0.2);
        gain2.gain.setValueAtTime(0.3 * volume, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.2); // Fix: use gain2 here

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(t + 0.25);
    };

    return (
        <AudioContext.Provider
            value={{
                frequency,
                setFrequency,
                isNatureOn,
                toggleNature: () => setIsNatureOn(prev => !prev),
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
