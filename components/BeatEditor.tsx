/**
 * 节拍编辑器组件
 * 类似 BandLab 的可视化节拍编辑器
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Play, Pause, Square, Save, Download, Upload, RotateCcw, Plus, Trash2 } from 'lucide-react';
import Metronome from './Metronome';
import { type DrumType, type DrumStep, type BeatPattern, type SavedBeatPattern, getAudioEngine } from '../beats';

interface BeatEditorProps {
  onClose?: () => void;
  onSave?: (pattern: SavedBeatPattern) => void;
}

// 音色配置
const DRUM_TYPES: Array<{ type: DrumType; label: string; color: string; icon?: string }> = [
  { type: 'kick', label: 'Kick', color: 'bg-blue-500' },
  { type: 'snare', label: 'Snare', color: 'bg-red-500' },
  { type: 'hihat', label: 'HiHat', color: 'bg-yellow-500' },
  { type: 'openHihat', label: 'Open HiHat', color: 'bg-yellow-600' },
  { type: 'crash', label: 'Crash', color: 'bg-purple-500' },
  { type: 'tom', label: 'Tom', color: 'bg-orange-500' },
  { type: 'ride', label: 'Ride', color: 'bg-cyan-500' },
];

const DEFAULT_PATTERN_LENGTH = 16;

const BeatEditor: React.FC<BeatEditorProps> = ({ onClose, onSave }) => {
  // 状态管理
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [patternLength, setPatternLength] = useState(DEFAULT_PATTERN_LENGTH);
  // 每个步骤是一个 DrumStep[] 数组（支持多个乐器同时播放）
  const [pattern, setPattern] = useState<DrumStep[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDrumType, setSelectedDrumType] = useState<DrumType>('kick');
  const [patternName, setPatternName] = useState('节拍模式');
  const audioEngineRef = useRef<ReturnType<typeof getAudioEngine> | null>(null);

  // 列表管理状态
  const [savedPatterns, setSavedPatterns] = useState<SavedBeatPattern[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // 加载保存的列表
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedBeatPatterns');
      if (saved) {
        setSavedPatterns(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved patterns', e);
    }
  }, []);

  // 初始化音频引擎
  useEffect(() => {
    const initEngine = async () => {
      const engine = getAudioEngine();
      await engine.initialize();
      audioEngineRef.current = engine;
    };
    initEngine();
  }, []);

  // 初始化默认模式
  useEffect(() => {
    if (pattern.length === 0) {
      // 创建默认的 4/4 拍模式
      // 每个步骤现在是一个数组，可以包含多个乐器
      const defaultSteps: DrumStep[][] = Array(patternLength).fill(null).map((_, index) => {
        const steps: DrumStep[] = [];
        // 简单的默认模式：每4拍一个 kick
        if (index % 4 === 0) {
          steps.push({ type: 'kick', volume: 0.9 });
        }
        if (index % 4 === 2) {
          steps.push({ type: 'snare', volume: 0.6 });
        }
        if (index % 2 === 1) {
          steps.push({ type: 'hihat', volume: 0.4 });
        }
        return steps;
      });
      setPattern(defaultSteps);
    }
  }, [patternLength]);

  // 切换单元格状态 - 支持同一时间点多个乐器
  const toggleCell = useCallback((stepIndex: number, drumType: DrumType) => {
    setPattern(prev => {
      const newPattern = [...prev];

      // 确保数组长度足够
      while (newPattern.length <= stepIndex) {
        newPattern.push([]);
      }

      // 获取当前步骤的乐器数组
      const stepDrums = newPattern[stepIndex] || [];
      const stepDrumsCopy = [...stepDrums];

      // 查找是否已存在该乐器
      const existingDrumIndex = stepDrumsCopy.findIndex(d => d.type === drumType);

      if (existingDrumIndex >= 0) {
        // 如果已存在该乐器，移除它（关闭）
        stepDrumsCopy.splice(existingDrumIndex, 1);
      } else {
        // 如果不存在，添加该乐器
        // kick 使用更高的默认音量，使其更响亮
        const defaultVolume = drumType === 'kick' ? 0.9 : 0.6;
        stepDrumsCopy.push({ type: drumType, volume: defaultVolume });
      }

      // 更新步骤
      newPattern[stepIndex] = stepDrumsCopy;

      return newPattern;
    });
  }, []);

  // 播放试听声音
  const playDrumPreview = useCallback((drumType: DrumType) => {
    if (audioEngineRef.current) {
      try {
        const engine = audioEngineRef.current;
        const ctx = engine.getContext();

        // 确保音频上下文已恢复
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            // 使用默认音量播放试听
            const volume = drumType === 'kick' ? 0.9 : 0.6;
            engine.playDrum(drumType, volume, 0);
          }).catch(console.error);
        } else {
          // 使用默认音量播放试听
          const volume = drumType === 'kick' ? 0.9 : 0.6;
          engine.playDrum(drumType, volume, 0);
        }
      } catch (error) {
        console.error('播放试听声音失败:', error);
      }
    }
  }, []);

  // 处理单元格点击 - 直接使用该行对应的音色类型，并播放试听声音
  const handleCellClick = useCallback((stepIndex: number, drumType: DrumType) => {
    // 检查当前是否已激活（用于判断是添加还是移除）
    const step = pattern[stepIndex];
    const isCurrentlyActive = step && Array.isArray(step) &&
      step.some(d => d.type === drumType && (d.volume || 0) > 0);

    // 切换状态
    toggleCell(stepIndex, drumType);

    // 只有在添加乐器时才播放声音（移除时不播放）
    if (!isCurrentlyActive) {
      playDrumPreview(drumType);
    }
  }, [toggleCell, pattern, playDrumPreview]);

  // 清空模式
  const handleClear = useCallback(() => {
    setPattern(Array(patternLength).fill(null).map(() => []));
  }, [patternLength]);

  // 重置模式
  const handleReset = useCallback(() => {
    setPattern(Array(patternLength).fill(null).map((_, index) => {
      const steps: DrumStep[] = [];
      if (index % 4 === 0) {
        steps.push({ type: 'kick', volume: 0.9 });
      }
      if (index % 4 === 2) {
        steps.push({ type: 'snare', volume: 0.6 });
      }
      if (index % 2 === 1) {
        steps.push({ type: 'hihat', volume: 0.4 });
      }
      return steps;
    }));
  }, [patternLength]);

  // 构建当前节拍模式
  const buildBeatPattern = useCallback((): BeatPattern => {
    // 确保模式数组长度始终等于 patternLength
    // 创建一个完整的数组，每个步骤是一个 DrumStep[] 数组
    const patternArray: DrumStep[][] = Array(patternLength);

    for (let i = 0; i < patternLength; i++) {
      // 如果 pattern 中有对应步骤，使用它
      if (i < pattern.length && pattern[i] !== undefined && pattern[i] !== null) {
        const step = pattern[i];
        // 检查是否是数组（新格式）或单个对象（旧格式兼容）
        if (Array.isArray(step)) {
          patternArray[i] = step;
        } else {
          // 旧格式：单个 DrumStep，转换为数组
          patternArray[i] = [step];
        }
      } else {
        // 默认空数组（无乐器）
        patternArray[i] = [];
      }
    }

    // 确保数组是连续的（没有 undefined 元素）
    for (let i = 0; i < patternLength; i++) {
      if (patternArray[i] === undefined || patternArray[i] === null) {
        patternArray[i] = [];
      }
    }

    return {
      bpm,
      pattern: patternArray,
      timeSignature: [4, 4],
      swing
    };
  }, [bpm, swing, patternLength, pattern]);

  // 保存模式
  const handleSave = useCallback(() => {
    const beatPattern = buildBeatPattern();
    const savedPattern: SavedBeatPattern = {
      id: `pattern-${Date.now()}`,
      name: patternName,
      bpm: beatPattern.bpm,
      pattern: beatPattern.pattern as DrumStep[][],
      timeSignature: beatPattern.timeSignature || [4, 4],
      swing: beatPattern.swing || 0,
      length: patternLength,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 保存到本地存储
    const saved = localStorage.getItem('savedBeatPatterns');
    const patterns = saved ? JSON.parse(saved) : [];
    patterns.push(savedPattern);
    localStorage.setItem('savedBeatPatterns', JSON.stringify(patterns));

    onSave?.(savedPattern);

    alert(`节拍模式 "${patternName}" 已保存！`);
  }, [buildBeatPattern, patternName, patternLength, onSave]);

  // 加载模式
  const handleLoad = useCallback(() => {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      alert('没有保存的模式');
      return;
    }

    const patterns = JSON.parse(saved);
    if (patterns.length === 0) {
      alert('没有保存的模式');
      return;
    }

    // 简单实现：加载最新的模式
    const savedPattern = patterns[patterns.length - 1];
    setPatternName(savedPattern.name);
    setBpm(savedPattern.bpm);
    setSwing(savedPattern.swing);
    setPatternLength(savedPattern.length);

    // 兼容旧格式（DrumStep[]）和新格式（DrumStep[][]）
    const loadedPattern = savedPattern.pattern;
    if (loadedPattern && loadedPattern.length > 0) {
      // 检查是否是旧格式（第一个元素不是数组）
      if (!Array.isArray(loadedPattern[0])) {
        // 旧格式：转换为新格式（每个步骤是一个数组）
        const convertedPattern: DrumStep[][] = loadedPattern.map((step: DrumStep) => {
          if (step && step.volume > 0) {
            return [step];
          }
          return [];
        });
        setPattern(convertedPattern);
      } else {
        // 新格式：直接使用
        setPattern(loadedPattern);
      }
    } else {
      setPattern([]);
    }

    alert(`已加载模式 "${savedPattern.name}"`);
  }, []);

  // 确认保存
  const confirmSave = useCallback(() => {
    const beatPattern = buildBeatPattern();

    // 检查是否有同名模式
    const existingIndex = savedPatterns.findIndex(p => p.name === patternName);

    let newPatterns: SavedBeatPattern[];
    let patternToSave: SavedBeatPattern;

    if (existingIndex >= 0) {
      if (!window.confirm(`模式 "${patternName}" 已存在，是否覆盖？`)) {
        return;
      }

      // 覆盖 (保持 ID)
      const existing = savedPatterns[existingIndex];
      patternToSave = {
        ...existing,
        bpm: beatPattern.bpm,
        pattern: beatPattern.pattern as DrumStep[][],
        timeSignature: beatPattern.timeSignature || [4, 4],
        swing: beatPattern.swing || 0,
        length: patternLength,
        updatedAt: Date.now()
      };

      newPatterns = [...savedPatterns];
      newPatterns[existingIndex] = patternToSave;
    } else {
      // 新建
      patternToSave = {
        id: `pattern-${Date.now()}`,
        name: patternName,
        bpm: beatPattern.bpm,
        pattern: beatPattern.pattern as DrumStep[][],
        timeSignature: beatPattern.timeSignature || [4, 4],
        swing: beatPattern.swing || 0,
        length: patternLength,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      newPatterns = [...savedPatterns, patternToSave];
    }

    setSavedPatterns(newPatterns);
    localStorage.setItem('savedBeatPatterns', JSON.stringify(newPatterns));

    onSave?.(patternToSave);
    setShowSaveModal(false);
  }, [buildBeatPattern, patternName, patternLength, onSave, savedPatterns]);

  // 加载特定模式
  const loadPattern = useCallback((savedPattern: SavedBeatPattern) => {
    setPatternName(savedPattern.name);
    setBpm(savedPattern.bpm);
    setSwing(savedPattern.swing || 0);
    setPatternLength(savedPattern.length);

    // 兼容旧格式（DrumStep[]）和新格式（DrumStep[][]）
    const loadedPattern = savedPattern.pattern;
    if (loadedPattern && loadedPattern.length > 0) {
      if (!Array.isArray(loadedPattern[0])) {
        // 旧格式转换
        const convertedPattern: DrumStep[][] = (loadedPattern as any).map((step: any) => {
          if (step && step.volume > 0) {
            return [step];
          }
          return [];
        });
        setPattern(convertedPattern);
      } else {
        setPattern(loadedPattern as DrumStep[][]);
      }
    } else {
      setPattern([]);
    }

    setShowLoadModal(false);
  }, []);

  // 删除模式
  const deletePattern = useCallback((id: string) => {
    const newPatterns = savedPatterns.filter(p => p.id !== id);
    setSavedPatterns(newPatterns);
    localStorage.setItem('savedBeatPatterns', JSON.stringify(newPatterns));
  }, [savedPatterns]);

  // 导出为 JSON
  const handleExport = useCallback(() => {
    const beatPattern = buildBeatPattern();
    const savedPattern: SavedBeatPattern = {
      id: `pattern-${Date.now()}`,
      name: patternName,
      bpm: beatPattern.bpm,
      pattern: beatPattern.pattern as DrumStep[][],
      timeSignature: beatPattern.timeSignature || [4, 4],
      swing: beatPattern.swing || 0,
      length: patternLength,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const dataStr = JSON.stringify(savedPattern, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patternName.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [buildBeatPattern, patternName, patternLength]);


  // 检查单元格是否激活（步骤中是否包含该乐器且音量大于0）
  const isCellActive = useCallback((stepIndex: number, drumType: DrumType): boolean => {
    const step = pattern[stepIndex];
    if (!step || !Array.isArray(step)) {
      return false;
    }
    // 检查步骤数组中是否包含该乐器类型且音量大于0
    return step.some(d => d.type === drumType && (d.volume || 0) > 0);
  }, [pattern]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">节拍编辑器</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* BPM 控制 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">BPM:</label>
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-mono w-12">{bpm}</span>
          </div>

          {/* 节拍器控制 */}
          <Metronome
            pattern={useMemo(() => buildBeatPattern(), [buildBeatPattern])}
            isPlaying={isPlaying}
            onPlayStateChange={setIsPlaying}
            onBeatStepChange={setCurrentStep}
          />
        </div>
      </div>

      {/* 主编辑区 */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 步进序列器网格 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* 网格容器 */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
              {/* 音色列表和网格 */}
              <div className="space-y-2">
                {DRUM_TYPES.map((drum) => (
                  <div key={drum.type} className="flex items-center gap-2">
                    {/* 音色标签 */}
                    <div className="w-24 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDrumType(drum.type);
                          playDrumPreview(drum.type);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedDrumType === drum.type
                          ? `${drum.color} text-white shadow-lg`
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                      >
                        {drum.label}
                      </button>
                    </div>

                    {/* 网格行 */}
                    <div className="flex-1 flex gap-1">
                      {Array(patternLength).fill(null).map((_, stepIndex) => {
                        const isActive = isCellActive(stepIndex, drum.type);
                        const isCurrentStep = isPlaying && currentStep === stepIndex;

                        return (
                          <button
                            key={stepIndex}
                            onClick={() => handleCellClick(stepIndex, drum.type)}
                            className={`flex-1 aspect-square rounded-lg transition-all ${isActive
                              ? `${drum.color} shadow-lg scale-105`
                              : 'bg-slate-700 hover:bg-slate-600'
                              } ${isCurrentStep && isActive
                                ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-800'
                                : ''
                              } ${isCurrentStep && !isActive
                                ? 'ring-1 ring-teal-500/50'
                                : ''
                              }`}
                            title={`步骤 ${stepIndex + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* 步骤编号 */}
              <div className="flex gap-1 mt-2 ml-24">
                {Array(patternLength).fill(null).map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 text-center text-xs font-mono ${isPlaying && currentStep === index
                      ? 'text-teal-400 font-bold'
                      : 'text-slate-500'
                      }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 模式长度 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">长度:</label>
                <select
                  value={patternLength}
                  onChange={(e) => {
                    const newLength = Number(e.target.value);
                    setPatternLength(newLength);
                    // 调整当前模式长度
                    setPattern(prev => {
                      const newPattern = [...prev];
                      while (newPattern.length < newLength) {
                        newPattern.push([]); // 空数组（无乐器）
                      }
                      while (newPattern.length > newLength) {
                        newPattern.pop();
                      }
                      return newPattern;
                    });
                  }}
                  className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {[4, 8, 12, 16, 24, 32].map(len => (
                    <option key={len} value={len}>{len} 步</option>
                  ))}
                </select>
              </div>

              {/* 摇摆感 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">摇摆:</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={swing}
                  onChange={(e) => setSwing(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-mono w-12">{swing}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={() => setShowLoadModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                加载
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4">保存节拍模式</h3>
            <input
              type="text"
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white mb-6 focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="输入名称..."
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmSave}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors"
                disabled={!patternName.trim()}
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">加载节拍模式</h3>
              <button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {savedPatterns.length === 0 ? (
                <div className="text-center text-slate-500 py-8">暂无保存的模式</div>
              ) : (
                [...savedPatterns].reverse().map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors group">
                    <div className="flex-1 cursor-pointer" onClick={() => loadPattern(p)}>
                      <div className="font-bold text-teal-400">{p.name}</div>
                      <div className="text-xs text-slate-400 flex gap-3 mt-1">
                        <span>{p.bpm} BPM</span>
                        <span>{p.length} 步</span>
                        <span>{new Date(p.updatedAt).toLocaleDateString()} {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePattern(p.id); }}
                      className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800 rounded-lg"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatEditor;

