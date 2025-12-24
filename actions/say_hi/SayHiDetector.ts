import { ActionDetector } from '../base/ActionBase';
import { DetectionResult } from '../base/types';

/**
 * SayHiDetector
 * 检测用户是否完成了"打招呼" (Say Hi) 的动作。
 * 
 * 核心逻辑：
 * 1. 监测右手腕 (Right Wrist, 16) 与 右肩 (Right Shoulder, 12) 或 鼻子 (0) 的相对位置。
 * 2. 状态机：
 *    - IDLE: 手放下 (低于肩部)
 *    - UP: 手举起 (高于鼻子)
 * 3. 当从 IDLE -> UP 状态转换时，视为一次有效的 "Say Hi" (或举手示意)。
 */
export class SayHiDetector implements ActionDetector {
    private state: 'IDLE' | 'UP' = 'IDLE';
    private lastTransitionTime: number = 0;

    reset() {
        this.state = 'IDLE';
        this.lastTransitionTime = 0;
    }

    detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) {
            return {
                accuracy: 0,
                isCompleted: false,
                feedback: '未检测到人体'
            };
        }

        // 关键点索引 (MediaPipe Pose)
        // 0: Nose
        // 12: Right Shoulder
        // 16: Right Wrist
        // MediaPipe坐标系: y 向下增加 (0在顶部, 1在底部)

        const nose = landmarks[0];
        const rightShoulder = landmarks[12];
        const rightWrist = landmarks[16];

        // 基础准确度计算：手腕越高，准确度越高
        // 假设手腕在肩膀以下是0分，在肩膀位置是0.5分，在头顶(鼻子以上)是1.0分
        let accuracy = 0;
        if (rightWrist && rightShoulder && nose) {
            const shoulderY = rightShoulder.y;
            const noseY = nose.y;
            const wristY = rightWrist.y;

            if (wristY > shoulderY) {
                // 手在肩膀以下
                accuracy = 0.1;
            } else if (wristY > noseY) {
                // 手在肩膀和鼻子之间
                accuracy = 0.5 + 0.5 * ((shoulderY - wristY) / (shoulderY - noseY));
            } else {
                // 手在鼻子以上 (High Five / Hi position)
                accuracy = 0.9 + 0.1 * Math.min(1, (noseY - wristY) / 0.2); // 稍微溢出一点也算满分
            }
        }

        accuracy = Math.min(1, Math.max(0, accuracy));

        // 状态机判定
        let isCompleted = false;
        const now = Date.now();
        const COOLDOWN = 1000; // 动作冷却时间，防止抖动重复触发

        if (rightWrist && nose && rightShoulder) {
            // 判定阈值
            const isHandUp = rightWrist.y < nose.y; // 手腕高于鼻子
            const isHandDown = rightWrist.y > rightShoulder.y; // 手腕低于肩膀

            if (this.state === 'IDLE') {
                if (isHandUp) {
                    // 只有当经过冷却时间后，才允许触发
                    if (now - this.lastTransitionTime > COOLDOWN) {
                        this.state = 'UP';
                        isCompleted = true; // 动作完成！
                        this.lastTransitionTime = now;
                    }
                }
            } else if (this.state === 'UP') {
                if (isHandDown) {
                    this.state = 'IDLE';
                }
            }
        }

        return {
            accuracy,
            isCompleted,
            feedback: isCompleted ? 'SAY HI!' : (this.state === 'UP' ? '放下手臂...' : '举起右手打招呼!')
        };
    }
}
