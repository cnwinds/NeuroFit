/**
 * beats 模块导出接口
 */

// 导出类型
export type {
  DrumType,
  DrumStep,
  BeatPattern,
  BeatAudioConfig,
  SavedBeatPattern
} from './types';

// 导出音频引擎函数
export {
  getAudioEngine,
  playDrumStepCached,
  playDrumStep
} from './audioEngine';

/**
 * 转换旧格式节拍模式（向后兼容）
 * 将 number[] 转换为 DrumStep[]
 */
export function convertLegacyPattern(pattern: number[] | any[]): any[] {
  if (pattern.length === 0) {
    return [];
  }

  // 如果已经是 DrumStep 格式，直接返回
  if (typeof pattern[0] === 'object' && 'type' in pattern[0]) {
    return pattern;
  }

  // 转换为 DrumStep 格式
  const typeMap: any[] = ['kick', 'hihat', 'snare', 'hihat'];
  return pattern.map((step, index) => {
    if (typeof step === 'number') {
      return {
        type: typeMap[step % typeMap.length] || 'kick',
        volume: 0.5,
        timeOffset: 0
      };
    }
    return step;
  });
}

