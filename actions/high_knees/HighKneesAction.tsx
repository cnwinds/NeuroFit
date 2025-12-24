/**
 * HIGH KNEES动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { HighKneesDetector } from './HighKneesDetector';

export const HighKneesAction: ActionComponent = {
    name: '高抬腿',
    englishName: 'HIGH KNEES',
    category: 'cardio',
    targetParts: ['legs'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="HIGH KNEES" {...props} />,
    Beat: {
        bpm: 140,
        pattern: [
            { type: 'kick', volume: 1.0 },
            { type: 'hihat', volume: 0.6 },
            { type: 'kick', volume: 1.0 },
            { type: 'hihat', volume: 0.6 },
        ],
    },
    Detector: new HighKneesDetector(),
    Display: () => null,
};
