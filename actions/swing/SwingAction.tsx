/**
 * SWING动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { SwingBeat } from './beat';

export const SwingAction: ActionComponent = {
    name: '摆动',
    englishName: 'swing',
    category: 'cardio',
    targetParts: ['arms', 'core'],
    durationSeconds: 30,
    Guide: (props) => <Guide actionName="swing" {...props} />,
    Beat: SwingBeat,
    Detector: new GuideBasedDetector('swing'),
    Display: () => null,
};
