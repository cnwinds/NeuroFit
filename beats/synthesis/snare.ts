/**
 * Snare 鼓合成器
 * 结合白噪声和调谐共振，生成清脆有力的军鼓声
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';
import { DRUM_DEFAULTS } from '../constants';

export class SnareSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    const fundamental = params.fundamental ?? DRUM_DEFAULTS.snare.fundamental;
    const actualDuration = duration || DRUM_DEFAULTS.snare.duration;
    
    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);
    
    // 力度影响
    const velocityFactor = this.applyVelocity(1.0, velocity);
    const noiseLevel = 0.3 + (velocity / 127) * 0.4; // 力度越大，噪声越多
    
    // 生成噪声层
    const noise = this.generateWhiteNoise(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = i / samples;
      
      // 快速衰减包络
      const attack = Math.min(t / 0.0015, 1.0); // 1.5ms attack
      const decay = Math.exp(-t * (15 + (velocity / 127) * 10)); // 力度越大衰减越快
      const release = progress > 0.9 ? (1 - (progress - 0.9) / 0.1) : 1.0;
      const envelope = attack * decay * release * velocityFactor;
      
      // 1. 白噪声层 - 快速衰减（前10ms）
      if (t < 0.01) {
        const noiseEnvelope = Math.exp(-t * 100);
        data[i] += noise[i] * noiseEnvelope * noiseLevel * envelope;
      }
      
      // 2. 调谐共振（200-300Hz）- 主要音色
      const phase1 = 2 * Math.PI * fundamental * t;
      data[i] += Math.sin(phase1) * envelope * 1.2;
      
      // 3. 二次泛音（400-600Hz）
      const phase2 = 2 * Math.PI * (fundamental * 2) * t;
      data[i] += Math.sin(phase2) * envelope * 0.6;
      
      // 4. 三次泛音（600-900Hz）
      const phase3 = 2 * Math.PI * (fundamental * 3) * t;
      data[i] += Math.sin(phase3) * envelope * 0.3;
      
      // 5. 金属感高频噪声（3-5kHz）- 短脉冲
      if (t < 0.008) {
        const metalFreq = 3000 + (velocity / 127) * 2000;
        const phaseMetal = 2 * Math.PI * metalFreq * t;
        const metalEnvelope = Math.exp(-t * 200);
        data[i] += Math.sin(phaseMetal) * metalEnvelope * envelope * 0.2;
      }
      
      // 6. 低频共鸣（100Hz）
      const phaseLow = 2 * Math.PI * 100 * t;
      data[i] += Math.sin(phaseLow) * envelope * 0.3 * Math.exp(-t * 20);
    }
    
    this.applyFade(data, sampleRate);
    this.normalize(data);
    
    return data;
  }
}

