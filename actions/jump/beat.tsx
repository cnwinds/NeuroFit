/**
 * Jump 动作的节拍配置
 * BPM: 120
 * 自动生成于: 2025/12/26 13:38:32
 */

import { BeatPattern } from '../base/ActionBase';

export const JumpBeat: BeatPattern = {
  bpm: 120,
  timeSignature: [4, 4],
  pattern: [
    [{ type: 'kick', volume: 1 }],
    [{ type: 'hihat', volume: 0.6 }],
    [{ type: 'snare', volume: 0.8 }],
    [{ type: 'hihat', volume: 0.6 }]
  ],
};
