/**
 * 节拍工具函数
 * 用于从 localStorage 加载保存的节拍模式并在 action 中使用
 */

import { BeatPattern } from './ActionBase';
import { SavedBeatPattern } from '../../beats/types';

/**
 * 将 SavedBeatPattern 转换为 BeatPattern
 */
export function convertSavedPatternToBeatPattern(saved: SavedBeatPattern): BeatPattern {
  return {
    bpm: saved.bpm,
    pattern: saved.pattern,
    timeSignature: saved.timeSignature,
    swing: saved.swing,
    templateId: saved.id, // 可选：保存模板ID以便追踪来源
  };
}

/**
 * 从 localStorage 加载节拍模式（通过名称）
 * @param patternName 节拍模式的名称
 * @returns BeatPattern 或 null（如果未找到）
 */
export function loadBeatPatternByName(patternName: string): BeatPattern | null {
  try {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      return null;
    }

    const patterns: SavedBeatPattern[] = JSON.parse(saved);
    const found = patterns.find(p => p.name === patternName);

    if (!found) {
      console.warn(`未找到名为 "${patternName}" 的节拍模式`);
      return null;
    }

    return convertSavedPatternToBeatPattern(found);
  } catch (e) {
    console.error('加载节拍模式失败:', e);
    return null;
  }
}

/**
 * 从 localStorage 加载节拍模式（通过ID）
 * @param patternId 节拍模式的ID
 * @returns BeatPattern 或 null（如果未找到）
 */
export function loadBeatPatternById(patternId: string): BeatPattern | null {
  try {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      return null;
    }

    const patterns: SavedBeatPattern[] = JSON.parse(saved);
    const found = patterns.find(p => p.id === patternId);

    if (!found) {
      console.warn(`未找到ID为 "${patternId}" 的节拍模式`);
      return null;
    }

    return convertSavedPatternToBeatPattern(found);
  } catch (e) {
    console.error('加载节拍模式失败:', e);
    return null;
  }
}

/**
 * 从 localStorage 加载最新的节拍模式
 * @returns BeatPattern 或 null（如果没有保存的模式）
 */
export function loadLatestBeatPattern(): BeatPattern | null {
  try {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      return null;
    }

    const patterns: SavedBeatPattern[] = JSON.parse(saved);
    if (patterns.length === 0) {
      return null;
    }

    // 返回最新的模式（按创建时间排序）
    const latest = patterns.sort((a, b) => b.createdAt - a.createdAt)[0];
    return convertSavedPatternToBeatPattern(latest);
  } catch (e) {
    console.error('加载节拍模式失败:', e);
    return null;
  }
}

/**
 * 获取所有保存的节拍模式名称列表
 * @returns 节拍模式名称数组
 */
export function getSavedBeatPatternNames(): string[] {
  try {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      return [];
    }

    const patterns: SavedBeatPattern[] = JSON.parse(saved);
    return patterns.map(p => p.name);
  } catch (e) {
    console.error('获取节拍模式列表失败:', e);
    return [];
  }
}

/**
 * 获取默认节拍模式（如果加载失败时使用）
 * @param bpm 默认BPM
 * @returns 默认的 BeatPattern
 */
export function getDefaultBeatPattern(bpm: number = 120): BeatPattern {
  return {
    bpm,
    pattern: [
      { type: 'kick', volume: 1.0 },
      { type: 'hihat', volume: 0.6 },
      { type: 'snare', volume: 0.8 },
      { type: 'hihat', volume: 0.6 },
    ],
  };
}


