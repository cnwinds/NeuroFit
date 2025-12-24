/**
 * Web Audio API 音频引擎
 * 提供实时合成各种鼓点音色
 */

import type { DrumType, DrumStep } from './types';

/**
 * 音频引擎单例
 */
class AudioEngine {
  private context: AudioContext | null = null;
  private initialized = false;

  /**
   * 初始化音频上下文
   */
  async initialize(): Promise<void> {
    if (this.initialized && this.context) {
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass({
      sampleRate: 44100,
      latencyHint: 'interactive'
    });

    // 如果上下文被暂停，尝试恢复
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.initialized = true;
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
   * 生成 Kick（底鼓）音色
   * 标准 Sine Sweep：150Hz -> 40Hz
   */
  private generateKick(ctx: AudioContext, volume: number = 0.5): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 0.5;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 标准频率扫描
    const startFreq = 150;
    const endFreq = 40;

    let phase = 0;

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;

      // 频率包络：快速衰减
      const currentFreq = startFreq * Math.exp(-t * 20) + endFreq;

      // 振幅包络
      const envelope = Math.exp(-t * 8);

      // 简单防点击攻击包络 (前2ms)
      const attack = t < 0.002 ? t / 0.002 : 1.0;

      phase += 2 * Math.PI * currentFreq / sampleRate;

      data[i] = Math.sin(phase) * envelope * attack * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 生成 Snare（军鼓）音色
   */
  private generateSnare(ctx: AudioContext, volume: number = 0.5): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 0.15; // 150ms
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 白噪声 + 包络
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 15); // 快速衰减
      const noise = (Math.random() * 2 - 1) * envelope;

      // 添加一些低频成分
      const lowFreq = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 10);
      data[i] = (noise * 0.7 + lowFreq * 0.3) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 生成 HiHat（踩镲）音色
   */
  private generateHiHat(ctx: AudioContext, volume: number = 0.3, decay: number = 20): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 6.0 / decay;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 高频噪声 + 衰减
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * decay);
      const noise = (Math.random() * 2 - 1) * envelope;

      // 添加高频成分
      const highFreq = Math.sin(2 * Math.PI * 9000 * t) * Math.exp(-t * decay * 1.5);
      data[i] = (noise * 0.8 + highFreq * 0.2) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 生成 Crash（碎音）音色
   */
  private generateCrash(ctx: AudioContext, volume: number = 0.4): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 0.5; // 500ms
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 高频噪声 + 长衰减
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 3); // 慢衰减
      const noise = (Math.random() * 2 - 1) * envelope;

      // 添加多个频率成分
      const freq1 = Math.sin(2 * Math.PI * 8000 * t) * Math.exp(-t * 5);
      const freq2 = Math.sin(2 * Math.PI * 12000 * t) * Math.exp(-t * 8);
      data[i] = (noise * 0.6 + freq1 * 0.2 + freq2 * 0.2) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 生成 Tom（桶鼓）音色
   */
  private generateTom(ctx: AudioContext, volume: number = 0.4): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 0.25; // 250ms
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 中频正弦波 + 衰减
    const freq = 150; // 150Hz
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 6);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 生成 Ride（叮叮镲）音色
   */
  private generateRide(ctx: AudioContext, volume: number = 0.3): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const duration = 0.4; // 400ms
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // 中高频噪声 + 中等衰减
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 4);
      const noise = (Math.random() * 2 - 1) * envelope;

      const freq = Math.sin(2 * Math.PI * 5000 * t) * Math.exp(-t * 6);
      data[i] = (noise * 0.5 + freq * 0.5) * volume;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  /**
   * 播放指定类型的鼓点
   */
  playDrum(type: DrumType, volume: number = 0.5, timeOffset: number = 0): void {
    if (!this.context || this.context.state !== 'running') {
      return;
    }

    const ctx = this.context;
    const now = ctx.currentTime + timeOffset;

    let source: AudioBufferSourceNode;

    switch (type) {
      case 'kick':
        source = this.generateKick(ctx, volume);
        break;
      case 'snare':
        source = this.generateSnare(ctx, volume);
        break;
      case 'hihat':
        // 标准 Closed HiHat (Pedal)
        source = this.generateHiHat(ctx, volume, 20);
        break;
      case 'openHihat':
        // Open HiHat
        source = this.generateHiHat(ctx, volume, 5);
        break;
      case 'crash':
        source = this.generateCrash(ctx, volume);
        break;
      case 'tom':
        source = this.generateTom(ctx, volume);
        break;
      case 'ride':
        source = this.generateRide(ctx, volume);
        break;
      default:
        return;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    source.stop(now + 1); // 确保在1秒后停止
  }

  /**
   * 播放节拍步骤（支持 DrumStep 对象）
   */
  playDrumStep(step: DrumStep | number, timeOffset: number = 0): void {
    if (typeof step === 'number') {
      // 向后兼容：将数字映射到音色类型
      const typeMap: DrumType[] = ['kick', 'hihat', 'snare', 'hihat'];
      const type = typeMap[step % typeMap.length] || 'kick';
      this.playDrum(type, 0.5, timeOffset);
    } else {
      this.playDrum(step.type, step.volume, (step.timeOffset || 0) + timeOffset);
    }
  }
}

// 单例实例
let engineInstance: AudioEngine | null = null;

/**
 * 获取音频引擎单例
 */
export function getAudioEngine(): AudioEngine {
  if (!engineInstance) {
    engineInstance = new AudioEngine();
  }
  return engineInstance;
}

/**
 * 播放鼓点步骤（缓存版本，用于向后兼容）
 */
export function playDrumStepCached(ctx: AudioContext, step: number | DrumStep): void {
  const engine = getAudioEngine();
  if (engine.getContext() !== ctx) {
    // 如果上下文不同，重新初始化（虽然通常不会发生）
    engine.initialize();
  }
  engine.playDrumStep(step);
}

/**
 * 播放鼓点步骤（直接版本）
 */
export function playDrumStep(step: DrumStep | number, timeOffset?: number): void {
  const engine = getAudioEngine();
  engine.playDrumStep(step, timeOffset);
}

