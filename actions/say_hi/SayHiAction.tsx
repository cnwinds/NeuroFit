/**
 * SAY HI动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { SayHiGuide } from './SayHiGuide';
import { SayHiDetector } from './SayHiDetector';
import { SayHiDisplay } from './SayHiDisplay';
import { SayHiBeatGame } from './SayHiBeatGame';

import { SayHiBeat } from './beat';

export const SayHiAction: ActionComponent = {
    name: '打招呼',
    englishName: 'SAY HI',
    category: 'flexibility',
    targetParts: ['arms', 'shoulders'],
    durationSeconds: 15,
    Guide: (props) => <SayHiGuide {...props} />,
    Beat: SayHiBeat,
    Detector: new SayHiDetector(),
    Display: (props) => <SayHiBeatGame {...props} />,
};
