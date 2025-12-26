/**
 * Swing 动作的节拍配置
 * BPM: 110
 * 自动生成于: 2025/12/26 14:13:06
 */

import { BeatPattern } from '../base/ActionBase';

export const SwingBeat: BeatPattern = {
  bpm: 110,
  timeSignature: [4, 4],
  pattern: [
    [{ type: 'kick', volume: 0.8 }],
    [{ type: 'hihat', volume: 0.4 }],
    [{ type: 'snare', volume: 0.7 }],
    [{ type: 'hihat', volume: 0.4 }]
  ],
  totalBeats: 4,
  beatFrameMapping: [0, 15, 30, 45]
};
