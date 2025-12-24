/**
 * SAY HI动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { SimpleDetector } from '../base/SimpleDetector';
import { SayHiGuide } from './SayHiGuide';

export const SayHiAction: ActionComponent = {
    name: '打招呼',
    englishName: 'SAY HI',
    category: 'flexibility',
    targetParts: ['arms', 'shoulders'],
    durationSeconds: 15,
    Guide: (props) => <SayHiGuide {...props} />,
    Beat: {
        bpm: 80,
        pattern: [
            { type: 'kick', volume: 0.8 },
            { type: 'hihat', volume: 0.4 },
        ],
    },
    Detector: new SimpleDetector({
        type: 'distance',
        points: [16, 0], // 右手腕 vs 鼻子
        threshold: 0.2,
        direction: 'less'
    }),
    Display: () => null,
};
