/**
 * 基础合成器类和工具函数
 */

import { DrumSynthesisParams } from '../types';
import { AUDIO_CONSTANTS } from '../constants';

/**
 * 基础合成器抽象类
 */
export abstract class BaseDrumSynthesizer {
  abstract synthesize(params: DrumSynthesisParams): Float32Array;
  
  /**
   * 生成 ADSR 包络
   */
  protected generateEnvelope(
    samples: number,
    sampleRate: number,
    attack: number = 0.002,
    decay: number = 0.05,
    sustain: number = 0.7,
    release: number = 0.1
  ): Float32Array {
    const envelope = new Float32Array(samples);
    const totalDuration = samples / sampleRate;
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = i / samples;
      
      if (t < attack) {
        // Attack 阶段
        envelope[i] = t / attack;
      } else if (t < attack + decay) {
        // Decay 阶段
        const decayProgress = (t - attack) / decay;
        envelope[i] = 1 - (1 - sustain) * decayProgress;
      } else if (t < totalDuration - release) {
        // Sustain 阶段
        envelope[i] = sustain;
      } else {
        // Release 阶段
        const releaseProgress = (t - (totalDuration - release)) / release;
        envelope[i] = sustain * (1 - releaseProgress);
      }
    }
    
    return envelope;
  }
  
  /**
   * 生成指数衰减包络
   */
  protected generateExponentialDecay(
    samples: number,
    sampleRate: number,
    decayRate: number
  ): Float32Array {
    const envelope = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      envelope[i] = Math.exp(-t * decayRate);
    }
    
    return envelope;
  }
  
  /**
   * 生成白噪声
   */
  protected generateWhiteNoise(samples: number): Float32Array {
    const noise = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      noise[i] = Math.random() * 2 - 1;
    }
    return noise;
  }
  
  /**
   * 生成粉噪声（更自然的噪声）
   */
  protected generatePinkNoise(samples: number): Float32Array {
    const noise = new Float32Array(samples);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < samples; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      noise[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      noise[i] *= 0.11;
      b6 = white * 0.115926;
    }
    
    return noise;
  }
  
  /**
   * 应用力度到音量
   */
  protected applyVelocity(volume: number, velocity: number): number {
    // 将 0-127 映射到 0.1-1.0
    const velocityFactor = 0.1 + (velocity / 127) * 0.9;
    return volume * velocityFactor;
  }
  
  /**
   * 归一化音频数据
   */
  protected normalize(data: Float32Array): void {
    let max = 0;
    const len = data.length;
    
    for (let i = 0; i < len; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    
    if (max > 1.0) {
      const scale = 1.0 / max;
      for (let i = 0; i < len; i++) {
        data[i] *= scale;
      }
    }
  }
  
  /**
   * 应用淡入淡出
   */
  protected applyFade(data: Float32Array, sampleRate: number, fadeIn: number = 0.0005, fadeOut: number = 0.001): void {
    const fadeInSamples = Math.min(Math.ceil(sampleRate * fadeIn), data.length);
    const fadeOutSamples = Math.min(Math.ceil(sampleRate * fadeOut), data.length);
    
    // 淡入
    for (let i = 0; i < fadeInSamples; i++) {
      data[i] *= i / fadeInSamples;
    }
    
    // 淡出
    for (let i = 0; i < fadeOutSamples; i++) {
      const idx = data.length - 1 - i;
      data[idx] *= i / fadeOutSamples;
    }
  }
}

/**
 * 获取或创建噪声缓冲区（单例模式）
 */
let noiseBuffer: AudioBuffer | null = null;

export function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer?.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  
  const bufferSize = Math.floor(ctx.sampleRate * AUDIO_CONSTANTS.NOISE_BUFFER_DURATION);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // 生成白噪声
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  noiseBuffer = buffer;
  return buffer;
}

