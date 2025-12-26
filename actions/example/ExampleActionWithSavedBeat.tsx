/**
 * 示例：如何在 Action 中使用保存的节拍模式
 * 
 * 这个文件展示了三种使用保存节拍模式的方法：
 * 1. 通过名称加载
 * 2. 通过ID加载
 * 3. 加载最新的节拍模式（带降级处理）
 */

import React from 'react';
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';
import {
  loadBeatPatternByName,
  loadBeatPatternById,
  loadLatestBeatPattern,
  getDefaultBeatPattern,
} from '../base/beatUtils';

// ============================================
// 方法1: 通过名称加载节拍模式
// ============================================
export const ExampleActionWithNamedBeat: ActionComponent = {
  name: '示例动作（使用命名节拍）',
  englishName: 'EXAMPLE_NAMED',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 30,
  Guide: (props) => <GenericActionGuide actionName="EXAMPLE_NAMED" {...props} />,
  
  // 从 localStorage 加载名为 "beat1" 的节拍模式
  // 如果未找到，使用默认节拍
  Beat: loadBeatPatternByName('beat1') || getDefaultBeatPattern(120),
  
  Detector: new SimpleDetector({
    type: 'height',
    points: [25, 23],
    threshold: 0.2,
    direction: 'less'
  }),
  Display: () => null,
};

// ============================================
// 方法2: 通过ID加载节拍模式
// ============================================
export const ExampleActionWithIdBeat: ActionComponent = {
  name: '示例动作（使用ID节拍）',
  englishName: 'EXAMPLE_ID',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 30,
  Guide: (props) => <GenericActionGuide actionName="EXAMPLE_ID" {...props} />,
  
  // 从 localStorage 加载指定ID的节拍模式
  // 如果未找到，使用默认节拍
  Beat: loadBeatPatternById('pattern-1234567890') || getDefaultBeatPattern(120),
  
  Detector: new SimpleDetector({
    type: 'height',
    points: [25, 23],
    threshold: 0.2,
    direction: 'less'
  }),
  Display: () => null,
};

// ============================================
// 方法3: 加载最新的节拍模式（推荐）
// ============================================
export const ExampleActionWithLatestBeat: ActionComponent = {
  name: '示例动作（使用最新节拍）',
  englishName: 'EXAMPLE_LATEST',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 30,
  Guide: (props) => <GenericActionGuide actionName="EXAMPLE_LATEST" {...props} />,
  
  // 加载最新保存的节拍模式，如果失败则使用默认节拍
  Beat: loadLatestBeatPattern() || getDefaultBeatPattern(120),
  
  Detector: new SimpleDetector({
    type: 'height',
    points: [25, 23],
    threshold: 0.2,
    direction: 'less'
  }),
  Display: () => null,
};

// ============================================
// 方法4: 运行时动态加载（更灵活）
// ============================================
// 如果你需要在运行时根据条件选择不同的节拍模式，
// 可以创建一个函数来返回 ActionComponent：

export function createActionWithDynamicBeat(
  patternName?: string,
  fallbackBpm: number = 120
): ActionComponent {
  // 如果提供了名称，尝试加载；否则加载最新的
  const beatPattern = patternName
    ? loadBeatPatternByName(patternName)
    : loadLatestBeatPattern();
  
  return {
    name: '动态节拍动作',
    englishName: 'DYNAMIC_BEAT',
    category: 'cardio',
    targetParts: ['full-body'],
    durationSeconds: 30,
    Guide: (props) => <GenericActionGuide actionName="DYNAMIC_BEAT" {...props} />,
    Beat: beatPattern || getDefaultBeatPattern(fallbackBpm),
    Detector: new SimpleDetector({
      type: 'height',
      points: [25, 23],
      threshold: 0.2,
      direction: 'less'
    }),
    Display: () => null,
  };
}

// 使用示例：
// const myAction = createActionWithDynamicBeat('beat1', 120);
// 或者
// const myAction = createActionWithDynamicBeat(); // 使用最新的节拍模式


