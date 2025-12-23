/**
 * 节拍缓存管理系统
 */

// 使用浏览器原生 AudioContext 类型
import { DrumType, EffectChainConfig } from './types';
import { synthesizeDrum } from './synthesis';
import { applyEffectChain } from './effects';
import { DRUM_DEFAULTS, DEFAULT_EFFECT_CONFIG } from './constants';

/**
 * 节拍缓存类
 */
export class BeatCache {
  private cache = new Map<string, AudioBuffer>();
  private audioContext: AudioContext | null = null;
  private effectConfig: EffectChainConfig = DEFAULT_EFFECT_CONFIG;
  
  /**
   * 设置 AudioContext
   */
  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }
  
  /**
   * 设置效果链配置
   */
  setEffectConfig(config: EffectChainConfig): void {
    this.effectConfig = { ...DEFAULT_EFFECT_CONFIG, ...config };
  }
  
  /**
   * 生成缓存键
   * 包含版本号，算法更新时自动失效旧缓存
   */
  private getCacheKey(type: DrumType, velocity: number, sampleRate: number): string {
    // 版本号：当合成算法或默认参数改变时，更新此版本号
    const VERSION = 'v4'; // 更新版本号以强制重新生成缓存（Kick 完全参考 Crash 实现）
    return `${type}-${velocity}-${sampleRate}-${VERSION}`;
  }
  
  /**
   * 预生成单个鼓点的 AudioBuffer
   */
  async pregenerateDrum(
    type: DrumType,
    velocity: number = 127,
    sampleRate?: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not set');
    }
    
    const actualSampleRate = sampleRate || this.audioContext.sampleRate;
    const cacheKey = this.getCacheKey(type, velocity, actualSampleRate);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 生成音频数据
    const defaults = DRUM_DEFAULTS[type];
    const audioData = synthesizeDrum(type, {
      sampleRate: actualSampleRate,
      duration: defaults.duration,
      velocity,
      fundamental: defaults.fundamental || undefined,
    });
    
    // 应用效果链
    applyEffectChain(audioData, actualSampleRate, this.effectConfig);
    
    // 创建 AudioBuffer
    const buffer = this.audioContext.createBuffer(1, audioData.length, actualSampleRate);
    buffer.getChannelData(0).set(audioData);
    
    // 缓存
    this.cache.set(cacheKey, buffer);
    
    return buffer;
  }
  
  /**
   * 预生成所有常用鼓点和力度组合
   */
  async pregenerateAll(sampleRate?: number): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext not set');
    }
    
    const actualSampleRate = sampleRate || this.audioContext.sampleRate;
    const types: DrumType[] = ['kick', 'snare', 'hihat', 'crash', 'openHihat', 'rimshot'];
    const velocities = [64, 96, 127]; // 常用力度值
    
    const promises: Promise<AudioBuffer>[] = [];
    
    for (const type of types) {
      for (const velocity of velocities) {
        promises.push(this.pregenerateDrum(type, velocity, actualSampleRate));
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * 获取缓存的 AudioBuffer
   */
  getBuffer(type: DrumType, velocity: number, sampleRate?: number): AudioBuffer | null {
    if (!this.audioContext) {
      return null;
    }
    
    const actualSampleRate = sampleRate || this.audioContext.sampleRate;
    const cacheKey = this.getCacheKey(type, velocity, actualSampleRate);
    return this.cache.get(cacheKey) || null;
  }
  
  /**
   * 清理缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 全局单例
let globalCache: BeatCache | null = null;

/**
 * 获取全局缓存实例
 */
export function getBeatCache(): BeatCache {
  if (!globalCache) {
    globalCache = new BeatCache();
  }
  return globalCache;
}

/**
 * 预生成所有鼓点缓冲区（向后兼容函数）
 */
export async function pregenerateDrumBuffers(ctx: AudioContext): Promise<void> {
  const cache = getBeatCache();
  cache.setAudioContext(ctx);
  await cache.pregenerateAll();
}

/**
 * 清理音频缓存（向后兼容函数）
 */
export function clearAudioCache(): void {
  const cache = getBeatCache();
  cache.clear();
}

