/**
 * JUMP动作的实时展示组件
 * 可选组件，用于自定义动作的可视化展示
 */

import React from 'react';
import { DisplayProps } from '../base/ActionBase';

export const JumpDisplay: React.FC<DisplayProps> = ({ landmarks, accuracy, beatStep }) => {
  // 默认使用通用的骨架显示，这里可以添加JUMP特定的可视化效果
  // 例如：显示跳跃高度、准确度指示器等
  
  return null; // 返回null表示使用默认的骨架显示
};

