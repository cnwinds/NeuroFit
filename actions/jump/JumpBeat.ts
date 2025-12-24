/**
 * JUMP动作的节拍配置
 */

import { BeatPattern } from '../base/ActionBase';

export const JumpBeat: BeatPattern = {
  bpm: 120,
  pattern: [
    { type: 'kick', volume: 1.0 },
    { type: 'hihat', volume: 0.6 },
    { type: 'snare', volume: 0.8 },
    { type: 'hihat', volume: 0.6 },
  ],
};
