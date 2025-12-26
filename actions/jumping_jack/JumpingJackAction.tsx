/**
 * JUMPING JACK动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { JumpingJackDetector } from './JumpingJackDetector';

import { JumpingJackBeat } from './beat';
export const JumpingJackAction: ActionComponent = {
    name: '开合跳',
    englishName: 'JUMPING JACK',
    category: 'cardio',
    targetParts: ['full-body'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="JUMPING JACK" {...props} />,
    Beat: JumpingJackBeat,
    Detector: new JumpingJackDetector(),
    Display: () => null,
};
