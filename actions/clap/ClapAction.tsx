/**
 * CLAP动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { ClapBeat } from './beat';

export const ClapAction: ActionComponent = {
    name: '鼓掌',
    englishName: 'clap',
    category: 'cardio',
    targetParts: ['arms'],
    durationSeconds: 20,
    Guide: (props) => <Guide actionName="clap" {...props} />,
    Beat: ClapBeat,
    Detector: new GuideBasedDetector('clap'),
    Display: () => null,
};
