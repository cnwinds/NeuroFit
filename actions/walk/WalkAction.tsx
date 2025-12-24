/**
 * WALK动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

export const WalkAction: ActionComponent = {
    name: '行走',
    englishName: 'WALK',
    category: 'cardio',
    targetParts: ['legs'],
    durationSeconds: 60,
    Guide: (props) => <GenericActionGuide actionName="WALK" {...props} />,
    Beat: {
        bpm: 100,
        pattern: [
            { type: 'kick', volume: 0.8 },
            { type: 'hihat', volume: 0.4 },
            { type: 'kick', volume: 0.8 },
            { type: 'hihat', volume: 0.4 },
        ],
    },
    Detector: new SimpleDetector({
        type: 'height',
        points: [25, 23], // 左膝 vs 左髋
        threshold: 0.2,
        direction: 'less'
    }),
    Display: () => null,
};
