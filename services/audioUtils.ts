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
  DRUM_STEP_DURATION: 0.08, // 缩短到80ms，避免重叠和卡顿
  DRUM_STEP_COUNT: 4,
  NOISE_BUFFER_DURATION: 2,
  MAX_BUFFER_LENGTH: 44100 * 2, // 最大2秒@44.1kHz
} as const;

const DRUM_STEP_VOLUMES: Record<DrumStep, number> = {
  0: 1.0,   // DONG - 浑厚有力，最响
  1: 0.45,  // CI - 清脆但不抢戏，降低音量
  2: 0.80,  // DA - 中等力度
  3: 0.40,  // CI - 更轻，形成渐弱效果
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
 * 生成 DONG (咚) - 极致浑厚的低音
 * 增强版：更多的低频成分，更长的共鸣
 * 基于 A0 音（27.5Hz），最低的钢琴音
 */
function generateDongSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number
): void {
  const duration = 0.15; // 延长到150ms，让低频更持久
  const samples = Math.min(Math.ceil(sampleRate * duration), bufferLength);
  
  // 基础音：A0（27.5Hz），极低频，震撼有力
  const fundamental = 27.5;
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const progress = i / samples; // 归一化进度 0-1
    
    // ADSR 包络：瞬时attack，更长decay，平滑release
    const attack = Math.min(t / 0.002, 1.0); // 2ms 快速attack
    const decay = Math.exp(-t * 8); // 更慢的衰减，增加共鸣感
    
    // 添加平滑的 release，避免尾部爆破音
    // 最后 10% 做淡出处理
    const release = progress > 0.9 ? (1 - (progress - 0.9) / 0.1) : 1.0;
    const envelope = attack * decay * release;
    
    // 1. Ultra Sub Bass（13.75Hz）- 极深的震动感
    const phaseUltraSub = 2 * Math.PI * (fundamental * 0.5) * t;
    data[i] += Math.sin(phaseUltraSub) * envelope * 0.8;
    
    // 2. Sub Bass（A0: 27.5Hz）- 深沉的底部
    const phaseSub = 2 * Math.PI * fundamental * t;
    data[i] += Math.sin(phaseSub) * envelope * 1.8;
    
    // 3. 基频（A1: 55Hz）- 主要能量
    const phase1 = 2 * Math.PI * (fundamental * 2) * t;
    data[i] += Math.sin(phase1) * envelope * 1.5;
    
    // 4. 二次泛音（A2: 110Hz）- 增加厚度
    const phase2 = 2 * Math.PI * (fundamental * 4) * t;
    data[i] += Math.sin(phase2) * envelope * 0.8;
    
    // 5. 三次泛音（E3: 165Hz）- 增加共鸣
    const phase3 = 2 * Math.PI * (fundamental * 6) * t;
    data[i] += Math.sin(phase3) * envelope * 0.4;
    
    // 6. 轻微的punch频率（80Hz）- 降低punch频率，更浑厚
    const phasePunch = 2 * Math.PI * 80 * t;
    data[i] += Math.sin(phasePunch) * envelope * 0.3 * Math.exp(-t * 40);
  }
}

/**
 * 生成 CI (嚓) - 温暖的中高音点缀
 * 重新设计：降低频率，增加温暖感，融入整体浑厚音色
 * 基于 A4 音（440Hz），标准音高A，温暖协调
 */
function generateCiSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number,
  noiseData: Float32Array
): void {
  const duration = 0.045; // 45ms，稍长一点增加厚度
  const samples = Math.min(Math.ceil(sampleRate * duration), bufferLength);
  
  // 音乐音调：A4（440Hz），温暖的中高音，与A0形成八度关系
  const fundamental = 440;
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    
    // 快速attack和decay，但保持温暖
    const attack = Math.min(t / 0.001, 1.0); // 1ms attack
    const decay = Math.exp(-t * 45); // 适中衰减
    const envelope = attack * decay;
    
    // 1. 基频（A4: 440Hz）- 温暖主音
    const phase1 = 2 * Math.PI * fundamental * t;
    data[i] += Math.sin(phase1) * envelope * 0.35;
    
    // 2. 低频泛音（A3: 220Hz）- 增加厚度
    const phaseLow = 2 * Math.PI * (fundamental * 0.5) * t;
    data[i] += Math.sin(phaseLow) * envelope * 0.25;
    
    // 3. 二次泛音（A5: 880Hz）- 轻微明亮感
    const phase2 = 2 * Math.PI * (fundamental * 2) * t;
    data[i] += Math.sin(phase2) * envelope * 0.15;
    
    // 4. 温和的中频噪声（不刺耳）
    const noiseIndex = (i * 2) % noiseData.length;
    // 中频滤波：保留中频温暖感
    const filteredNoise = noiseData[noiseIndex] * (0.2 + 0.8 * (1 - Math.exp(-t * 80)));
    data[i] += filteredNoise * envelope * 0.2;
  }
}

/**
 * 生成 DA (哒) - 浑厚有力的中低音
 * 增强版：更多低频成分，更浑厚的音色
 * 基于 E1 音（41.2Hz），DONG的五度音
 */
function generateDaSound(
  data: Float32Array,
  sampleRate: number,
  bufferLength: number,
  noiseData: Float32Array
): void {
  const duration = 0.10; // 延长到100ms，增加厚度
  const samples = Math.min(Math.ceil(sampleRate * duration), bufferLength);
  
  // 音乐音调：E1（41.2Hz），与A0形成纯五度关系（完美和声）
  const fundamental = 41.2;
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const progress = i / samples;
    
    // ADSR 包络：快速attack，较长decay，平滑release
    const attack = Math.min(t / 0.0015, 1.0); // 1.5ms attack
    const decay = Math.exp(-t * 15); // 更慢的衰减，增加浑厚感
    const release = progress > 0.9 ? (1 - (progress - 0.9) / 0.1) : 1.0;
    const envelope = attack * decay * release;
    
    // 1. Sub Bass（E0: 20.6Hz）- 极低频共鸣
    const phaseSub = 2 * Math.PI * (fundamental * 0.5) * t;
    data[i] += Math.sin(phaseSub) * envelope * 0.6;
    
    // 2. 基频（E1: 41.2Hz）- 低频基础
    const phase1 = 2 * Math.PI * fundamental * t;
    data[i] += Math.sin(phase1) * envelope * 1.5;
    
    // 3. 二次泛音（E2: 82.4Hz）- 主要音色
    const phase2 = 2 * Math.PI * (fundamental * 2) * t;
    data[i] += Math.sin(phase2) * envelope * 1.2;
    
    // 4. 三次泛音（B2: 123.6Hz）- 和声
    const phase3 = 2 * Math.PI * (fundamental * 3) * t;
    data[i] += Math.sin(phase3) * envelope * 0.7;
    
    // 5. 四次泛音（E3: 164.8Hz）- 增加厚度
    const phase4 = 2 * Math.PI * (fundamental * 4) * t;
    data[i] += Math.sin(phase4) * envelope * 0.4;
    
    // 6. 低频punch（100Hz）- 降低punch频率，更浑厚
    const phasePunch = 2 * Math.PI * 100 * t;
    data[i] += Math.sin(phasePunch) * envelope * 0.3 * Math.exp(-t * 35);
    
    // 7. 轻微的低频噪声（增加质感）
    if (i < samples * 0.5) { // 前50%添加噪声
      const noiseIndex = i % noiseData.length;
      const filteredNoise = noiseData[noiseIndex] * (0.1 + 0.9 * (1 - Math.exp(-t * 60)));
      data[i] += filteredNoise * envelope * 0.15;
    }
  }
}

/**
 * 生成单个鼓点步骤的 AudioBuffer（预生成版本）
 * 
 * 浑厚低音设计方案：
 * - DONG: A0 (27.5Hz) - 极低频，极致浑厚，多层低频泛音
 * - CI: A4 (440Hz) - 温暖中高音，与A0形成八度和声关系
 * - DA: E1 (41.2Hz) - 浑厚低中频，与A0形成纯五度和声
 * 
 * 整体以 A 音为中心，形成八度和五度的和声关系
 * 所有音都强调低频成分，营造浑厚温暖的整体音色
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
    case 0: // DONG - 低音根音
      generateDongSound(data, sampleRate, bufferLength);
      break;
      
    case 1: // CI - 高音明快
    case 3: // CI - 高音明快（稍轻）
      {
        const noiseBuf = getNoiseBuffer(ctx);
        const noiseData = noiseBuf.getChannelData(0);
        generateCiSound(data, sampleRate, bufferLength, noiseData);
      }
      break;
      
    case 2: // DA - 中音有力
      {
        const noiseBuf = getNoiseBuffer(ctx);
        const noiseData = noiseBuf.getChannelData(0);
        generateDaSound(data, sampleRate, bufferLength, noiseData);
      }
      break;
  }
  
  // 先应用音量
  const volume = DRUM_STEP_VOLUMES[step];
  applyVolume(data, volume);
  
  // 归一化防止削波（在音量调整后）
  normalizeAudioData(data);
  
  // 轻微的压缩效果（让声音更紧凑，但不过度）
  // 只对 DONG 和 DA 应用轻微压缩，CI 保持清脆
  if (step === 0 || step === 2) {
    for (let i = 0; i < data.length; i++) {
      const sample = data[i];
      // 更柔和的压缩，避免失真
      data[i] = Math.tanh(sample * 1.1) * 0.98;
    }
  }
  
  // 最后添加淡入淡出，确保开始和结束都平滑
  // 前 0.5ms 淡入
  const fadeInSamples = Math.min(Math.ceil(ctx.sampleRate * 0.0005), data.length);
  for (let i = 0; i < fadeInSamples; i++) {
    data[i] *= i / fadeInSamples;
  }
  
  // 后 1ms 淡出
  const fadeOutSamples = Math.min(Math.ceil(ctx.sampleRate * 0.001), data.length);
  for (let i = 0; i < fadeOutSamples; i++) {
    const idx = data.length - 1 - i;
    data[idx] *= i / fadeOutSamples;
  }
  
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
