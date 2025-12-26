/**
 * SideBends 动作的节拍配置
 * BPM: 60
 * 自动生成于: 2025/12/26 13:53:25
 */

import { BeatPattern } from '../base/ActionBase';

export const SideBendsBeat: BeatPattern = {
  bpm: 60,
  timeSignature: [4, 4],
  pattern: [
    [{ type: 'kick', volume: 0.6 }],
    [{ type: 'hihat', volume: 0.3 }],
    [],
    []
  ],
  totalBeats: 4,
  beatFrameMapping: [0, 15, 30, 45]
};
