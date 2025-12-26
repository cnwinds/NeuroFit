/**
 * SayHi 动作的节拍配置
 * BPM: 60
 * 自动生成于: 2025/12/26 12:02:16
 */

import { BeatPattern } from '../base/ActionBase';

export const SayHiBeat: BeatPattern = {
  bpm: 60,
  timeSignature: [4, 4],
  pattern: [
    [{ type: 'kick', volume: 0.9 }],
    [],
    [{ type: 'tom', volume: 0.6 }, { type: 'hihat', volume: 0.6 }],
    []
  ],
  totalBeats: 4,
  beatFrameMapping: [0, 15, 30, 45]
};
