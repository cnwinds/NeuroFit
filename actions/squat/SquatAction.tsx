import { ActionComponent } from '../base/ActionBase';
import { SquatGuide } from './SquatGuide';
import { SquatDetector } from './SquatDetector';

export const SquatAction: ActionComponent = {
    name: '深蹲',
    englishName: 'SQUAT',
    category: 'strength',
    targetParts: ['legs'],
    durationSeconds: 45,
    Guide: (props) => <SquatGuide {...props} />,
    Beat: {
        bpm: 80,
        pattern: [
            { type: 'kick', volume: 1.0 },
            { type: 'snare', volume: 0.8 },
        ],
    },
    Detector: new SquatDetector(),
    Display: () => null,
};
