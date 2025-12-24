/**
 * SQUAT动作检测器
 * 检测用户是否完成深蹲动作
 */

import { ActionDetector, DetectionResult } from '../base/ActionBase';

export class SquatDetector implements ActionDetector {
    private baselineY: number = 0;
    private isSquatting: boolean = false;
    private maxDepth: number = 0;

    detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        // 计算髋部中心Y坐标
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (!leftHip || !rightHip) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        const hipY = (leftHip.y + rightHip.y) / 2;

        // 更新基线（初始或站立状态）
        if (this.baselineY === 0) {
            this.baselineY = hipY;
        } else if (!this.isSquatting && hipY < this.baselineY) {
            // 如果用户站得更高了，更新基线
            this.baselineY = this.baselineY * 0.9 + hipY * 0.1;
        }

        const squatThreshold = 0.15; // 下蹲阈值
        const isDown = hipY > (this.baselineY + squatThreshold);

        let completed = false;
        if (isDown && !this.isSquatting) {
            this.isSquatting = true;
            this.maxDepth = hipY;
        } else if (this.isSquatting) {
            if (hipY > this.maxDepth) this.maxDepth = hipY;

            // 检测是否回到基线附近
            if (hipY < (this.baselineY + squatThreshold * 0.4)) {
                this.isSquatting = false;
                completed = true;
            }
        }

        // 计算准确度（基于下蹲深度）
        const depth = Math.max(0, (this.maxDepth - this.baselineY) / squatThreshold);
        const accuracy = Math.min(100, depth * 100);

        return {
            isCompleted: completed,
            accuracy: completed ? accuracy : 0,
            confidence: completed ? 0.9 : (this.isSquatting ? 0.8 : 0.2)
        };
    }

    reset(): void {
        this.baselineY = 0;
        this.isSquatting = false;
        this.maxDepth = 0;
    }
}
