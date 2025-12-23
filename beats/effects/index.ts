/**
 * 效果链统一接口
 */

import { EffectChainConfig } from '../types';
import { applyCompressor } from './compressor';
import { applyEqualizer } from './equalizer';
import { applyReverb } from './reverb';
import { applyTransient } from './transient';

/**
 * 应用完整的效果链到音频数据
 */
export function applyEffectChain(
  data: Float32Array,
  sampleRate: number,
  config: EffectChainConfig
): void {
  // 按顺序应用效果
  // 1. 压缩器
  if (config.compressor?.enabled) {
    applyCompressor(data, config.compressor);
  }
  
  // 2. 均衡器
  if (config.equalizer?.enabled) {
    applyEqualizer(data, sampleRate, config.equalizer);
  }
  
  // 3. 瞬态塑形
  if (config.transient?.enabled) {
    applyTransient(data, sampleRate, config.transient);
  }
  
  // 4. 混响（最后应用）
  if (config.reverb?.enabled) {
    applyReverb(data, sampleRate, config.reverb);
  }
}

/**
 * 导出所有效果函数
 */
export {
  applyCompressor,
  applyEqualizer,
  applyReverb,
  applyTransient,
};

