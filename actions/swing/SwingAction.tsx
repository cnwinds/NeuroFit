/**
 * SWING动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

import { SwingBeat } from './beat';
export const SwingAction: ActionComponent = {
    name: '摆动',
    englishName: 'SWING',
    category: 'cardio',
    targetParts: ['arms', 'core'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="SWING" {...props} />,
    Beat: SwingBeat,
    Detector: new SimpleDetector({
        type: 'distance',
        points: [15, 23], // 左手腕 vs 左髋
        threshold: 0.3,
        direction: 'greater'
    }),
    Display: () => null,
};
