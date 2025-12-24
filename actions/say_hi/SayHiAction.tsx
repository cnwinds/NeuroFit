/**
 * SAY HI动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { SayHiGuide } from './SayHiGuide';
import { SayHiDetector } from './SayHiDetector';
import { SayHiDisplay } from './SayHiDisplay';
import { SayHiBeatGame } from './SayHiBeatGame';

export const SayHiAction: ActionComponent = {
    name: '打招呼',
    englishName: 'SAY HI',
    category: 'flexibility',
    targetParts: ['arms', 'shoulders'],
    durationSeconds: 15,
    Guide: (props) => <SayHiGuide {...props} />,
    Beat: {
        bpm: 60,
        pattern: [
            [{ type: 'kick', volume: 0.9 }],
            [],
            [{ type: 'tom', volume: 0.6 }, { type: 'hihat', volume: 0.6 }],
            [],
        ],
    },
    Detector: new SayHiDetector(),
    Display: (props) => <SayHiBeatGame {...props} />,
};
