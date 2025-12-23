/**
 * Audio Utilities Module
 * 
 * 提供音频解码和音效播放功能
 * 节拍相关功能已迁移到 beats/ 模块
 */

// ============================================================================
// 从 beats 模块导入节拍功能（向后兼容）
// ============================================================================

export {
  pregenerateDrumBuffers,
  playDrumStepCached,
  clearAudioCache,
} from '../beats';

// ============================================================================
// 常量配置
// ============================================================================

export const AUDIO_CONSTANTS = {
  DEFAULT_SAMPLE_RATE: 24000,
} as const;

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 解码 Base64 字符串为原始字节
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * 归一化音频数据，防止削波
 */
function normalizeAudioData(data: Float32Array): void {
  let max = 0;
  const len = data.length;
  
  // 单次遍历找到最大值
  for (let i = 0; i < len; i++) {
    const abs = Math.abs(data[i]);
    if (abs > max) max = abs;
  }
  
  // 如果超过1.0，进行归一化
  if (max > 1.0) {
    const scale = 1.0 / max;
    for (let i = 0; i < len; i++) {
      data[i] *= scale;
    }
  }
}

/**
 * 应用音量增益
 */
function applyVolume(data: Float32Array, volume: number): void {
  const len = data.length;
  for (let i = 0; i < len; i++) {
    data[i] *= volume;
  }
}

// ============================================================================
// 音频解码
// ============================================================================

/**
 * 解码 Base64 PCM 数据为 AudioBuffer
 */
export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = AUDIO_CONSTANTS.DEFAULT_SAMPLE_RATE
): Promise<AudioBuffer> {
  const bytes = decodeBase64(base64Data);
  const numChannels = 1;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  const scale = 1.0 / 32768.0;
  
  // 优化：直接转换，避免嵌套循环
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] * scale;
  }
  
  return buffer;
}

// ============================================================================
// 简单音效
// ============================================================================

/**
 * 播放单音调
 */
export function playTone(
  ctx: AudioContext,
  freq: number = 440,
  duration: number = 0.1,
  type: OscillatorType = 'sine'
): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

/**
 * 播放倒计时提示音
 */
export function playCountdownBeep(ctx: AudioContext, isFinal: boolean = false): void {
  const freq = isFinal ? 880 : 440;
  playTone(ctx, freq, 0.15, 'square');
}

/**
 * 播放成功音效（和弦）
 */
export function playSuccessSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  const frequencies = [523.25, 659.25, 783.99, 1046.50];
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    const startTime = now + i * 0.05;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * 播放EXCELLENT评分音效（高音和弦，明亮欢快）
 */
export function playExcellentSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  // 使用更高频率的和弦，营造明亮欢快的感觉
  const frequencies = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    const startTime = now + i * 0.03;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 0.6);
  });
}

/**
 * 播放GOOD评分音效（中音和弦，温和积极）
 */
export function playGoodSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  // 使用中等频率的和弦
  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
  
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const startTime = now + i * 0.04;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * 播放BAD评分音效（低音单音，沉闷）
 */
export function playBadSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now); // A3
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * 播放MISS评分音效（极低音，失败感）
 */
export function playMissSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'square';
  osc.frequency.setValueAtTime(110, now); // A2
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.3);
}
