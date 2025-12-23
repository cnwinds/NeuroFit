/**
 * 动作注册表
 * 管理所有动作组件的注册、查找和选择
 */

import { ActionComponent } from './ActionBase';

// 动作注册表
const ACTION_REGISTRY: Record<string, ActionComponent> = {};

/**
 * 注册动作组件
 */
export function registerAction(action: ActionComponent): void {
  ACTION_REGISTRY[action.englishName.toUpperCase()] = action;
}

/**
 * 根据英文名称获取动作组件
 */
export function getAction(englishName: string): ActionComponent | null {
  return ACTION_REGISTRY[englishName.toUpperCase()] || null;
}

/**
 * 获取所有已注册的动作
 */
export function getAllActions(): ActionComponent[] {
  return Object.values(ACTION_REGISTRY);
}

/**
 * 随机选择指定数量的动作
 */
export function selectRandomActions(count: number): ActionComponent[] {
  const all = getAllActions();
  if (all.length === 0) return [];
  
  if (count >= all.length) {
    return [...all];
  }
  
  // Fisher-Yates 洗牌算法
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

/**
 * 根据类别获取动作
 */
export function getActionsByCategory(category: string): ActionComponent[] {
  return getAllActions().filter(action => action.category === category);
}

