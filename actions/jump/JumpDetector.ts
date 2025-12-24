/**
 * JUMP动作检测器
 * 检测用户是否完成跳跃动作
 */

import { ActionDetector, DetectionResult } from '../base/ActionBase';

export class JumpDetector implements ActionDetector {
  private baselineY: number = 0;
  private isJumping: boolean = false;
  
  detect(landmarks: any[], previousLandmarks: any[]): DetectionResult {
    if (!landmarks || landmarks.length === 0) {
      return { isCompleted: false, accuracy: 0, confidence: 0 };
    }
    
    // 计算髋部中心Y坐标（使用左右髋部关键点的平均值）
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    
    if (!leftHip || !rightHip) {
      return { isCompleted: false, accuracy: 0, confidence: 0 };
    }
    
    const hipY = (leftHip.y + rightHip.y) / 2;
    
    // 更新基线（使用指数移动平均）
    if (this.baselineY === 0 || hipY > this.baselineY) {
      this.baselineY = this.baselineY * 0.95 + hipY * 0.05;
    }
    
    const jumpThreshold = 0.08; // 跳跃阈值
    const isUp = hipY < (this.baselineY - jumpThreshold);
    
    let completed = false;
    if (isUp && !this.isJumping) {
      this.isJumping = true;
    } else if (!isUp && this.isJumping) {
      this.isJumping = false;
      completed = true;
    }
    
    // 计算准确度（基于跳跃高度）
    const jumpHeight = Math.max(0, (this.baselineY - hipY) / jumpThreshold);
    const accuracy = Math.min(100, jumpHeight * 100);
    
    return {
      isCompleted: completed,
      accuracy,
      confidence: completed ? 0.9 : (isUp ? 0.7 : 0.3)
    };
  }
  
  reset(): void {
    this.baselineY = 0;
    this.isJumping = false;
  }
}


