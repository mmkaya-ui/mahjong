import { AUDIO_CONSTANTS } from '@/config/constants';
import { createPinkNoise, createBrownNoise } from './generators';

type FrequencyKey = keyof typeof AUDIO_CONSTANTS.FREQUENCIES;

export class AudioEngine {
    private ctx: AudioContext | null = null;

    // Nodes
    private osc: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;

    private rainNodes: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
    private waveNodes: { source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null;

    // State
    private masterVolume: number = 0.5;
    private currentFreq: FrequencyKey | 'off' = 'off';

    constructor() {
        // Lazy init in start() to respect autoplay policies
    }

    private init() {
        if (!this.ctx) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    public get context() {
        return this.ctx;
    }

    public setVolume(vol: number) {
        this.masterVolume = vol;
        this.updateGains();
    }

    public setFrequency(freq: FrequencyKey | 'off') {
        this.currentFreq = freq;
        const ctx = this.init();
        const now = ctx.currentTime;

        if (freq === 'off') {
            if (this.droneGain) {
                this.droneGain.gain.setTargetAtTime(0, now, AUDIO_CONSTANTS.FADE_TIME);
                setTimeout(() => {
                    if (this.osc) { this.osc.stop(); this.osc.disconnect(); this.osc = null; }
                    if (this.droneGain) { this.droneGain.disconnect(); this.droneGain = null; }
                }, AUDIO_CONSTANTS.FADE_TIME * 1000 + 100);
            }
            return;
        }

        // Start Oscillator if not running
        if (!this.osc) {
            this.osc = ctx.createOscillator();
            this.droneGain = ctx.createGain();
            this.osc.type = 'sine';
            this.osc.connect(this.droneGain);
            this.droneGain.connect(ctx.destination);
            this.osc.start();
            this.droneGain.gain.setValueAtTime(0, now);
        }

        // Update Frequency
        const hz = AUDIO_CONSTANTS.FREQUENCIES[freq];
        if (this.osc) {
            this.osc.frequency.setValueAtTime(hz, now);
        }

        // Ensure volume is up
        this.updateGains();
    }

    public toggleRain(enable: boolean) {
        const ctx = this.init();
        const now = ctx.currentTime;

        if (enable) {
            if (this.rainNodes) return; // Already playing
            const src = ctx.createBufferSource();
            src.buffer = createPinkNoise(ctx);
            src.loop = true;
            const gain = ctx.createGain();
            // Filter pink noise for rain sound
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;

            src.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            gain.gain.setValueAtTime(0, now);
            src.start();

            this.rainNodes = { source: src, gain };
            this.updateGains();
        } else {
            if (this.rainNodes) {
                this.rainNodes.gain.gain.setTargetAtTime(0, now, AUDIO_CONSTANTS.FADE_TIME);
                setTimeout(() => {
                    this.rainNodes?.source.stop();
                    this.rainNodes?.source.disconnect();
                    this.rainNodes?.gain.disconnect();
                    this.rainNodes = null;
                }, 300);
            }
        }
    }

    public toggleWaves(enable: boolean) {
        const ctx = this.init();
        const now = ctx.currentTime;

        if (enable) {
            if (this.waveNodes) return;
            const src = ctx.createBufferSource();
            src.buffer = createBrownNoise(ctx);
            src.loop = true;

            const gain = ctx.createGain();
            const lfoGain = ctx.createGain();
            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = AUDIO_CONSTANTS.LFO_FREQ;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 350;

            src.connect(filter);
            filter.connect(lfoGain);
            lfoGain.connect(gain);
            gain.connect(ctx.destination);

            // Modulation
            lfoGain.gain.value = 0.6;
            const lfoAmp = ctx.createGain();
            lfoAmp.gain.value = 0.4;
            lfo.connect(lfoAmp);
            lfoAmp.connect(lfoGain.gain);

            src.start();
            lfo.start();
            gain.gain.setValueAtTime(0, now);

            this.waveNodes = { source: src, gain, lfo };
            this.updateGains();
        } else {
            if (this.waveNodes) {
                this.waveNodes.gain.gain.setTargetAtTime(0, now, AUDIO_CONSTANTS.FADE_TIME);
                setTimeout(() => {
                    this.waveNodes?.source.stop();
                    this.waveNodes?.lfo.stop();
                    this.waveNodes?.source.disconnect();
                    this.waveNodes?.gain.disconnect();
                    this.waveNodes = null;
                }, 300);
            }
        }
    }

    // Birds are procedural and stateless in loops, complex to move to class without internal loop
    // But we can expose a method to play a single chirp, or manage loop internally.
    // For now, let's keep birds simple or manage loop here?
    // Managing loop here is cleaner.

    public playClick() {
        const ctx = this.init();
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
        gain.gain.setValueAtTime(0.8 * this.masterVolume, t);
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
        gain2.gain.setValueAtTime(0.1 * this.masterVolume, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(t + 0.03);
    }

    public stopAll() {
        const ctx = this.ctx;
        if (!ctx) return;
        const now = ctx.currentTime;

        if (this.droneGain) this.droneGain.gain.setTargetAtTime(0, now, 0.1);
        if (this.rainNodes) this.rainNodes.gain.gain.setTargetAtTime(0, now, 0.1);
        if (this.waveNodes) this.waveNodes.gain.gain.setTargetAtTime(0, now, 0.1);

        setTimeout(() => {
            // Teardown
            this.setFrequency('off');
            this.toggleRain(false);
            this.toggleWaves(false);
        }, 200);
    }

    private updateGains() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (this.droneGain && this.currentFreq !== 'off') {
            this.droneGain.gain.setTargetAtTime(this.masterVolume * 0.6, now, 0.1);
        }
        if (this.rainNodes) {
            this.rainNodes.gain.gain.setTargetAtTime(this.masterVolume * 0.35, now, 0.1);
        }
        if (this.waveNodes) {
            this.waveNodes.gain.gain.setTargetAtTime(this.masterVolume * 0.5, now, 0.1);
        }
    }
}
