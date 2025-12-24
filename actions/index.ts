/**
 * 动作系统入口文件
 * 注册所有动作组件
 */

import { registerAction } from './base/ActionRegistry';
import { JumpAction } from './jump/JumpAction';

// 注册所有动作
registerAction(JumpAction);

// 导出注册表相关函数
export { getAction, getAllActions, selectRandomActions, getActionsByCategory } from './base/ActionRegistry';
export type { ActionComponent } from './base/ActionBase';
export { ActionScore } from './base/types';


