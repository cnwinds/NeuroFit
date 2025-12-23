/**
 * 节拍系统主入口
 * 导出所有公共 API 和向后兼容适配器
 */

// 导出类型
export type {
  DrumType,
  DrumStep,
  BeatPattern,
  BeatAudioConfig,
  DrumSynthesisParams,
  EffectChainConfig,
} from './types';

// 导出常量
export { DRUM_DEFAULTS, LEGACY_STEP_MAP, LEGACY_VOLUME_MAP } from './constants';

// 导出缓存和播放器
export { BeatCache, getBeatCache, pregenerateDrumBuffers, clearAudioCache } from './cache';
export { BeatPlayer, getBeatPlayer, playDrumStepCached } from './player';

// 导出合成器（高级用法）
export { synthesizeDrum, getSynthesizer } from './synthesis';

// 导出效果（高级用法）
export { applyEffectChain } from './effects';

/**
 * 向后兼容：将旧格式 pattern: number[] 转换为新格式 DrumStep[]
 */
import { DrumStep, BeatPattern } from './types';
import { LEGACY_STEP_MAP, LEGACY_VOLUME_MAP } from './constants';

export function convertLegacyPattern(pattern: number[]): DrumStep[] {
  return pattern.map((step) => ({
    type: LEGACY_STEP_MAP[step] || 'kick',
    velocity: Math.round(LEGACY_VOLUME_MAP[step] * 127) || 127,
  }));
}

/**
 * 向后兼容：将旧格式 BeatPattern 转换为新格式
 */
export function convertLegacyBeatPattern(pattern: {
  bpm: number;
  pattern: number[];
  audioConfig?: any;
}): BeatPattern {
  return {
    bpm: pattern.bpm,
    pattern: convertLegacyPattern(pattern.pattern),
    timeSignature: [4, 4],
    swing: 0,
    audioConfig: pattern.audioConfig,
  };
}

/**
 * 创建默认节拍模式
 */
export function createDefaultBeatPattern(bpm: number = 120): BeatPattern {
  return {
    bpm,
    pattern: [
      { type: 'kick', velocity: 127 },
      { type: 'hihat', velocity: 80 },
      { type: 'snare', velocity: 100 },
      { type: 'hihat', velocity: 80 },
    ],
    timeSignature: [4, 4],
    swing: 0,
  };
}

