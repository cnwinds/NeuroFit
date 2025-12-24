/**
 * 动作组件基类接口定义
 */

import React from 'react';
import { DetectionResult, ActionCategory, BeatAudioConfig, BodyPart } from './types';
export type { DetectionResult, ActionCategory, BeatAudioConfig, BodyPart };
import type { BeatPattern as NewBeatPattern, DrumStep } from '../../beats/types';

/**
 * 引导动画组件的Props
 */
export interface GuideProps {
  onReady: () => void;
  landmarks?: any[];
  beatStep: number;
  beatProgress: number; // 0-1 within current step
  bpm: number;
  patternLength: number;
}

/**
 * 动作展示组件的Props
 */
export interface DisplayProps {
  landmarks: any[];
  accuracy: number;
  beatStep: number;
  beatProgress: number; // 0-1 within current step
  bpm: number;
  patternLength: number;
}

/**
 * 节拍模式配置
 * 使用 DrumStep[] 或 DrumStep[][] 定义鼓点序列
 */
export interface BeatPattern {
  bpm: number;                    // 节拍速度
  pattern: DrumStep[] | DrumStep[][]; // 节拍模式 (支持单音轨或多音轨)
  templateId?: string;            // 节拍模板ID (可选，如果使用了节拍编辑器保存的模板)
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
  targetParts: BodyPart[];
  durationSeconds: number;

  // 四个核心组件
  Guide: React.ComponentType<GuideProps>;
  Beat: BeatPattern;
  Detector: ActionDetector;
  Display: React.ComponentType<DisplayProps>;
}

