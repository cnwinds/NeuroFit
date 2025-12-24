/**
 * 节拍系统类型定义
 */

/**
 * 鼓点音色类型
 */
export type DrumType = 'kick' | 'snare' | 'hihat' | 'openHihat' | 'crash' | 'tom' | 'ride';

/**
 * 单个节拍步骤
 * 表示在特定时间点播放的音色
 */
export interface DrumStep {
  type: DrumType;
  volume: number;      // 0.0 - 1.0
  timeOffset?: number; // 时间偏移（秒），用于摇摆感等
}

/**
 * 音频配置（用于向后兼容）
 */
export interface BeatAudioConfig {
  steps: Array<{
    frequency: number;
    type: OscillatorType;
    volume: number;
  }>;
}

/**
 * 节拍模式配置
 * pattern 现在支持每个时间点包含多个乐器
 */
export interface BeatPattern {
  bpm: number;                    // 节拍速度（每分钟节拍数）
  pattern: DrumStep[] | DrumStep[][]; // 节拍模式数组，支持单乐器或是多乐器组合
  timeSignature?: [number, number]; // 拍号，如 [4, 4] 表示 4/4 拍
  swing?: number;                 // 摇摆感（0-100%）
}

/**
 * 保存的节拍模式
 * pattern 现在支持每个时间点包含多个乐器
 */
export interface SavedBeatPattern {
  id: string;
  name: string;
  bpm: number;
  pattern: DrumStep[] | DrumStep[][]; // 支持单个或多个乐器
  timeSignature: [number, number];
  swing: number;
  length: number; // 模式长度（步数）
  createdAt: number;
  updatedAt: number;
}

