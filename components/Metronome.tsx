/**
 * 节拍器组件
 * 提供节拍播放功能和视觉反馈
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { getAudioEngine, type DrumStep, type BeatPattern } from '../beats';

interface MetronomeProps {
  pattern: BeatPattern;
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onBeatStepChange?: (step: number) => void;
  className?: string;
}

const Metronome: React.FC<MetronomeProps> = ({
  pattern,
  isPlaying: controlledIsPlaying,
  onPlayStateChange,
  onBeatStepChange,
  className = ''
}) => {
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioEngineRef = useRef<ReturnType<typeof getAudioEngine> | null>(null);
  const startTimeRef = useRef<number>(0);
  const stepCountRef = useRef<number>(0);

  // 使用受控或内部状态
  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;
  const setIsPlaying = useCallback((playing: boolean) => {
    if (controlledIsPlaying === undefined) {
      setInternalIsPlaying(playing);
    }
    onPlayStateChange?.(playing);
  }, [controlledIsPlaying, onPlayStateChange]);

  // 初始化音频引擎
  useEffect(() => {
    const initEngine = async () => {
      const engine = getAudioEngine();
      await engine.initialize();
      audioEngineRef.current = engine;
    };
    initEngine();
  }, []);

  // 播放节拍
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 确保音频上下文已恢复
    const engine = audioEngineRef.current;
    if (engine) {
      const ctx = engine.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(console.error);
      }
    }

    // 计算节拍间隔
    const patternSteps = pattern.pattern;
    // 确保 patternLength 至少为 1，避免除以零
    const patternLength = Math.max(patternSteps.length, 1);
    const swing = pattern.swing || 0;

    // 基础节拍间隔（毫秒）
    const baseIntervalMs = (60 / pattern.bpm) * 1000;
    // 默认为 16 分音符（每拍 4 个步骤）
    const stepIntervalMs = baseIntervalMs / 4;

    // 重置状态
    setCurrentStep(0);
    onBeatStepChange?.(0);
    stepCountRef.current = 0;
    startTimeRef.current = Date.now();

    // 立即播放第一步（如果存在且有音量）
    if (engine && patternSteps.length > 0) {
      const firstStep = patternSteps[0];
      if (firstStep) {
        // 检查是否是数组（支持多个乐器）
        if (Array.isArray(firstStep)) {
          // 播放数组中的所有乐器
          firstStep.forEach(step => {
            if (step && typeof step === 'object' && step.volume > 0) {
              engine.playDrumStep(step);
            }
          });
        } else if (typeof firstStep === 'object') {
          // 单个 DrumStep 对象
          if (firstStep.volume > 0) {
            engine.playDrumStep(firstStep);
          }
        } else {
          // 数字（向后兼容）：直接播放
          engine.playDrumStep(firstStep);
        }
      }
    }

    // 设置定时器播放后续节拍
    const scheduleNextBeat = () => {
      stepCountRef.current++;
      const nextStep = stepCountRef.current % patternLength;

      // 计算摇摆感偏移
      let timeOffset = 0;
      if (swing > 0 && nextStep % 2 === 1) {
        // 奇数步（后半拍）应用摇摆感
        const swingAmount = (swing / 100) * stepIntervalMs * 0.3;
        timeOffset = swingAmount / 1000; // 转换为秒
      }

      // 播放节拍（如果该步骤存在且有音色）
      if (engine && patternSteps[nextStep]) {
        const step = patternSteps[nextStep];
        // 检查是否是有效的音色（有音量）
        if (step) {
          // 检查是否是数组（支持多个乐器同时播放）
          if (Array.isArray(step)) {
            // 播放数组中的所有乐器
            step.forEach(drumStep => {
              if (drumStep && typeof drumStep === 'object' && drumStep.volume > 0) {
                engine.playDrumStep(drumStep, timeOffset);
              }
            });
          } else if (typeof step === 'object') {
            // 单个 DrumStep 对象：检查音量
            if (step.volume > 0) {
              engine.playDrumStep(step, timeOffset);
            }
          } else {
            // 数字（向后兼容）：直接播放
            engine.playDrumStep(step, timeOffset);
          }
        }
      }

      // 更新 UI（无论是否有音色都要更新，以显示播放进度）
      setCurrentStep(nextStep);
      onBeatStepChange?.(nextStep);

      // 计算下一次播放时间（考虑摇摆感）
      let nextInterval = stepIntervalMs;
      if (swing > 0 && (nextStep + 1) % 2 === 1) {
        // 下一个是奇数步，调整间隔
        const swingAmount = (swing / 100) * stepIntervalMs * 0.3;
        nextInterval = stepIntervalMs - swingAmount;
      } else if (swing > 0 && nextStep % 2 === 1) {
        // 当前是奇数步，下一个间隔要补偿
        const swingAmount = (swing / 100) * stepIntervalMs * 0.3;
        nextInterval = stepIntervalMs + swingAmount;
      }

      // 使用更精确的 setTimeout 来保持同步
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const expectedTime = stepCountRef.current * stepIntervalMs;
      const drift = elapsed - expectedTime;

      // 补偿时间漂移
      const adjustedInterval = Math.max(0, nextInterval - drift);

      intervalRef.current = setTimeout(scheduleNextBeat, adjustedInterval) as unknown as ReturnType<typeof setInterval>;
    };

    // 启动第一次延迟
    intervalRef.current = setTimeout(scheduleNextBeat, stepIntervalMs) as unknown as ReturnType<typeof setInterval>;

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current as any);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, pattern, onBeatStepChange]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onBeatStepChange?.(0);
    stepCountRef.current = 0;
  }, [setIsPlaying, onBeatStepChange]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleTogglePlay}
        className="p-2 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-all active:scale-95"
        aria-label={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current" />
        )}
      </button>

      <button
        onClick={handleStop}
        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-all active:scale-95"
        aria-label="停止"
      >
        <Square className="w-4 h-4 fill-current" />
      </button>

      {/* 节拍指示器 */}
      <div className="flex items-center gap-1">
        {pattern.pattern.slice(0, 16).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${index === currentStep
              ? 'bg-teal-400 scale-125 shadow-lg shadow-teal-400/50'
              : index < currentStep
                ? 'bg-teal-500/30'
                : 'bg-slate-600/30'
              }`}
          />
        ))}
      </div>

      {/* BPM 显示 */}
      <div className="text-sm text-slate-400 font-mono">
        {pattern.bpm} BPM
      </div>
    </div>
  );
};

export default Metronome;

