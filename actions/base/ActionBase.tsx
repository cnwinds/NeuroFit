/**
 * 动作组件基类接口定义
 */

import React from 'react';
import { DetectionResult, ActionCategory, BeatAudioConfig } from './types';
import type { BeatPattern as NewBeatPattern, DrumStep } from '../../beats/types';

/**
 * 引导动画组件的Props
 */
export interface GuideProps {
  onReady: () => void;
}

/**
 * 动作展示组件的Props
 */
export interface DisplayProps {
  landmarks: any[];
  accuracy: number;
  beatStep: number;
}

/**
 * 节拍模式配置（向后兼容）
 * 支持旧格式 pattern: number[] 和新格式 pattern: DrumStep[]
 */
export interface BeatPattern {
  bpm: number;                    // 节拍速度
  pattern: number[] | DrumStep[]; // 节拍模式（支持新旧两种格式）
  audioConfig?: BeatAudioConfig;  // 音效配置（可选，向后兼容）
  timeSignature?: [number, number]; // 拍号（可选）
  swing?: number;                 // 摇摆感（可选）
}

/**
 * 动作检测器接口
 */
export interface ActionDetector {
  detect: (landmarks: any[], previousLandmarks: any[]) => DetectionResult;
  reset: () => void;
}

/**
 * 动作组件接口
 * 每个动作必须实现这4个核心部分
 */
export interface ActionComponent {
  // 动作元数据
  name: string;
  englishName: string;
  category: ActionCategory;
  durationSeconds: number;
  
  // 四个核心组件
  Guide: React.ComponentType<GuideProps>;
  Beat: BeatPattern;
  Detector: ActionDetector;
  Display: React.ComponentType<DisplayProps>;
}

