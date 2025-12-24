/**
 * CLAP动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

export const ClapAction: ActionComponent = {
    name: '鼓掌',
    englishName: 'CLAP',
    category: 'cardio',
    targetParts: ['arms'],
    durationSeconds: 20,
    Guide: (props) => <GenericActionGuide actionName="CLAP" {...props} />,
    Beat: {
        bpm: 100,
        pattern: [
            { type: 'kick', volume: 0.8 },
            { type: 'snare', volume: 0.7 },
        ],
    },
    Detector: new SimpleDetector({
        type: 'distance',
        points: [15, 16],
        threshold: 0.1,
        direction: 'less'
    }),
    Display: () => null,
};
