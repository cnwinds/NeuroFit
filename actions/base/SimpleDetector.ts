/**
 * 通用的简单动作检测器
 * 基于基本的移动或关键点关系进行检测
 */

import { ActionDetector, DetectionResult } from '../base/ActionBase';

export interface SimpleDetectorConfig {
    type: 'distance' | 'height' | 'movement';
    points: [number, number]; // 关键点索引
    threshold: number;
    direction: 'greater' | 'less';
    consecutiveFrames?: number;
}

export class SimpleDetector implements ActionDetector {
    private state: boolean = false;
    private count: number = 0;
    private config: SimpleDetectorConfig;

    constructor(config: SimpleDetectorConfig) {
        this.config = config;
    }

    detect(landmarks: any[]): DetectionResult {
        if (!landmarks || landmarks.length === 0) return { isCompleted: false, accuracy: 0, confidence: 0 };

        const p1 = landmarks[this.config.points[0]];
        const p2 = landmarks[this.config.points[1]];

        if (!p1 || !p2) return { isCompleted: false, accuracy: 0, confidence: 0 };

        let value = 0;
        if (this.config.type === 'distance') {
            value = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        } else if (this.config.type === 'height') {
            value = p1.y - p2.y;
        }

        const isTriggered = this.config.direction === 'less' ? value < this.config.threshold : value > this.config.threshold;

        let completed = false;
        if (isTriggered && !this.state) {
            this.state = true;
        } else if (!isTriggered && this.state) {
            this.state = false;
            completed = true;
        }

        return {
            isCompleted: completed,
            accuracy: completed ? 90 : 0,
            confidence: isTriggered ? 0.8 : 0.2
        };
    }

    reset(): void {
        this.state = false;
        this.count = 0;
    }
}
