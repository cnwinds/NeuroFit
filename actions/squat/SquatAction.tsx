import { ActionComponent } from '../base/ActionBase';
import { SquatGuide } from './SquatGuide';
import { SquatDetector } from './SquatDetector';

import { SquatBeat } from './beat';
export const SquatAction: ActionComponent = {
    name: '深蹲',
    englishName: 'SQUAT',
    category: 'strength',
    targetParts: ['legs'],
    durationSeconds: 45,
    Guide: (props) => <SquatGuide {...props} />,
    Beat: SquatBeat,
    Detector: new SquatDetector(),
    Display: () => null,
};
