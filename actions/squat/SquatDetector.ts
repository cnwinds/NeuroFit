/**
 * SQUAT动作检测器
 * 检测用户是否完成深蹲动作
 */

import { ActionDetector } from '../base/ActionBase';
import { DetectionResult } from '../base/types';

export class SquatDetector implements ActionDetector {
    private baselineY: number = 0;
    private isSquatting: boolean = false;
    private maxDepth: number = 0;
    private lastTransitionTime: number = 0;

    detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) {
            return { isCompleted: false, accuracy: 0, feedback: '未检测到人体' };
        }

        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];

        if (!leftHip || !rightHip) {
            return { isCompleted: false, accuracy: 0, feedback: '请确保全身在画面内' };
        }

        const hipY = (leftHip.y + rightHip.y) / 2;

        // 更新基线（站立状态）
        if (this.baselineY === 0) {
            this.baselineY = hipY;
        } else if (!this.isSquatting && hipY < this.baselineY) {
            // 追踪最高的臀部位置作为站立基线
            this.baselineY = this.baselineY * 0.9 + hipY * 0.1;
        }

        const squatThreshold = 0.12; // 下蹲深度阈值
        const isDown = hipY > (this.baselineY + squatThreshold);

        let completed = false;
        const now = Date.now();
        const COOLDOWN = 1200;

        if (isDown && !this.isSquatting) {
            this.isSquatting = true;
            this.maxDepth = hipY;
        } else if (this.isSquatting) {
            if (hipY > this.maxDepth) this.maxDepth = hipY;

            // 检测是否回到基线附近
            if (hipY < (this.baselineY + squatThreshold * 0.5)) {
                if (now - this.lastTransitionTime > COOLDOWN) {
                    this.isSquatting = false;
                    completed = true;
                    this.lastTransitionTime = now;
                } else {
                    this.isSquatting = false; // 即使在CD内也重置状态，但不计入完成
                }
            }
        }

        // 计算准确度（基于下蹲深度相对于基线的比例）
        const depthRatio = Math.max(0, (this.maxDepth - this.baselineY) / (squatThreshold * 1.5));
        const accuracy = Math.min(1, depthRatio);

        let feedback = '向下蹲...';
        if (completed) feedback = '太棒了!';
        else if (this.isSquatting) feedback = '现在站起来!';
        else if (hipY > this.baselineY + squatThreshold * 0.5) feedback = '再蹲深一点...';

        return {
            isCompleted: completed,
            accuracy: completed ? accuracy : accuracy * 0.5,
            feedback
        };
    }

    reset(): void {
        this.baselineY = 0;
        this.isSquatting = false;
        this.maxDepth = 0;
    }
}
