/**
 * JUMP动作组件
 * 整合引导动画、节拍、检测器和展示组件
 */

import { ActionComponent } from '../base/ActionBase';
import { JumpGuide } from './JumpGuide';
import { JumpBeat } from './beat';
import { JumpDetector } from './JumpDetector';
import { JumpDisplay } from './JumpDisplay';

export const JumpAction: ActionComponent = {
  name: '跳跃',
  englishName: 'JUMP',
  category: 'cardio',
  targetParts: ['legs'],
  durationSeconds: 30,
  Guide: JumpGuide,
  Beat: JumpBeat,
  Detector: new JumpDetector(),
  Display: JumpDisplay,
};



