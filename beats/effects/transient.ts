/**
 * 瞬态塑形效果
 * 增强或软化瞬态
 */

import { EffectChainConfig } from '../types';

/**
 * 应用瞬态塑形效果到音频数据
 */
export function applyTransient(
  data: Float32Array,
  sampleRate: number,
  config: EffectChainConfig['transient'] = {}
): void {
  if (!config?.enabled) return;
  
  const attack = config.attack ?? 0.5; // 0-1, 0=软化, 1=增强
  const sustain = config.sustain ?? 0.5; // 0-1, 0=减少持续, 1=保持持续
  
  // 检测瞬态（通过检测快速变化）
  const attackWindow = Math.floor(sampleRate * 0.01); // 10ms窗口
  const sustainWindow = Math.floor(sampleRate * 0.05); // 50ms窗口
  
  const output = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    // 计算局部能量（用于检测瞬态）
    let attackEnergy = 0;
    let sustainEnergy = 0;
    
    for (let j = 0; j < attackWindow && i + j < data.length; j++) {
      attackEnergy += Math.abs(data[i + j]);
    }
    attackEnergy /= attackWindow;
    
    for (let j = 0; j < sustainWindow && i + j < data.length; j++) {
      sustainEnergy += Math.abs(data[i + j]);
    }
    sustainEnergy /= sustainWindow;
    
    // 瞬态检测：attack能量远大于sustain能量
    const isTransient = attackEnergy > sustainEnergy * 2;
    
    if (isTransient) {
      // 瞬态处理
      const gain = 0.5 + attack * 0.5; // 0.5-1.0
      output[i] = data[i] * gain;
    } else {
      // 持续部分处理
      const gain = 0.5 + sustain * 0.5; // 0.5-1.0
      output[i] = data[i] * gain;
    }
  }
  
  // 归一化以保持整体音量
  let max = 0;
  for (let i = 0; i < output.length; i++) {
    const abs = Math.abs(output[i]);
    if (abs > max) max = abs;
  }
  
  if (max > 0) {
    const scale = 1.0 / max;
    for (let i = 0; i < output.length; i++) {
      output[i] *= scale;
    }
  }
  
  // 复制回原始数组
  data.set(output);
}

