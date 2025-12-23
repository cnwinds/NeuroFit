/**
 * 压缩器效果
 * 控制动态范围，让鼓声更紧凑
 */

import { EffectChainConfig } from '../types';

/**
 * 应用压缩效果到音频数据
 */
export function applyCompressor(
  data: Float32Array,
  config?: EffectChainConfig['compressor']
): void {
  if (!config?.enabled) return;
  
  const threshold = config.threshold ?? -24; // dB
  const ratio = config.ratio ?? 4;
  const attack = config.attack ?? 0.003; // 秒
  const release = config.release ?? 0.1; // 秒
  
  // 将阈值从 dB 转换为线性值
  const thresholdLinear = Math.pow(10, threshold / 20);
  
  // 简化的压缩算法（离线处理）
  let envelope = 0;
  const attackCoeff = Math.exp(-1 / (attack * 44100)); // 假设44.1kHz
  const releaseCoeff = Math.exp(-1 / (release * 44100));
  
  for (let i = 0; i < data.length; i++) {
    const input = Math.abs(data[i]);
    
    // 包络跟随器
    if (input > envelope) {
      envelope = input + (envelope - input) * attackCoeff;
    } else {
      envelope = input + (envelope - input) * releaseCoeff;
    }
    
    // 压缩
    if (envelope > thresholdLinear) {
      const overThreshold = envelope - thresholdLinear;
      const compressed = thresholdLinear + overThreshold / ratio;
      const gain = compressed / envelope;
      data[i] *= gain;
    }
  }
}

