/**
 * 动作系统入口文件
 * 注册所有动作组件
 */

import { registerAction } from './base/ActionRegistry';
import { JumpAction } from './jump/JumpAction';
import { SquatAction } from './squat/SquatAction';
import { JumpingJackAction } from './jumping_jack/JumpingJackAction';
import { HighKneesAction } from './high_knees/HighKneesAction';
import { SayHiAction } from './say_hi/SayHiAction';
import { ClapAction } from './clap/ClapAction';
import { SideBendsAction } from './side_bends/SideBendsAction';
import { WalkAction } from './walk/WalkAction';
import { SwingAction } from './swing/SwingAction';

// 注册所有动作
registerAction(JumpAction);
registerAction(SquatAction);
registerAction(JumpingJackAction);
registerAction(HighKneesAction);
registerAction(SayHiAction);
registerAction(ClapAction);
registerAction(SideBendsAction);
registerAction(WalkAction);
registerAction(SwingAction);

// 导出注册表相关函数
export { getAction, getAllActions, selectRandomActions, getActionsByCategory } from './base/ActionRegistry';
export type { ActionComponent } from './base/ActionBase';
export { ActionScore } from './base/types';



