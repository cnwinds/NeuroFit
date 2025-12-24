/**
 * JUMPING JACK动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { JumpingJackDetector } from './JumpingJackDetector';

export const JumpingJackAction: ActionComponent = {
    name: '开合跳',
    englishName: 'JUMPING JACK',
    category: 'cardio',
    targetParts: ['full-body'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="JUMPING JACK" {...props} />,
    Beat: {
        bpm: 130,
        pattern: [
            { type: 'kick', volume: 1.0 },
            { type: 'hihat', volume: 0.6 },
            { type: 'snare', volume: 0.8 },
            { type: 'hihat', volume: 0.6 },
        ],
    },
    Detector: new JumpingJackDetector(),
    Display: () => null,
};
