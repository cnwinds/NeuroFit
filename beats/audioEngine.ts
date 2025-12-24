/**
 * Web Audio API 音频引擎
 * 提供通过 AudioBuffer 缓存的高效鼓点合成与播放
 */

import type { DrumType, DrumStep } from './types';

/**
 * 音频引擎类
 */
class AudioEngine {
  private context: AudioContext | null = null;
  private initialized = false;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  /**
   * 初始化音频上下文并预生成缓存
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.context) {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass({
      sampleRate: 44100,
      latencyHint: 'interactive'
    });

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    // 预生成所有标准音色的 AudioBuffer
    await this.preGenerateBuffers();
    this.initialized = true;
  }

  /**
   * 预生成所有音色的 AudioBuffer 缓存
   */
  private async preGenerateBuffers(): Promise<void> {
    if (!this.context) return;

    const ctx = this.context;

    // 1. 鼓点音色
    const drumTypes: DrumType[] = ['kick', 'snare', 'hihat', 'openHihat', 'crash', 'tom', 'ride'];
    drumTypes.forEach(type => {
      let buffer: AudioBuffer;
      switch (type) {
        case 'kick': buffer = this.createKickBuffer(ctx); break;
        case 'snare': buffer = this.createSnareBuffer(ctx); break;
        case 'hihat': buffer = this.createHiHatBuffer(ctx, 20); break;
        case 'openHihat': buffer = this.createHiHatBuffer(ctx, 5); break;
        case 'crash': buffer = this.createCrashBuffer(ctx); break;
        case 'tom': buffer = this.createTomBuffer(ctx); break;
        case 'ride': buffer = this.createRideBuffer(ctx); break;
        default: return;
      }
      this.bufferCache.set(type, buffer);
    });

    // 2. 反馈音效
    const feedbackSounds = ['excellent', 'good', 'bad', 'miss', 'beep_low', 'beep_high'];
    for (const action of feedbackSounds) {
      const offlineCtx = new OfflineAudioContext(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      switch (action) {
        case 'excellent': this.renderExcellent(offlineCtx); break;
        case 'good': this.renderGood(offlineCtx); break;
        case 'bad': this.renderBad(offlineCtx); break;
        case 'miss': this.renderMiss(offlineCtx); break;
        case 'beep_low': this.renderTone(offlineCtx, 440, 0.1, 'square'); break;
        case 'beep_high': this.renderTone(offlineCtx, 880, 0.1, 'square'); break;
      }
      const buffer = await offlineCtx.startRendering();
      this.bufferCache.set(action, buffer);
    }
  }

  /**
   * 获取音频上下文
   */
  getContext(): AudioContext {
    if (!this.context) {
      // Lazy init if possible (for backward compatibility if not called)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass({ sampleRate: 44100 });
    }
    return this.context;
  }

  // --- 鼓点合成算法 ---

  private createKickBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.5;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const startFreq = 150, endFreq = 40;
    let phase = 0;
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const currentFreq = startFreq * Math.exp(-t * 20) + endFreq;
      const envelope = Math.exp(-t * 8);
      const attack = t < 0.002 ? t / 0.002 : 1.0;
      phase += 2 * Math.PI * currentFreq / ctx.sampleRate;
      data[i] = Math.sin(phase) * envelope * attack;
    }
    return buffer;
  }

  private createSnareBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.15;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 15);
      const noise = (Math.random() * 2 - 1) * envelope;
      const lowFreq = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 10);
      data[i] = (noise * 0.7 + lowFreq * 0.3);
    }
    return buffer;
  }

  private createHiHatBuffer(ctx: AudioContext, decay: number): AudioBuffer {
    const duration = 6.0 / decay;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * decay);
      const noise = (Math.random() * 2 - 1) * envelope;
      const highFreq = Math.sin(2 * Math.PI * 9000 * t) * Math.exp(-t * decay * 1.5);
      data[i] = (noise * 0.8 + highFreq * 0.2);
    }
    return buffer;
  }

  private createCrashBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.5;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 3);
      const noise = (Math.random() * 2 - 1) * envelope;
      const freq1 = Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t * 5);
      const freq2 = Math.sin(2 * Math.PI * 12000 * t) * Math.exp(-t * 8);
      data[i] = (noise * 0.6 + freq1 * 0.2 + freq2 * 0.2);
    }
    return buffer;
  }

  private createTomBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.25;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const freq = 150;
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 6);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }
    return buffer;
  }

  private createRideBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.4;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.exp(-t * 4);
      const noise = (Math.random() * 2 - 1) * envelope;
      const freq = Math.sin(2 * Math.PI * 5000 * t) * Math.exp(-t * 6);
      data[i] = (noise * 0.5 + freq * 0.5);
    }
    return buffer;
  }

  // --- 反馈音渲染 ---

  private renderTone(ctx: OfflineAudioContext, freq: number, duration: number, type: OscillatorType): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, 0);
    gain.gain.setValueAtTime(0.1, 0);
    gain.gain.exponentialRampToValueAtTime(0.001, duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(duration);
  }

  private renderExcellent(ctx: OfflineAudioContext): void {
    const frequencies = [659.25, 783.99, 987.77, 1318.51];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const start = i * 0.03;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  }

  private renderGood(ctx: OfflineAudioContext): void {
    const frequencies = [523.25, 659.25, 783.99];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = i * 0.04;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  private renderBad(ctx: OfflineAudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, 0);
    osc.frequency.exponentialRampToValueAtTime(180, 0.2);
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.08, 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.35);
  }

  private renderMiss(ctx: OfflineAudioContext): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(110, 0);
    osc.frequency.exponentialRampToValueAtTime(80, 0.15);
    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.06, 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(0.3);
  }

  // --- 播放接口 ---

  playFeedback(name: 'excellent' | 'good' | 'bad' | 'miss' | 'beep_low' | 'beep_high'): void {
    if (!this.context || this.context.state !== 'running') return;
    const buffer = this.bufferCache.get(name);
    if (buffer) {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start();
    }
  }

  playExcellent(): void { this.playFeedback('excellent'); }
  playGood(): void { this.playFeedback('good'); }
  playBad(): void { this.playFeedback('bad'); }
  playMiss(): void { this.playFeedback('miss'); }
  playCountdown(isFinal: boolean = false): void { this.playFeedback(isFinal ? 'beep_high' : 'beep_low'); }

  playDrum(type: DrumType, volume: number = 0.5, timeOffset: number = 0): void {
    if (!this.context || this.context.state !== 'running') return;
    const buffer = this.bufferCache.get(type);
    if (!buffer) return;
    const now = this.context.currentTime + timeOffset;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start(now);
    source.stop(now + 2.0);
  }

  playDrumStep(step: DrumStep | number, timeOffset: number = 0): void {
    if (typeof step === 'number') {
      const typeMap: DrumType[] = ['kick', 'hihat', 'snare', 'hihat'];
      const type = typeMap[step % typeMap.length] || 'kick';
      this.playDrum(type, 0.5, timeOffset);
    } else {
      this.playDrum(step.type, step.volume, (step.timeOffset || 0) + timeOffset);
    }
  }
}

// 单例模式
let engineInstance: AudioEngine | null = null;
export function getAudioEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}

/**
 * 向后兼容
 */
export function playDrumStep(step: DrumStep | number, timeOffset?: number): void {
  getAudioEngine().playDrumStep(step, timeOffset || 0);
}

export function playDrumStepCached(ctx: AudioContext, step: number | DrumStep): void {
  getAudioEngine().playDrumStep(step);
}
