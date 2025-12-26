/**
 * HIGH KNEES动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { HighKneesBeat } from './beat';

export const HighKneesAction: ActionComponent = {
    name: '高抬腿',
    englishName: 'high_knees',
    category: 'cardio',
    targetParts: ['legs'],
    durationSeconds: 30,
    Guide: (props) => <Guide actionName="high_knees" {...props} />,
    Beat: HighKneesBeat,
    Detector: new GuideBasedDetector('high_knees'),
    Display: () => null,
};
