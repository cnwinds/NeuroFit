/**
 * 基于Action系统的健身计划生成器
 * 使用已注册的Action组件来组织健身计划
 */

import { WorkoutPlan, Difficulty, Exercise } from '../types';
import { getAllActions, selectRandomActions, getActionsByCategory, ActionComponent } from '../actions';

/**
 * 根据训练重点获取对应的动作类别
 */
function getCategoryFromFocus(focus: string): string[] {
  const focusLower = focus.toLowerCase();
  if (focusLower.includes('核心') || focusLower.includes('腹肌')) {
    return ['strength'];
  }
  if (focusLower.includes('上肢')) {
    return ['strength'];
  }
  if (focusLower.includes('下肢') || focusLower.includes('爆发')) {
    return ['strength', 'cardio'];
  }
  if (focusLower.includes('灵活') || focusLower.includes('体态')) {
    return ['flexibility', 'balance'];
  }
  if (focusLower.includes('有氧') || focusLower.includes('hiit')) {
    return ['cardio', 'strength'];
  }
  // 默认：全身训练
  return ['cardio', 'strength', 'flexibility', 'balance'];
}

/**
 * 根据难度调整动作时长
 */
function adjustDurationByDifficulty(baseDuration: number, difficulty: Difficulty): number {
  const multipliers = {
    [Difficulty.BEGINNER]: 0.8,
    [Difficulty.INTERMEDIATE]: 1.0,
    [Difficulty.ADVANCED]: 1.2,
  };
  return Math.round(baseDuration * multipliers[difficulty]);
}

/**
 * 根据用户状态调整动作选择
 */
function filterActionsByUserState(actions: ActionComponent[], userState: string): ActionComponent[] {
  if (!userState || userState.trim() === '') {
    return actions;
  }
  
  const stateLower = userState.toLowerCase();
  
  // 如果用户状态包含"僵硬"、"疲劳"等，优先选择灵活性动作
  if (stateLower.includes('僵硬') || stateLower.includes('疲劳') || stateLower.includes('久坐')) {
    return actions.filter(action => 
      action.category === 'flexibility' || action.category === 'balance'
    ).length > 0 
      ? actions.filter(action => action.category === 'flexibility' || action.category === 'balance')
      : actions; // 如果没有灵活性动作，返回所有动作
  }
  
  // 如果用户状态包含"精力充沛"等，优先选择高强度动作
  if (stateLower.includes('精力') || stateLower.includes('充沛')) {
    return actions.filter(action => 
      action.category === 'cardio' || action.category === 'strength'
    ).length > 0
      ? actions.filter(action => action.category === 'cardio' || action.category === 'strength')
      : actions;
  }
  
  return actions;
}

/**
 * 将ActionComponent转换为Exercise
 */
function actionToExercise(action: ActionComponent, difficulty: Difficulty): Exercise {
  const duration = adjustDurationByDifficulty(action.durationSeconds, difficulty);
  
  // 生成描述和科学益处
  const descriptions: Record<string, string> = {
    'cardio': '提升心肺功能，增强心血管健康，燃烧卡路里。',
    'strength': '增强肌肉力量，提高基础代谢率，改善身体机能。',
    'flexibility': '增加关节活动范围，缓解肌肉紧张，改善体态。',
    'balance': '提高身体协调性，增强核心稳定性，预防跌倒。',
  };
  
  const benefits: Record<string, string> = {
    'cardio': '有氧运动能够提高心率，促进血液循环，增强心肺耐力，有助于长期健康。',
    'strength': '力量训练能够刺激肌肉生长，提高骨密度，增强身体机能和代谢效率。',
    'flexibility': '柔韧性训练能够改善关节活动度，缓解肌肉僵硬，预防运动损伤。',
    'balance': '平衡训练能够激活深层稳定肌群，提高神经肌肉协调性，改善身体控制能力。',
  };
  
  return {
    name: `${action.name} (${action.englishName})`, // 格式：中文名 (英文名)，便于Player识别
    durationSeconds: duration,
    description: `${action.name}动作，${descriptions[action.category] || '全面激活身体机能。'}`,
    scientificBenefit: benefits[action.category] || '科学设计的动作，全面激活身体机能。',
    category: action.category,
  };
}

/**
 * 基于Action系统生成健身计划
 */
export function generateWorkoutPlanFromActions(
  focusArea: string,
  durationMinutes: number,
  difficulty: Difficulty,
  userState: string = ''
): WorkoutPlan {
  const allActions = getAllActions();
  
  if (allActions.length === 0) {
    // 如果没有注册的动作，返回一个默认计划
    return {
      title: '暂无可用动作',
      overview: '请先注册动作组件',
      exercises: [],
      totalDurationMinutes: 0,
      isDemo: false,
    };
  }
  
  // 根据训练重点获取类别
  const targetCategories = getCategoryFromFocus(focusArea);
  
  // 从目标类别中选择动作
  let selectedActions: ActionComponent[] = [];
  for (const category of targetCategories) {
    const categoryActions = getActionsByCategory(category);
    selectedActions = [...selectedActions, ...categoryActions];
  }
  
  // 如果没有找到特定类别的动作，使用所有动作
  if (selectedActions.length === 0) {
    selectedActions = allActions;
  }
  
  // 根据用户状态过滤动作
  selectedActions = filterActionsByUserState(selectedActions, userState);
  
  // 去重（基于englishName）
  const uniqueActions = Array.from(
    new Map(selectedActions.map(action => [action.englishName, action])).values()
  );
  
  // 计算需要的动作数量
  // 假设每个动作平均30秒，加上一些缓冲
  const avgDurationPerAction = 30; // 秒
  const targetDurationSeconds = durationMinutes * 60;
  const estimatedActionCount = Math.ceil(targetDurationSeconds / avgDurationPerAction);
  
  // 选择动作（如果需要的数量超过可用数量，则重复使用）
  let finalActions: ActionComponent[] = [];
  if (estimatedActionCount <= uniqueActions.length) {
    // 随机选择指定数量的动作
    finalActions = selectRandomActions(estimatedActionCount);
  } else {
    // 如果需要的数量超过可用数量，先使用所有动作，然后随机补充
    finalActions = [...uniqueActions];
    const remaining = estimatedActionCount - uniqueActions.length;
    for (let i = 0; i < remaining; i++) {
      const randomAction = uniqueActions[Math.floor(Math.random() * uniqueActions.length)];
      finalActions.push(randomAction);
    }
  }
  
  // 转换为Exercise数组
  const exercises = finalActions.map(action => actionToExercise(action, difficulty));
  
  // 计算总时长
  const totalDurationSeconds = exercises.reduce((sum, ex) => sum + ex.durationSeconds, 0);
  const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
  
  // 生成标题和概述
  const categoryNames: Record<string, string> = {
    'cardio': '有氧',
    'strength': '力量',
    'flexibility': '柔韧',
    'balance': '平衡',
  };
  
  const categoryList = [...new Set(exercises.map(ex => categoryNames[ex.category] || ex.category))].join('、');
  
  return {
    title: `${focusArea}训练计划`,
    overview: `基于动作系统的${categoryList}训练，包含${exercises.length}个动作，总时长约${totalDurationMinutes}分钟。`,
    exercises,
    totalDurationMinutes,
    isDemo: false,
  };
}

