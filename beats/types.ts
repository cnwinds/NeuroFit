/**
 * 节拍系统类型定义
 */

/**
 * 鼓点类型枚举
 */
export type DrumType = 'kick' | 'snare' | 'hihat' | 'crash' | 'openHihat' | 'rimshot';

/**
 * 单个鼓点步骤
 */
export interface DrumStep {
  type: DrumType;
  velocity: number;  // 0-127
  timing?: number;   // 相对时间偏移（微调，秒）
}

/**
 * 节拍模式配置
 */
export interface BeatPattern {
  bpm: number;                    // 节拍速度
  pattern: DrumStep[];            // 节拍模式
  timeSignature?: [number, number]; // 拍号，如 [4, 4]
  swing?: number;                 // 摇摆感 (0-1)
  audioConfig?: BeatAudioConfig;  // 音效配置（向后兼容）
}

/**
 * 音效配置（向后兼容）
 */
export interface BeatAudioConfig {
  steps: Array<{
    frequency: number;
    type: OscillatorType;
    volume: number;
  }>;
}

/**
 * 合成参数接口
 */
export interface DrumSynthesisParams {
  sampleRate: number;
  duration: number;
  velocity: number;  // 0-127
  fundamental?: number;  // 基础频率（可选）
}

/**
 * 效果链配置接口
 */
export interface EffectChainConfig {
  compressor?: {
    enabled: boolean;
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  };
  equalizer?: {
    enabled: boolean;
    low?: number;   // 低频增益 (dB)
    mid?: number;   // 中频增益 (dB)
    high?: number;  // 高频增益 (dB)
  };
  reverb?: {
    enabled: boolean;
    roomSize?: number;  // 0-1
    wetLevel?: number; // 0-1
  };
  transient?: {
    enabled: boolean;
    attack?: number;   // 0-1
    sustain?: number;  // 0-1
  };
}

/**
 * 缓存键格式
 */
export type CacheKey = string;

