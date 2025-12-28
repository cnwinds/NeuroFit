/**
 * 动作系统基础类型定义
 */

export enum ActionScore {
  MISS = 'MISS',
  BAD = 'BAD',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

export interface DetectionResult {
  isCompleted: boolean;
  accuracy: number;  // 0-1
  confidence?: number; // 0-1
  feedback?: string; // Optional feedback message
}

export interface ActionCompletion {
  score: ActionScore;
  accuracy: number; // 0-100
  timingAccuracy: number; // 0-100 (节拍吻合度)
  timestamp: number;
}

// 从 beats 模块导入节拍相关类型
export type { BeatAudioConfig, BeatPattern, DrumStep, DrumType } from '../../beats/types';

export type BodyPart = 'arms' | 'legs' | 'core' | 'full-body' | 'shoulders' | 'back' | 'chest' | 'neck';

export type ActionCategory = 'cardio' | 'strength' | 'flexibility' | 'balance';

export interface GuideData {
  totalBeats: number;
  framesPerBeat: number;
  frames: number[][][];
  bpm: number;
  markedFrameIndices: number[];
  isLoop?: boolean; // 是否为循环动画
}

