/**
 * Hi-Hat 合成器
 * 高频噪声 + 快速衰减，生成清脆的踩镲声
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';
import { DRUM_DEFAULTS } from '../constants';

export class HiHatSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    const fundamental = params.fundamental ?? DRUM_DEFAULTS.hihat.fundamental;
    const actualDuration = duration || DRUM_DEFAULTS.hihat.duration;
    
    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);
    
    // 力度影响
    const velocityFactor = this.applyVelocity(1.0, velocity);
    const brightness = 0.5 + (velocity / 127) * 0.5; // 力度越大越明亮
    
    // 生成宽频噪声
    const noise = this.generatePinkNoise(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      
      // 快速指数衰减
      const attack = Math.min(t / 0.001, 1.0); // 1ms attack
      const decay = Math.exp(-t * (45 + (velocity / 127) * 30)); // 力度越大衰减越快
      const envelope = attack * decay * velocityFactor;
      
      // 1. 宽频噪声（5-15kHz）- 主要音色
      // 使用高频滤波效果（通过噪声的快速变化模拟）
      const noiseSample = noise[i];
      const highFreqComponent = noiseSample * brightness;
      data[i] += highFreqComponent * envelope * 0.6;
      
      // 2. 基频（A4: 440Hz）- 温暖主音
      const phase1 = 2 * Math.PI * fundamental * t;
      data[i] += Math.sin(phase1) * envelope * 0.35;
      
      // 3. 低频泛音（A3: 220Hz）- 增加厚度
      const phaseLow = 2 * Math.PI * (fundamental * 0.5) * t;
      data[i] += Math.sin(phaseLow) * envelope * 0.25;
      
      // 4. 二次泛音（A5: 880Hz）- 轻微明亮感
      const phase2 = 2 * Math.PI * (fundamental * 2) * t;
      data[i] += Math.sin(phase2) * envelope * 0.15 * brightness;
      
      // 5. 轻微的音调调制（增加动态感）
      const modFreq = 5 + (velocity / 127) * 10;
      const modPhase = 2 * Math.PI * modFreq * t;
      const modulation = 1 + Math.sin(modPhase) * 0.1;
      data[i] *= modulation;
    }
    
    this.applyFade(data, sampleRate, 0.0005, 0.001);
    this.normalize(data);
    
    return data;
  }
}

