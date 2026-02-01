'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type FrequencyType = '396' | '432' | '528' | '639' | '741' | '852' | 'off';

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

    const audioCtxRef = useRef<AudioContext | null>(null);

    // Nodes for Frequency (Drone)
    const oscRef = useRef<OscillatorNode | null>(null);
    const droneGainRef = useRef<GainNode | null>(null);

    // Nodes for Nature
    const rainRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);
    const wavesRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null>(null);

    // Birds Logic
    const nextChirpTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const birdsGainRef = useRef<GainNode | null>(null); // To control bird volume collectively

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
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
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
            data[i] *= 0.11;
            b6 = white * 0.115926;
        }
        return buffer;
    };

    const createBrownNoise = (ctx: AudioContext) => {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        return buffer;
    };

    // --- Control Logic ---

    const stopAudio = useCallback(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const now = ctx.currentTime;

        // Fade out all current nodes
        if (droneGainRef.current) droneGainRef.current.gain.setTargetAtTime(0, now, 0.2);
        if (rainRef.current) rainRef.current.gain.gain.setTargetAtTime(0, now, 0.2);
        if (wavesRef.current) wavesRef.current.gain.gain.setTargetAtTime(0, now, 0.2);

        // Stop Loop
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Cleanup Refs
        setTimeout(() => {
            if (oscRef.current) { oscRef.current.stop(); oscRef.current.disconnect(); oscRef.current = null; }
            if (droneGainRef.current) { droneGainRef.current.disconnect(); droneGainRef.current = null; }

            if (rainRef.current) {
                rainRef.current.source.stop();
                rainRef.current.source.disconnect();
                rainRef.current.gain.disconnect();
                rainRef.current = null;
            }
            if (wavesRef.current) {
                wavesRef.current.source.stop();
                wavesRef.current.source.disconnect();
                wavesRef.current.lfo.stop();
                wavesRef.current.lfo.disconnect();
                wavesRef.current.gain.disconnect();
                wavesRef.current = null;
            }
        }, 300);
    }, []);

    const startAudio = useCallback(() => {
        const ctx = initAudioContext();
        if (oscRef.current || rainRef.current || wavesRef.current) stopAudio();

        const now = ctx.currentTime;

        // 1. Frequency (Drone)
        if (frequency !== 'off') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const freqs: Record<string, number> = { '396': 396, '432': 432, '528': 528, '639': 639, '741': 741, '852': 852 };

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freqs[frequency] || 432, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * 0.6, now + 1.5);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            oscRef.current = osc;
            droneGainRef.current = gain;
        }

        // 2. Nature Layers

        // Rain
        if (layers.rain) {
            const src = ctx.createBufferSource();
            src.buffer = createPinkNoise(ctx);
            src.loop = true;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * 0.35, now + 2);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            src.start();
            rainRef.current = { source: src, gain };
        }

        // Waves (Brown Noise + LFO)
        if (layers.waves) {
            const src = ctx.createBufferSource();
            src.buffer = createBrownNoise(ctx);
            src.loop = true;

            const gain = ctx.createGain(); // Master wave volume
            const lfoGain = ctx.createGain(); // Modulated volume

            // LFO to simulate wave crashing (0.1Hz = 10s cycle)
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1;

            // Wave Filter to sound oceanic
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 350;

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume * 0.5, now + 2);

            // Connect: Source -> Filter -> LFOGain -> Gain -> Dest
            // LFO controls LFOGain.gain
            src.connect(filter);
            filter.connect(lfoGain);
            lfoGain.connect(gain);
            gain.connect(ctx.destination);

            // Modulate lfoGain with LFO (0 to 1 range approx)
            // LFO output is -1 to 1. We map to gain? 
            // Web Audio LFO connect directly to param adds value.
            // Set base gain 0.5, LFO amp 0.5 -> 0 to 1?
            lfoGain.gain.value = 0.6;
            const lfoAmp = ctx.createGain();
            lfoAmp.gain.value = 0.4;
            lfo.connect(lfoAmp);
            lfoAmp.connect(lfoGain.gain);

            src.start();
            lfo.start();

            wavesRef.current = { source: src, gain, lfo };
        }

        // Birds Loop (Procedural)
        if (layers.birds) {
            const birdsLoop = () => {
                if (!isPlaying || !layers.birds) return;
                const t = ctx.currentTime;
                if (t >= nextChirpTimeRef.current) {
                    if (Math.random() > 0.4) {
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
            nextChirpTimeRef.current = now + 1;
            birdsLoop();
        }

    }, [frequency, layers, volume, isPlaying, stopAudio]);

    // Volume Updates
    useEffect(() => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        const now = ctx.currentTime;

        if (droneGainRef.current) {
            droneGainRef.current.gain.setTargetAtTime(frequency === 'off' ? 0 : volume * 0.6, now, 0.1);
        }
        if (rainRef.current) {
            rainRef.current.gain.gain.setTargetAtTime(layers.rain ? volume * 0.35 : 0, now, 0.1);
        }
        if (wavesRef.current) {
            wavesRef.current.gain.gain.setTargetAtTime(layers.waves ? volume * 0.5 : 0, now, 0.1);
        }
    }, [volume, frequency, layers]);

    // Restart on significant change
    useEffect(() => {
        if (isPlaying) {
            stopAudio();
            startAudio();
        } else {
            stopAudio();
        }
        return () => stopAudio();
    }, [isPlaying, frequency, layers /* start/stop stable */]);


    const playClickSound = () => {
        const ctx = initAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        // Thock
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        gain.gain.setValueAtTime(0.8 * volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(t + 0.15);

        // Click
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
