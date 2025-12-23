/**
 * 节拍系统常量配置
 */

import { DrumType } from './types';

/**
 * 音频常量
 */
export const AUDIO_CONSTANTS = {
  DEFAULT_SAMPLE_RATE: 24000,
  DRUM_STEP_DURATION: 0.08, // 80ms
  NOISE_BUFFER_DURATION: 2, // 2秒
  MAX_BUFFER_LENGTH: 44100 * 2, // 最大2秒@44.1kHz
} as const;

/**
 * 各鼓点类型的默认参数
 */
export const DRUM_DEFAULTS: Record<DrumType, {
  duration: number;
  fundamental: number;
  defaultVelocity: number;
}> = {
  kick: {
    duration: 2.4,       // 2400ms - 极长持续时间，保证低频尾音
    fundamental: 27.5,   // A0
    defaultVelocity: 127,
  },
  snare: {
    duration: 0.10,      // 100ms
    fundamental: 200,    // 调谐共振频率
    defaultVelocity: 100,
  },
  hihat: {
    duration: 0.045,     // 45ms
    fundamental: 440,    // A4
    defaultVelocity: 80,
  },
  crash: {
    duration: 1.0,       // 1秒
    fundamental: 0,      // 宽频噪声，无基础频率
    defaultVelocity: 110,
  },
  openHihat: {
    duration: 0.2,       // 200ms
    fundamental: 440,    // A4
    defaultVelocity: 90,
  },
  rimshot: {
    duration: 0.05,      // 50ms
    fundamental: 300,    // 短促有力
    defaultVelocity: 115,
  },
} as const;

/**
 * 默认音量映射（向后兼容旧系统）
 */
export const LEGACY_VOLUME_MAP: Record<number, number> = {
  0: 1.0,   // DONG -> kick
  1: 0.45,  // CI -> hihat
  2: 0.80,  // DA -> snare
  3: 0.40,  // CI -> hihat
} as const;

/**
 * 旧格式到新格式的映射
 */
export const LEGACY_STEP_MAP: Record<number, DrumType> = {
  0: 'kick',
  1: 'hihat',
  2: 'snare',
  3: 'hihat',
} as const;

/**
 * 效果链默认配置
 */
export const DEFAULT_EFFECT_CONFIG = {
  compressor: {
    enabled: true,
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.1,
  },
  equalizer: {
    enabled: true,
    low: 0,
    mid: 0,
    high: 0,
  },
  reverb: {
    enabled: false,
    roomSize: 0.3,
    wetLevel: 0.2,
  },
  transient: {
    enabled: false,
    attack: 0.5,
    sustain: 0.5,
  },
} as const;

