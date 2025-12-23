/**
 * 节拍播放器
 */

// 使用浏览器原生 AudioContext 类型
import { BeatPattern, DrumStep } from './types';
import { getBeatCache } from './cache';
import { LEGACY_STEP_MAP } from './constants';

/**
 * 节拍播放器类
 */
export class BeatPlayer {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private currentStep = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onStepChange?: (step: number) => void;
  private pattern: BeatPattern | null = null;
  
  /**
   * 设置 AudioContext
   */
  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
    const cache = getBeatCache();
    cache.setAudioContext(ctx);
  }
  
  /**
   * 设置步进回调
   */
  setOnStepChange(callback: (step: number) => void): void {
    this.onStepChange = callback;
  }
  
  /**
   * 播放单个鼓点
   */
  playDrumStep(step: DrumStep | number): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }
    
    const cache = getBeatCache();
    let drumStep: DrumStep;
    
    // 向后兼容：支持旧格式 number[]
    if (typeof step === 'number') {
      const type = LEGACY_STEP_MAP[step];
      if (!type) {
        console.warn(`Unknown legacy step: ${step}`);
        return;
      }
      drumStep = {
        type,
        velocity: 127,
      };
    } else {
      drumStep = step;
    }
    
    // 获取缓存的 AudioBuffer
    const buffer = cache.getBuffer(drumStep.type, drumStep.velocity);
    
    if (!buffer) {
      // 如果缓存不存在，实时生成（不推荐，但作为回退）
      console.warn(`Buffer not cached for ${drumStep.type} at velocity ${drumStep.velocity}, generating on the fly`);
      cache.pregenerateDrum(drumStep.type, drumStep.velocity).then((buf) => {
        this.playBuffer(buf);
      }).catch(console.error);
      return;
    }
    
    this.playBuffer(buffer);
  }
  
  /**
   * 播放 AudioBuffer
   */
  private playBuffer(buffer: AudioBuffer): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      console.warn('AudioContext not running, state:', this.audioContext?.state);
      return;
    }
    
    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Failed to play buffer:', error);
    }
  }
  
  /**
   * 更新节拍模式（播放时实时更新）
   */
  updatePattern(pattern: BeatPattern): void {
    if (!this.isPlaying) {
      return;
    }
    
    // 如果步数改变，调整 currentStep
    const oldLength = this.pattern?.pattern.length || 0;
    const newLength = pattern.pattern.length;
    if (newLength !== oldLength && this.currentStep >= newLength) {
      this.currentStep = this.currentStep % newLength;
    }
    
    // 实时更新 pattern
    this.pattern = pattern;
    
    // 重新计算间隔（BPM 或步数可能改变）
    const stepsPerBeat = pattern.pattern.length;
    const beatInterval = (60 / pattern.bpm) * 1000;
    const baseStepInterval = beatInterval / stepsPerBeat;
    
    // 重启定时器以应用新的间隔
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // 重新启动定时器
    this.startInterval(pattern, baseStepInterval);
  }
  
  /**
   * 启动播放间隔定时器
   */
  private startInterval(pattern: BeatPattern, baseStepInterval: number): void {
    const swing = pattern.swing || 0;
    
    this.intervalId = setInterval(() => {
      if (!this.isPlaying || !this.pattern) {
        return;
      }
      
      // 确保 AudioContext 正在运行
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(console.error);
      }
      
      const step = this.pattern.pattern[this.currentStep];
      if (step) {
        // 检查是否是有效的 DrumStep 对象且 velocity > 0
        const isValidStep = typeof step === 'object' && 'velocity' in step && step.velocity > 0;
        const isValidLegacyStep = typeof step === 'number';
        
        if (isValidStep || isValidLegacyStep) {
          // 应用时间偏移（如果有）
          const timing = typeof step === 'object' && 'timing' in step ? (step.timing || 0) : 0;
          if (timing !== 0) {
            setTimeout(() => {
              this.playDrumStep(step);
            }, timing * 1000);
          } else {
            this.playDrumStep(step);
          }
        }
      }
      
      // 通知步进变化
      if (this.onStepChange) {
        this.onStepChange(this.currentStep);
      }
      
      // 更新步进
      this.currentStep = (this.currentStep + 1) % this.pattern.pattern.length;
      
      // 应用摇摆到下一个间隔
      if (this.currentStep % 2 === 1 && swing > 0) {
        // 奇数步应用摇摆
        // 这里简化处理，实际应该在间隔计算中处理
      }
    }, baseStepInterval);
  }
  
  /**
   * 开始播放节拍模式
   */
  start(pattern: BeatPattern): void {
    if (this.isPlaying) {
      this.stop();
    }
    
    this.pattern = pattern;
    this.isPlaying = true;
    this.currentStep = 0;
    
    // 计算步进间隔（考虑摇摆）
    const stepsPerBeat = pattern.pattern.length;
    const beatInterval = (60 / pattern.bpm) * 1000; // 每拍毫秒数
    const baseStepInterval = beatInterval / stepsPerBeat;
    
    // 启动定时器
    this.startInterval(pattern, baseStepInterval);
  }
  
  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentStep = 0;
  }
  
  /**
   * 暂停播放
   */
  pause(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * 恢复播放
   */
  resume(): void {
    if (this.pattern && !this.isPlaying) {
      this.start(this.pattern);
      // 从当前步继续
      // 注意：这里简化处理，实际应该保存暂停时的步进
    }
  }
  
  /**
   * 获取当前播放状态
   */
  getPlaying(): boolean {
    return this.isPlaying;
  }
  
  /**
   * 获取当前步进
   */
  getCurrentStep(): number {
    return this.currentStep;
  }
}

// 全局单例
let globalPlayer: BeatPlayer | null = null;

/**
 * 获取全局播放器实例
 */
export function getBeatPlayer(): BeatPlayer {
  if (!globalPlayer) {
    globalPlayer = new BeatPlayer();
  }
  return globalPlayer;
}

/**
 * 播放鼓点步骤（向后兼容函数）
 */
export function playDrumStepCached(ctx: AudioContext, step: number): void {
  const player = getBeatPlayer();
  if (!player.audioContext) {
    player.setAudioContext(ctx);
  }
  player.playDrumStep(step);
}

