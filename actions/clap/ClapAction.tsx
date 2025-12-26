/**
 * CLAP动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

import { ClapBeat } from './beat';
export const ClapAction: ActionComponent = {
    name: '鼓掌',
    englishName: 'CLAP',
    category: 'cardio',
    targetParts: ['arms'],
    durationSeconds: 20,
    Guide: (props) => <GenericActionGuide actionName="CLAP" {...props} />,
    Beat: ClapBeat,
    Detector: new SimpleDetector({
        type: 'distance',
        points: [15, 16],
        threshold: 0.1,
        direction: 'less'
    }),
    Display: () => null,
};
