import { ActionDetector, GuideProps } from './ActionBase';
import { DetectionResult } from './types';
import { loadGuideData } from './guideLoader';
import type { GuideData } from './types';

export class GuideBasedDetector implements ActionDetector {
  private guideData: GuideData | null = null;
  private loadingPromise: Promise<GuideData | null> | null = null;
  private lastCompletedBeat = -1;
  private similarityHistory: number[] = [];
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly COMPLETION_THRESHOLD = 0.85;
  private readonly HISTORY_SIZE = 10;

  constructor(private actionName: string) {
    this.loadGuide();
  }

  async loadGuide() {
    if (!this.loadingPromise) {
      this.loadingPromise = loadGuideData(this.actionName);
      this.guideData = await this.loadingPromise;
    }
  }

  private calculateSimilarity(userLandmarks: any[], guideLandmarks: any[]): number {
    if (!userLandmarks || !guideLandmarks || userLandmarks.length === 0 || guideLandmarks.length === 0) {
      return 0;
    }

    const keyPoints = [
      11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28
    ];

    let totalDistance = 0;
    let validPoints = 0;

    for (const idx of keyPoints) {
      const user = userLandmarks[idx];
      const guide = guideLandmarks[idx];

      if (user && guide && user.visibility && user.visibility > 0.5) {
        const dx = user.x - guide.x;
        const dy = user.y - guide.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalDistance += distance;
        validPoints++;
      }
    }

    if (validPoints === 0) return 0;

    const avgDistance = totalDistance / validPoints;
    const similarity = Math.max(0, 1 - avgDistance * 3);
    return similarity;
  }

  private getCurrentGuideFrame(beatStep: number, beatProgress: number): any[] | null {
    if (!this.guideData || this.guideData.frames.length === 0) return null;

    const totalFrames = this.guideData.frames.length;
    const frameIndex = Math.floor((beatStep + beatProgress) * this.guideData.framesPerBeat) % totalFrames;
    return this.guideData.frames[frameIndex];
  }

  private updateSimilarityHistory(similarity: number) {
    this.similarityHistory.push(similarity);
    if (this.similarityHistory.length > this.HISTORY_SIZE) {
      this.similarityHistory.shift();
    }
  }

  private getAverageSimilarity(): number {
    if (this.similarityHistory.length === 0) return 0;
    const sum = this.similarityHistory.reduce((a, b) => a + b, 0);
    return sum / this.similarityHistory.length;
  }

  private isInKeyFrame(beatStep: number, beatProgress: number): boolean {
    if (!this.guideData) return false;

    const beatIndex = Math.floor(beatStep);
    const isKeyFrame = this.guideData.markedFrameIndices?.some(idx => 
      idx >= beatIndex * this.guideData!.framesPerBeat && 
      idx < (beatIndex + 1) * this.guideData!.framesPerBeat
    );

    return isKeyFrame || (beatProgress > 0.7 && beatProgress < 0.9);
  }

  detect(landmarks: any[], previousLandmarks: any[], beatStep?: number, beatProgress?: number): DetectionResult {
    if (!this.guideData) {
      return { isCompleted: false, accuracy: 0, feedback: 'Loading guide...' };
    }

    if (!landmarks || landmarks.length === 0) {
      return { isCompleted: false, accuracy: 0, feedback: '未检测到人体' };
    }

    if (beatStep === undefined || beatProgress === undefined) {
      return { isCompleted: false, accuracy: 0, feedback: 'No beat data' };
    }

    const currentGuideFrame = this.getCurrentGuideFrame(beatStep, beatProgress);
    if (!currentGuideFrame) {
      return { isCompleted: false, accuracy: 0, feedback: 'No guide frame' };
    }

    const similarity = this.calculateSimilarity(landmarks, currentGuideFrame);
    this.updateSimilarityHistory(similarity);

    const avgSimilarity = this.getAverageSimilarity();
    const accuracy = avgSimilarity;

    let feedback = '保持姿势';
    if (similarity > 0.9) feedback = '完美!';
    else if (similarity > 0.7) feedback = '很好!';
    else if (similarity > 0.5) feedback = '继续努力';
    else feedback = '调整姿势';

    let completed = false;
    const currentBeatIndex = Math.floor(beatStep);

    if (avgSimilarity > this.COMPLETION_THRESHOLD && this.isInKeyFrame(beatStep, beatProgress)) {
      if (currentBeatIndex !== this.lastCompletedBeat) {
        completed = true;
        this.lastCompletedBeat = currentBeatIndex;
        this.similarityHistory = [];
      }
    }

    return {
      isCompleted: completed,
      accuracy: accuracy,
      feedback: completed ? '动作完成!' : feedback
    };
  }

  reset(): void {
    this.lastCompletedBeat = -1;
    this.similarityHistory = [];
  }
}
