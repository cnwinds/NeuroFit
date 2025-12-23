/**
 * 混响效果
 * 使用简单的延迟线模拟房间混响
 */

import { EffectChainConfig } from '../types';

/**
 * 应用混响效果到音频数据
 * 使用简化的延迟线算法
 */
export function applyReverb(
  data: Float32Array,
  sampleRate: number,
  config: EffectChainConfig['reverb'] = {}
): void {
  if (!config?.enabled) return;
  
  const roomSize = config.roomSize ?? 0.3;
  const wetLevel = config.wetLevel ?? 0.2;
  const dryLevel = 1 - wetLevel;
  
  // 延迟线参数（基于房间大小）
  const delay1 = Math.floor(sampleRate * (0.03 * roomSize)); // 30ms * roomSize
  const delay2 = Math.floor(sampleRate * (0.05 * roomSize)); // 50ms * roomSize
  const delay3 = Math.floor(sampleRate * (0.07 * roomSize)); // 70ms * roomSize
  
  const delayLine1 = new Float32Array(delay1);
  const delayLine2 = new Float32Array(delay2);
  const delayLine3 = new Float32Array(delay3);
  
  let delayIndex1 = 0;
  let delayIndex2 = 0;
  let delayIndex3 = 0;
  
  const output = new Float32Array(data.length);
  
  for (let i = 0; i < data.length; i++) {
    // 读取延迟线
    const delayed1 = delayLine1[delayIndex1];
    const delayed2 = delayLine2[delayIndex2];
    const delayed3 = delayLine3[delayIndex3];
    
    // 混合延迟信号
    const reverb = (delayed1 * 0.4 + delayed2 * 0.3 + delayed3 * 0.3) * 0.5;
    
    // 输出 = 干信号 + 湿信号
    output[i] = data[i] * dryLevel + reverb * wetLevel;
    
    // 写入延迟线（带反馈）
    delayLine1[delayIndex1] = data[i] + reverb * 0.3;
    delayLine2[delayIndex2] = data[i] + reverb * 0.25;
    delayLine3[delayIndex3] = data[i] + reverb * 0.2;
    
    // 更新延迟索引
    delayIndex1 = (delayIndex1 + 1) % delay1;
    delayIndex2 = (delayIndex2 + 1) % delay2;
    delayIndex3 = (delayIndex3 + 1) % delay3;
  }
  
  // 复制回原始数组
  data.set(output);
}

