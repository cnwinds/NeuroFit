/**
 * Walk 动作的节拍配置
 * BPM: 100
 * 自动生成于: 2025/12/26 14:13:01
 */

import { BeatPattern } from '../base/ActionBase';

export const WalkBeat: BeatPattern = {
  bpm: 100,
  timeSignature: [4, 4],
  pattern: [
    [{ type: 'kick', volume: 0.8 }],
    [{ type: 'hihat', volume: 0.4 }],
    [{ type: 'kick', volume: 0.8 }],
    [{ type: 'hihat', volume: 0.4 }]
  ],
};
