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
    this.preGenerateBuffers();
    this.initialized = true;
  }

  /**
   * 预生成所有音色的 AudioBuffer 缓存
   */
  private preGenerateBuffers(): void {
    if (!this.context) return;

    const ctx = this.context;
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
  }

  /**
   * 获取音频上下文
   */
  getContext(): AudioContext {
    if (!this.context) {
      throw new Error('AudioEngine not initialized. Call initialize() first.');
    }
    return this.context;
  }

  /**
   * 底鼓合成
   */
  private createKickBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.5;
    const frameCount = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    const startFreq = 150;
    const endFreq = 40;
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

  /**
   * 军鼓合成
   */
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

  /**
   * 踩镲合成
   */
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

  /**
   * 碎音合成
   */
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

  /**
   * 桶鼓合成
   */
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

  /**
   * 叮叮镲合成
   */
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

  /**
   * 播放鼓点
   */
  playDrum(type: DrumType, volume: number = 0.5, timeOffset: number = 0): void {
    if (!this.context || this.context.state !== 'running') return;

    const ctx = this.context;
    let buffer = this.bufferCache.get(type);

    if (!buffer) {
      // 容错处理：如果缓存中没有，现场生成（通常不应发生）
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
    }

    const now = ctx.currentTime + timeOffset;
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    // 长衰减音色（如Crash）可能需要超过1秒，这里统一设置长一点的停止时间
    source.stop(now + 2.0);
  }

  /**
   * 播放节拍步骤
   */
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
 * 以下导出用于向后兼容
 */
export function playDrumStepCached(ctx: AudioContext, step: number | DrumStep): void {
  const engine = getAudioEngine();
  engine.playDrumStep(step);
}

export function playDrumStep(step: DrumStep | number, timeOffset?: number): void {
  const engine = getAudioEngine();
  engine.playDrumStep(step, timeOffset || 0);
}
