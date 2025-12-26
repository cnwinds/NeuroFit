import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { SquatBeat } from './beat';

export const SquatAction: ActionComponent = {
    name: '深蹲',
    englishName: 'squat',
    category: 'strength',
    targetParts: ['legs'],
    durationSeconds: 45,
    Guide: (props) => <Guide actionName="squat" {...props} />,
    Beat: SquatBeat,
    Detector: new GuideBasedDetector('squat'),
    Display: () => null,
};
