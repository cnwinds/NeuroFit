/**
 * SAY HI动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';
import { SayHiBeatGame } from './SayHiBeatGame';

import { SayHiBeat } from './beat';

export const SayHiAction: ActionComponent = {
    name: '打招呼',
    englishName: 'say_hi',
    category: 'flexibility',
    targetParts: ['arms', 'shoulders'],
    durationSeconds: 15,
    Guide: (props) => <Guide actionName="say_hi" {...props} />,
    Beat: SayHiBeat,
    Detector: new GuideBasedDetector('say_hi'),
    Display: (props) => <SayHiBeatGame {...props} />,
};
