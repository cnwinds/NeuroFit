/**
 * JUMPING JACK动作检测器
 */

import { ActionDetector, DetectionResult } from '../base/ActionBase';

export class JumpingJackDetector implements ActionDetector {
    private isArmsUp: boolean = false;

    detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        // 关键点：15 (左手腕), 16 (右手腕), 0 (鼻尖)
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        const nose = landmarks[0];

        if (!leftWrist || !rightWrist || !nose) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        // 检测手腕是否高于鼻部
        const areArmsUp = leftWrist.y < nose.y && rightWrist.y < nose.y;

        let completed = false;
        if (areArmsUp && !this.isArmsUp) {
            this.isArmsUp = true;
        } else if (!areArmsUp && this.isArmsUp) {
            this.isArmsUp = false;
            completed = true;
        }

        return {
            isCompleted: completed,
            accuracy: 90, // 开合跳检测相对简单，给予固定较高准确度
            confidence: areArmsUp ? 0.8 : 0.4
        };
    }

    reset(): void {
        this.isArmsUp = false;
    }
}
