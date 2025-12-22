/**
 * Audio Utilities Module
 * 
 * 提供音频解码、合成和播放功能
 * 优化：使用预生成缓存避免实时计算导致的延迟和卡顿
 */

// ============================================================================
// 类型定义
// ============================================================================

type DrumStep = 0 | 1 | 2 | 3;

interface DrumStepConfig {
  duration: number;
  volume: number;
}

interface AudioConstants {
  readonly DEFAULT_SAMPLE_RATE: number;
  readonly DRUM_STEP_DURATION: number;
  readonly DRUM_STEP_COUNT: number;
  readonly NOISE_BUFFER_DURATION: number;
  readonly MAX_BUFFER_LENGTH: number;
}

// ============================================================================
// 常量配置
// ============================================================================

const AUDIO_CONSTANTS: AudioConstants = {
  DEFAULT_SAMPLE_RATE: 24000,
  DRUM_STEP_DURATION: 0.12,
  DRUM_STEP_COUNT: 4,
  NOISE_BUFFER_DURATION: 2,
  MAX_BUFFER_LENGTH: 44100 * 2, // 最大2秒@44.1kHz
} as const;

const DRUM_STEP_VOLUMES: Record<DrumStep, number> = {
  0: 1.0,   // DONG - 最响
  1: 0.75,  // CI - 稍轻但清晰
  2: 0.9,   // DA - 次响
  3: 0.75,  // CI - 稍轻但清晰
} as const;

// ============================================================================
// 模块级缓存
// ============================================================================

let noiseBuffer: AudioBuffer | null = null;
const drumBufferCache = new Map<string, AudioBuffer>();

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

/**
 * 获取或创建噪声缓冲区（单例模式）
 */
function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  // 如果已存在且采样率匹配，直接返回
  if (noiseBuffer?.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  
  // 创建新的噪声缓冲区
  const bufferSize = Math.floor(ctx.sampleRate * AUDIO_CONSTANTS.NOISE_BUFFER_DURATION);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // 生成白噪声
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  noiseBuffer = buffer;
  return buffer;
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

// ============================================================================
// 鼓点合成 - 核心算法
// ============================================================================

/**
 * 生成 DONG (咚) - 深沉有力的低音
 */
function generateDongSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number
): void {
  const kickDuration = 0.1;
  const kickSamples = Math.min(Math.ceil(sampleRate * kickDuration), bufferLength);
  
  // 主低音：频率从80Hz快速下降到40Hz
  for (let i = 0; i < kickSamples; i++) {
    const t = i / sampleRate;
    const freq = 80 * Math.pow(0.5, t / kickDuration); // 40/80 = 0.5
    const phase = 2 * Math.PI * freq * t;
    const gain = 1.5 * Math.exp(-t * 20);
    data[i] += Math.sin(phase) * gain;
  }
  
  // 瞬态冲击：让"咚"更清晰
  const attackDuration = 0.005;
  const attackSamples = Math.min(Math.ceil(sampleRate * attackDuration), bufferLength);
  
  for (let i = 0; i < attackSamples; i++) {
    const t = i / sampleRate;
    const phase = 2 * Math.PI * 200 * t;
    const gain = 0.4 * Math.exp(-t * 200);
    data[i] += Math.sin(phase) * gain;
  }
}

/**
 * 生成 CI (嚓) - 清脆明亮的高音
 */
function generateCiSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number,
  noiseData: Float32Array
): void {
  const hihatDuration = 0.06;
  const hihatSamples = Math.min(Math.ceil(sampleRate * hihatDuration), bufferLength);
  
  // 高频噪声（主要部分）
  for (let i = 0; i < hihatSamples; i++) {
    const t = i / sampleRate;
    const gain = 0.9 * Math.exp(-t * 30);
    const noiseIndex = (i * 3) % noiseData.length;
    // 高通滤波效果：增强高频，减弱低频
    const filteredNoise = noiseData[noiseIndex] * (0.5 + 0.5 * (1 - Math.exp(-t * 150)));
    data[i] += filteredNoise * gain;
  }
  
  // 添加轻微的音调（让"嚓"更有特色）
  const toneDuration = 0.03;
  const toneSamples = Math.min(Math.ceil(sampleRate * toneDuration), bufferLength);
  
  for (let i = 0; i < toneSamples; i++) {
    const t = i / sampleRate;
    const freq = 8000 * (1 - t * 0.3); // 轻微下降
    const phase = 2 * Math.PI * freq * t;
    const gain = 0.15 * Math.exp(-t * 40);
    data[i] += Math.sin(phase) * gain;
  }
}

/**
 * 生成 DA (哒) - 中音，有冲击感
 */
function generateDaSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number,
  noiseData: Float32Array
): void {
  const snareDuration = 0.08;
  const snareSamples = Math.min(Math.ceil(sampleRate * snareDuration), bufferLength);
  
  // 中频音调（主体）
  for (let i = 0; i < snareSamples; i++) {
    const t = i / sampleRate;
    const freq = 300 * (1 - t * 0.2);
    const phase = 2 * Math.PI * freq * t;
    const gain = 1.0 * Math.exp(-t * 18);
    // 使用稍微失真的波形，更有冲击感
    const wave = Math.sin(phase) + 0.3 * Math.sin(phase * 2);
    data[i] += wave * gain;
  }
  
  // 噪声冲击（让"哒"更清晰有力）
  const noiseDuration = 0.05;
  const noiseSamples = Math.min(Math.ceil(sampleRate * noiseDuration), bufferLength);
  
  for (let i = 0; i < noiseSamples; i++) {
    const t = i / sampleRate;
    const gain = 0.6 * Math.exp(-t * 25);
    const noiseIndex = i % noiseData.length;
    // 中高频噪声
    const filteredNoise = noiseData[noiseIndex] * (0.3 + 0.7 * (1 - Math.exp(-t * 80)));
    data[i] += filteredNoise * gain;
  }
}

/**
 * 生成单个鼓点步骤的 AudioBuffer（预生成版本）
 * 
 * @param ctx - AudioContext
 * @param step - 步骤编号 (0=DONG, 1=CI, 2=DA, 3=CI)
 * @param duration - 持续时间（秒）
 * @returns 生成的 AudioBuffer
 */
function generateDrumStepBuffer(
  ctx: AudioContext,
  step: DrumStep,
  duration: number = AUDIO_CONSTANTS.DRUM_STEP_DURATION
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferLength = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);
  
  // 初始化数组为0
  data.fill(0);
  
  // 根据步骤生成不同的声音
  switch (step) {
    case 0: // DONG
      generateDongSound(data, sampleRate, bufferLength);
      break;
      
    case 1: // CI
    case 3: // CI
      {
        const noiseBuf = getNoiseBuffer(ctx);
        const noiseData = noiseBuf.getChannelData(0);
        generateCiSound(data, sampleRate, bufferLength, noiseData);
      }
      break;
      
    case 2: // DA
      {
        const noiseBuf = getNoiseBuffer(ctx);
        const noiseData = noiseBuf.getChannelData(0);
        generateDaSound(data, sampleRate, bufferLength, noiseData);
      }
      break;
  }
  
  // 归一化防止削波
  normalizeAudioData(data);
  
  // 应用音量
  const volume = DRUM_STEP_VOLUMES[step];
  applyVolume(data, volume);
  
  return buffer;
}

// ============================================================================
// 鼓点缓存管理
// ============================================================================

/**
 * 预生成所有鼓点步骤的 AudioBuffer
 * 使用 requestIdleCallback 在空闲时生成，避免阻塞主线程
 */
export function pregenerateDrumBuffers(ctx: AudioContext): Promise<void> {
  return new Promise((resolve, reject) => {
    const generate = () => {
      try {
        const cacheKey = `${ctx.sampleRate}`;
        
        // 检查是否已缓存
        if (drumBufferCache.has(`${cacheKey}-0`)) {
          resolve();
          return;
        }
        
        // 生成所有步骤的缓冲区
        for (let step = 0; step < AUDIO_CONSTANTS.DRUM_STEP_COUNT; step++) {
          const buffer = generateDrumStepBuffer(ctx, step as DrumStep);
          drumBufferCache.set(`${cacheKey}-${step}`, buffer);
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    // 使用 requestIdleCallback 或 setTimeout 来避免阻塞
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(generate, { timeout: 1000 });
    } else {
      setTimeout(generate, 0);
    }
  });
}

/**
 * 从缓存播放鼓点步骤（高性能版本）
 * 
 * @param ctx - AudioContext
 * @param step - 步骤编号 (0-3)
 */
export function playDrumStepCached(ctx: AudioContext, step: number): void {
  if (ctx.state !== 'running') {
    return;
  }
  
  const cacheKey = `${ctx.sampleRate}-${step}`;
  const buffer = drumBufferCache.get(cacheKey);
  
  if (!buffer) {
    // 如果缓存不存在，回退到实时生成（不应该发生）
    console.warn(`[AudioUtils] Drum buffer not cached for step ${step}, generating on the fly`);
    playDrumStep(ctx, step);
    return;
  }
  
  // 使用缓存的 AudioBuffer 播放（零延迟）
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
}

/**
 * 清理音频缓存（用于内存管理）
 */
export function clearAudioCache(): void {
  drumBufferCache.clear();
  noiseBuffer = null;
}

// ============================================================================
// 实时生成（回退方案，不推荐使用）
// ============================================================================

/**
 * 实时生成并播放鼓点步骤（回退方案）
 * 注意：此函数会产生延迟，推荐使用 playDrumStepCached
 * 
 * @deprecated 使用 playDrumStepCached 代替
 */
export function playDrumStep(ctx: AudioContext, step: number): void {
  if (ctx.state !== 'running') {
    return;
  }
  
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(ctx.destination);
  
  // 简化的实时生成逻辑（与预生成版本保持一致）
  // 这里保持原有实现作为回退方案
  if (step === 0) {
    // DONG
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    gain.gain.setValueAtTime(1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  } else if (step === 2) {
    // DA
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  } else {
    // CI
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(t);
    noise.stop(t + 0.06);
  }
}
