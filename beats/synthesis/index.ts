/**
 * 合成器统一接口和工厂函数
 */

import { DrumType, DrumSynthesisParams } from '../types';
import { BaseDrumSynthesizer } from './base';
import { KickSynthesizer } from './kick';
import { SnareSynthesizer } from './snare';
import { HiHatSynthesizer } from './hihat';
import { CrashSynthesizer } from './crash';
import { OpenHiHatSynthesizer } from './openHihat';
import { RimShotSynthesizer } from './rimshot';

/**
 * 合成器工厂映射
 */
const synthesizerMap: Record<DrumType, new () => BaseDrumSynthesizer> = {
  kick: KickSynthesizer,
  snare: SnareSynthesizer,
  hihat: HiHatSynthesizer,
  crash: CrashSynthesizer,
  openHihat: OpenHiHatSynthesizer,
  rimshot: RimShotSynthesizer,
};

/**
 * 获取合成器实例
 */
export function getSynthesizer(type: DrumType): BaseDrumSynthesizer {
  const SynthesizerClass = synthesizerMap[type];
  if (!SynthesizerClass) {
    throw new Error(`Unknown drum type: ${type}`);
  }
  return new SynthesizerClass();
}

/**
 * 合成鼓点音频数据
 */
export function synthesizeDrum(
  type: DrumType,
  params: DrumSynthesisParams
): Float32Array {
  const synthesizer = getSynthesizer(type);
  return synthesizer.synthesize(params);
}

/**
 * 导出所有合成器类（用于测试或高级用法）
 */
export {
  BaseDrumSynthesizer,
  KickSynthesizer,
  SnareSynthesizer,
  HiHatSynthesizer,
  CrashSynthesizer,
  OpenHiHatSynthesizer,
  RimShotSynthesizer,
};

