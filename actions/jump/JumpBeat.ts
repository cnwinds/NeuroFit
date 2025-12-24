/**
 * JUMP动作的节拍配置
 */

import { BeatPattern } from '../base/ActionBase';

export const JumpBeat: BeatPattern = {
  bpm: 120,  // 每分钟120拍
  pattern: [0, 1, 2, 3],  // DONG-CI-DA-CI 循环
  audioConfig: {
    steps: [
      { frequency: 440, type: 'sine', volume: 0.3 },
      { frequency: 550, type: 'sine', volume: 0.2 },
      { frequency: 660, type: 'sine', volume: 0.3 },
      { frequency: 550, type: 'sine', volume: 0.2 },
    ]
  }
};


