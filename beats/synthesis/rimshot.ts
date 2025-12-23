/**
 * Rim Shot 合成器
 * 短促有力的边击声
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';
import { DRUM_DEFAULTS } from '../constants';

export class RimShotSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    const fundamental = params.fundamental ?? DRUM_DEFAULTS.rimshot.fundamental;
    const actualDuration = duration || DRUM_DEFAULTS.rimshot.duration;
    
    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);
    
    // 力度影响
    const velocityFactor = this.applyVelocity(1.0, velocity);
    
    // 生成噪声
    const noise = this.generateWhiteNoise(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // 极快的衰减
      const attack = Math.min(t / 0.0005, 1.0); // 0.5ms 极快attack
      const decay = Math.exp(-t * (50 + (velocity / 127) * 30)); // 极快衰减
      const envelope = attack * decay * velocityFactor;
      
      // 1. 短促的噪声脉冲
      if (t < 0.01) {
        const noiseEnvelope = Math.exp(-t * 150);
        data[i] += noise[i] * noiseEnvelope * envelope * 0.4;
      }
      
      // 2. 调谐频率（300Hz）- 短促有力
      const phase1 = 2 * Math.PI * fundamental * t;
      data[i] += Math.sin(phase1) * envelope * 1.0;
      
      // 3. 二次泛音
      const phase2 = 2 * Math.PI * (fundamental * 2) * t;
      data[i] += Math.sin(phase2) * envelope * 0.5;
      
      // 4. 高频click
      if (t < 0.005) {
        const clickFreq = 4000;
        const phaseClick = 2 * Math.PI * clickFreq * t;
        data[i] += Math.sin(phaseClick) * envelope * 0.3;
      }
    }
    
    this.applyFade(data, sampleRate, 0.0003, 0.0005);
    this.normalize(data);
    
    return data;
  }
}

