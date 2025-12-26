/**
 * WALK动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { WalkBeat } from './beat';

export const WalkAction: ActionComponent = {
    name: '行走',
    englishName: 'walk',
    category: 'cardio',
    targetParts: ['legs'],
    durationSeconds: 60,
    Guide: (props) => <Guide actionName="walk" {...props} />,
    Beat: WalkBeat,
    Detector: new GuideBasedDetector('walk'),
    Display: () => null,
};
