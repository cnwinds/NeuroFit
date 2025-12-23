/**
 * 均衡器效果
 * 3段EQ（低/中/高），增强频率特性
 */

import { EffectChainConfig } from '../types';

/**
 * 应用均衡器效果到音频数据
 * 使用简单的IIR滤波器实现
 */
export function applyEqualizer(
  data: Float32Array,
  sampleRate: number,
  config?: EffectChainConfig['equalizer']
): void {
  if (!config?.enabled) return;
  
  const lowGain = config.low ?? 0; // dB
  const midGain = config.mid ?? 0; // dB
  const highGain = config.high ?? 0; // dB
  
  // 转换为线性增益
  const lowGainLinear = Math.pow(10, lowGain / 20);
  const midGainLinear = Math.pow(10, midGain / 20);
  const highGainLinear = Math.pow(10, highGain / 20);
  
  // 简化的EQ实现：使用频率分离
  // 低通滤波器（低频）
  const lowCutoff = 200; // Hz
  const lowAlpha = 1 / (1 + 2 * Math.PI * lowCutoff / sampleRate);
  let lowState = 0;
  
  // 高通滤波器（高频）
  const highCutoff = 5000; // Hz
  const highAlpha = 1 / (1 + 2 * Math.PI * highCutoff / sampleRate);
  let highState = 0;
  
  const lowPass = new Float32Array(data.length);
  const highPass = new Float32Array(data.length);
  const midPass = new Float32Array(data.length);
  
  // 计算低通和高通
  for (let i = 0; i < data.length; i++) {
    // 低通
    lowState = lowState + (data[i] - lowState) * lowAlpha;
    lowPass[i] = lowState;
    
    // 高通
    highState = highState + (data[i] - highState) * highAlpha;
    highPass[i] = data[i] - highState;
  }
  
  // 中频 = 原始 - 低频 - 高频
  for (let i = 0; i < data.length; i++) {
    midPass[i] = data[i] - lowPass[i] - highPass[i];
  }
  
  // 应用增益并混合
  for (let i = 0; i < data.length; i++) {
    data[i] = lowPass[i] * lowGainLinear + 
              midPass[i] * midGainLinear + 
              highPass[i] * highGainLinear;
  }
}

