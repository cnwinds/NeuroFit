/**
 * HIGH KNEES动作检测器
 */

import { ActionDetector, DetectionResult } from '../base/ActionBase';

export class HighKneesDetector implements ActionDetector {
    private lastLegUp: 'left' | 'right' | null = null;
    private count: number = 0;

    detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        // 关键点：25 (左膝), 26 (右膝), 23 (左髋), 24 (右髋)
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (!leftKnee || !rightKnee || !leftHip || !rightHip) {
            return { isCompleted: false, accuracy: 0, confidence: 0 };
        }

        // 判断膝盖是否抬起到髋部高度
        const isLeftUp = leftKnee.y < leftHip.y + 0.05;
        const isRightUp = rightKnee.y < rightHip.y + 0.05;

        let completed = false;
        if (isLeftUp && this.lastLegUp !== 'left') {
            this.lastLegUp = 'left';
            this.count++;
            if (this.count >= 2) { // 左右各一次算一个完整循环
                this.count = 0;
                completed = true;
            }
        } else if (isRightUp && this.lastLegUp !== 'right') {
            this.lastLegUp = 'right';
            this.count++;
            if (this.count >= 2) {
                this.count = 0;
                completed = true;
            }
        }

        return {
            isCompleted: completed,
            accuracy: (isLeftUp || isRightUp) ? 95 : 20,
            confidence: (isLeftUp || isRightUp) ? 0.9 : 0.3
        };
    }

    reset(): void {
        this.lastLegUp = null;
        this.count = 0;
    }
}
