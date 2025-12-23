/**
 * Crash 镲合成器
 * 宽频噪声 + 长衰减 + 音调变化，生成碎音镲声
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';
import { DRUM_DEFAULTS } from '../constants';

export class CrashSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    const actualDuration = duration || DRUM_DEFAULTS.crash.duration;
    
    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);
    
    // 力度影响
    const velocityFactor = this.applyVelocity(1.0, velocity);
    const initialFreq = 200 + (velocity / 127) * 300; // 力度越大起始频率越高
    
    // 生成宽频噪声
    const noise = this.generatePinkNoise(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = i / samples;
      
      // 长衰减包络
      const attack = Math.min(t / 0.01, 1.0); // 10ms attack
      const decay = Math.exp(-t * (2 + (velocity / 127) * 1)); // 长衰减
      const release = progress > 0.95 ? (1 - (progress - 0.95) / 0.05) : 1.0;
      const envelope = attack * decay * release * velocityFactor;
      
      // 1. 宽频噪声（全频段）- 主要音色
      data[i] += noise[i] * envelope * 0.8;
      
      // 2. 频率调制（音调下降）- 模拟镲的物理特性
      const freqMod = initialFreq * (1 - progress * 0.3); // 频率下降30%
      const phase = 2 * Math.PI * freqMod * t;
      data[i] += Math.sin(phase) * envelope * 0.2;
      
      // 3. 高频成分（8-12kHz）- 增加亮度
      const highFreq = 8000 + (velocity / 127) * 4000;
      const phaseHigh = 2 * Math.PI * highFreq * t;
      const highEnvelope = Math.exp(-t * 5);
      data[i] += Math.sin(phaseHigh) * highEnvelope * envelope * 0.15;
      
      // 4. 低频共鸣（100-200Hz）- 增加厚度
      const lowFreq = 150;
      const phaseLow = 2 * Math.PI * lowFreq * t;
      const lowEnvelope = Math.exp(-t * 1);
      data[i] += Math.sin(phaseLow) * lowEnvelope * envelope * 0.1;
    }
    
    this.applyFade(data, sampleRate, 0.005, 0.01);
    this.normalize(data);
    
    return data;
  }
}

