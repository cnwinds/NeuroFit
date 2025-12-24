/**
 * Audio Utilities Module (Legacy Wrapper)
 * 
 * Note: Core audio logic has been migrated to beats/audioEngine.ts
 */

import { getAudioEngine } from '../beats/audioEngine';

/**
 * 播放倒计时提示音
 */
export function playCountdownBeep(ctx: AudioContext, isFinal: boolean = false): void {
  getAudioEngine().playCountdown(isFinal);
}

/**
 * 播放成功音效
 */
export function playSuccessSound(ctx: AudioContext): void {
  getAudioEngine().playGood();
}

/**
 * 播放EXCELLENT评分音效
 */
export function playExcellentSound(ctx: AudioContext): void {
  getAudioEngine().playExcellent();
}

/**
 * 播放GOOD评分音效
 */
export function playGoodSound(ctx: AudioContext): void {
  getAudioEngine().playGood();
}

/**
 * 播放BAD评分音效
 */
export function playBadSound(ctx: AudioContext): void {
  getAudioEngine().playBad();
}

/**
 * 播放MISS评分音效
 */
export function playMissSound(ctx: AudioContext): void {
  getAudioEngine().playMiss();
}
