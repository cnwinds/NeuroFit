/**
 * Open Hi-Hat 合成器
 * 比普通 Hi-Hat 更长的衰减，持续音色
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';
import { DRUM_DEFAULTS } from '../constants';

export class OpenHiHatSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    const fundamental = params.fundamental ?? DRUM_DEFAULTS.openHihat.fundamental;
    const actualDuration = duration || DRUM_DEFAULTS.openHihat.duration;
    
    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);
    
    // 力度影响
    const velocityFactor = this.applyVelocity(1.0, velocity);
    const brightness = 0.5 + (velocity / 127) * 0.5;
    
    // 生成宽频噪声
    const noise = this.generatePinkNoise(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // 较慢的衰减（比普通 Hi-Hat 慢）
      const attack = Math.min(t / 0.002, 1.0); // 2ms attack
      const decay = Math.exp(-t * (20 + (velocity / 127) * 15)); // 比 Hi-Hat 慢
      const envelope = attack * decay * velocityFactor;
      
      // 1. 宽频噪声 - 主要音色
      const noiseSample = noise[i];
      const highFreqComponent = noiseSample * brightness;
      data[i] += highFreqComponent * envelope * 0.7;
      
      // 2. 基频（A4: 440Hz）
      const phase1 = 2 * Math.PI * fundamental * t;
      data[i] += Math.sin(phase1) * envelope * 0.4;
      
      // 3. 低频泛音
      const phaseLow = 2 * Math.PI * (fundamental * 0.5) * t;
      data[i] += Math.sin(phaseLow) * envelope * 0.3;
      
      // 4. 高频泛音
      const phase2 = 2 * Math.PI * (fundamental * 2) * t;
      data[i] += Math.sin(phase2) * envelope * 0.2 * brightness;
    }
    
    this.applyFade(data, sampleRate, 0.001, 0.002);
    this.normalize(data);
    
    return data;
  }
}

