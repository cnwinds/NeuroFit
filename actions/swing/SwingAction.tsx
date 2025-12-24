/**
 * SWING动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

export const SwingAction: ActionComponent = {
    name: '摆动',
    englishName: 'SWING',
    category: 'cardio',
    targetParts: ['arms', 'core'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="SWING" {...props} />,
    Beat: {
        bpm: 110,
        pattern: [
            { type: 'kick', volume: 0.8 },
            { type: 'hihat', volume: 0.4 },
            { type: 'snare', volume: 0.7 },
            { type: 'hihat', volume: 0.4 },
        ],
    },
    Detector: new SimpleDetector({
        type: 'distance',
        points: [15, 23], // 左手腕 vs 左髋
        threshold: 0.3,
        direction: 'greater'
    }),
    Display: () => null,
};
