/**
 * 评分计算服务
 * 根据动作准确度和节拍吻合度计算最终评分
 */

import { ActionScore } from '../actions/base/types';

/**
 * 计算动作评分
 * @param accuracy 动作准确度 (0-100)
 * @param timingOffset 与节拍点的偏差（毫秒）
 * @param beatStep 当前节拍步骤 (0-3)
 * @returns 评分等级
 */
export function calculateScore(
  accuracy: number,
  timingOffset: number,
  beatStep: number
): ActionScore {
  // 节拍偏差转换为分数 (0-100)
  // 理想情况下，动作应该在节拍点完成（beatStep === 0 或 2）
  // 偏差越小，节拍分数越高
  
  const idealBeatSteps = [0, 2]; // DONG 和 DA 是理想的完成节拍点
  const isIdealBeat = idealBeatSteps.includes(beatStep);
  
  // 计算节拍吻合度
  let timingScore = 100;
  if (timingOffset > 0) {
    // 偏差越大，分数越低
    // 100ms内 = 100分，250ms内 = 80分，500ms内 = 60分，超过500ms = 40分
    if (timingOffset <= 100) {
      timingScore = 100;
    } else if (timingOffset <= 250) {
      timingScore = 80;
    } else if (timingOffset <= 500) {
      timingScore = 60;
    } else {
      timingScore = 40;
    }
    
    // 如果不是理想节拍点，降低分数
    if (!isIdealBeat) {
      timingScore *= 0.8;
    }
  }
  
  // 综合评分：准确度占60%，节拍吻合度占40%
  const combinedScore = accuracy * 0.6 + timingScore * 0.4;
  
  // 根据综合分数确定等级
  if (combinedScore >= 85 && accuracy >= 80 && timingScore >= 80) {
    return ActionScore.EXCELLENT;
  } else if (combinedScore >= 70 && accuracy >= 60 && timingScore >= 60) {
    return ActionScore.GOOD;
  } else if (combinedScore >= 50 || accuracy >= 40 || timingScore >= 40) {
    return ActionScore.BAD;
  } else {
    return ActionScore.MISS;
  }
}

/**
 * 获取评分的显示文本
 */
export function getScoreText(score: ActionScore): string {
  switch (score) {
    case ActionScore.EXCELLENT:
      return 'EXCELLENT!';
    case ActionScore.GOOD:
      return 'GOOD!';
    case ActionScore.BAD:
      return 'BAD';
    case ActionScore.MISS:
      return 'MISS';
    default:
      return '';
  }
}

/**
 * 获取评分的颜色
 */
export function getScoreColor(score: ActionScore): string {
  switch (score) {
    case ActionScore.EXCELLENT:
      return 'text-yellow-400';
    case ActionScore.GOOD:
      return 'text-green-400';
    case ActionScore.BAD:
      return 'text-orange-400';
    case ActionScore.MISS:
      return 'text-red-400';
    default:
      return 'text-white';
  }
}



