/**
 * JUMPING JACK动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { JumpingJackBeat } from './beat';

export const JumpingJackAction: ActionComponent = {
    name: '开合跳',
    englishName: 'jumping_jack',
    category: 'cardio',
    targetParts: ['full-body'],
    durationSeconds: 30,
    Guide: (props) => <Guide actionName="jumping_jack" {...props} />,
    Beat: JumpingJackBeat,
    Detector: new GuideBasedDetector('jumping_jack'),
    Display: () => null,
};
