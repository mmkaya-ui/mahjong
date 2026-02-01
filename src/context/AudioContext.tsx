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

    // --- Control Logic ---

    // Stop a specific set of nodes (safe cleanup)
    const stopNodes = useCallback((
        osc: OscillatorNode | null,
        gain: GainNode | null,
        rain: AudioBufferSourceNode | null,
        natureGain: GainNode | null
    ) => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const now = ctx.currentTime;

        // Fade out
        try {
            if (gain) gain.gain.setTargetAtTime(0, now, 0.2);
            if (natureGain) natureGain.gain.setTargetAtTime(0, now, 0.2);
        } catch (e) { /* ignore */ }

        // Stop after fade
        setTimeout(() => {
            try {
                if (osc) { osc.stop(); osc.disconnect(); }
                if (rain) { rain.stop(); rain.disconnect(); }
            } catch (e) { /* ignore already stopped */ }
        }, 300);
    }, []);

    const stopAudio = useCallback(() => {
        // Capture CURRENT nodes to stop them specifically
        // This prevents the 'timeout race condition' where we stop the *new* node
        const currentOsc = oscRef.current;
        const currentDroneGain = droneGainRef.current;
        const currentRain = rainNodeRef.current;
        const currentNatureGain = natureGainRef.current;

        // Clear refs immediately so new starts don't see them
        oscRef.current = null;
        droneGainRef.current = null;
        rainNodeRef.current = null;
        natureGainRef.current = null;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        stopNodes(currentOsc, currentDroneGain, currentRain, currentNatureGain);

    }, [stopNodes]);

    const startAudio = useCallback(() => {
        const ctx = initAudioContext();

        // Stop any existing before starting new (just in case)
        if (oscRef.current || rainNodeRef.current) {
            stopAudio();
        }

        const now = ctx.currentTime;

        // --- 1. Base Frequency (Drone) ---
        if (frequency !== 'off') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            const freqValue = frequency === '528' ? 528 : 432;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freqValue, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * 0.6, now + 1.5); // Smoother fade in

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            oscRef.current = osc;
            droneGainRef.current = gain;
        }

        // --- 2. Nature Layer (Rain + Chirps) ---
        if (isNatureOn) {
            // Rain (Pink Noise)
            const rainSource = ctx.createBufferSource();
            rainSource.buffer = createPinkNoise(ctx);
            rainSource.loop = true;

            const rainGain = ctx.createGain();
            const rainFilter = ctx.createBiquadFilter();
            rainFilter.type = 'lowpass';
            rainFilter.frequency.value = 600; // More muffled/distant rain

            rainGain.gain.setValueAtTime(0, now);
            rainGain.gain.linearRampToValueAtTime(volume * 0.35, now + 2);

            rainSource.connect(rainFilter);
            rainFilter.connect(rainGain);
            rainGain.connect(ctx.destination);
            rainSource.start();

            rainNodeRef.current = rainSource;
            natureGainRef.current = rainGain;

            // Chirps Loop
            const natureLoop = () => {
                if (!isPlaying || !isNatureOn) return;

                const t = ctx.currentTime;
                if (t >= nextChirpTimeRef.current) {
                    if (Math.random() > 0.4) {
                        // Play via Main Destination to avoid complex routing, 
                        // but scale volume manually.
                        // Ideally we'd have a master gain, but this is fine.
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();

                        // Softer chirp
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
                    nextChirpTimeRef.current = t + 8 + Math.random() * 12; // More sparse
                }
                animationFrameRef.current = requestAnimationFrame(natureLoop);
            };
            nextChirpTimeRef.current = now + 2;
            natureLoop();
        }

    }, [frequency, isNatureOn, volume, isPlaying, stopAudio]);

    // Volume Updates
    useEffect(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        const now = ctx.currentTime;

        if (droneGainRef.current) {
            droneGainRef.current.gain.setTargetAtTime(frequency === 'off' ? 0 : volume * 0.6, now, 0.1);
        }
        if (natureGainRef.current) {
            natureGainRef.current.gain.setTargetAtTime(isNatureOn ? volume * 0.35 : 0, now, 0.1);
        }
    }, [volume, frequency, isNatureOn]);

    // Trigger Restart on Change
    useEffect(() => {
        if (isPlaying) {
            // We only restart if specific structural changes happen.
            // But simpler to just restart for now to ensure clean state.
            stopAudio();
            startAudio();
        } else {
            stopAudio();
        }
        return () => stopAudio(); // Cleanup on unmount
    }, [isPlaying, frequency, isNatureOn /*, startAudio, stopAudio - stabilized */]);


    const playClickSound = () => {
        const ctx = initAudioContext();
        if (!ctx) return;

        const t = ctx.currentTime;

        // "Thock" sound synthesis
        // Low sine wave + filtered noise burst or short decay triangle

        // 1. Body (Sine/Triangle)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1); // Pitch drop

        // Low Pass to remove harshness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t); // Heavy filter

        gain.gain.setValueAtTime(0.8 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(t + 0.15);

        // 2. Click (High tick) - subtle
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2000, t);
        osc2.frequency.exponentialRampToValueAtTime(1000, t + 0.02);

        gain2.gain.setValueAtTime(0.1 * volume, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.02);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(t + 0.03);
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
