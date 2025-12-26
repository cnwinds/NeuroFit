/**
 * SIDE BENDS动作组件
 */

import { ActionComponent } from '../base/ActionBase';
import { Guide } from '../../components/Guide';
import { GuideBasedDetector } from '../base/GuideBasedDetector';

import { SideBendsBeat } from './beat';

export const SideBendsAction: ActionComponent = {
    name: '侧面拉伸',
    englishName: 'side_bends',
    category: 'flexibility',
    targetParts: ['core'],
    durationSeconds: 40,
    Guide: (props) => <Guide actionName="side_bends" {...props} />,
    Beat: SideBendsBeat,
    Detector: new GuideBasedDetector('side_bends'),
    Display: () => null,
};
