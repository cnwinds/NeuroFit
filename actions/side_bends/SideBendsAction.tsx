/**
 * SIDE BENDS动作组件
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';

import { SideBendsBeat } from './beat';
export const SideBendsAction: ActionComponent = {
    name: '侧面拉伸',
    englishName: 'SIDE BENDS',
    category: 'flexibility',
    targetParts: ['core'],
    durationSeconds: 40,
    Guide: (props) => <GenericActionGuide actionName="SIDE BENDS" {...props} />,
    Beat: SideBendsBeat,
    Detector: new SimpleDetector({
        type: 'height',
        points: [15, 23], // 左手腕 vs 左髋
        threshold: 0.1,
        direction: 'greater'
    }),
    Display: () => null,
};
