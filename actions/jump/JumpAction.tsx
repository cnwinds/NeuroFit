/**
 * JUMP动作组件
 * 整合引导动画、节拍、检测器和展示组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';
import { JumpDisplay } from './JumpDisplay';

import { JumpBeat } from './beat';

export const JumpAction: ActionComponent = {
  name: '跳跃',
  englishName: 'jump',
  category: 'cardio',
  targetParts: ['legs'],
  durationSeconds: 30,
  Guide: (props) => <Guide actionName="jump" {...props} />,
  Beat: JumpBeat,
  Detector: new GuideBasedDetector('jump'),
  Display: JumpDisplay,
};



