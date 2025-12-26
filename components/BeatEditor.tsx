/**
 * 节拍编辑器组件
 * 类似 BandLab 的可视化节拍编辑器
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Play, Pause, Square, Save, Download, Upload, RotateCcw, Plus, Trash2, Edit2, Pencil } from 'lucide-react';
import Metronome from './Metronome';
import PageNavigator from './PageNavigator';
import { type DrumType, type DrumStep, type BeatPattern, type SavedBeatPattern, getAudioEngine } from '../beats';

interface BeatEditorProps {
  onClose?: () => void;
  onSave?: (pattern: SavedBeatPattern) => void;
}

// 音色类型定义
type DrumConfig = {
  type: DrumType;
  label: string;
  color: string;
  icon?: string;
};

// 所有可用的音色类型及其默认配置
const AVAILABLE_DRUM_TYPES: Record<DrumType, Omit<DrumConfig, 'type'>> = {
  kick: { label: 'Kick', color: 'bg-blue-500' },
  snare: { label: 'Snare', color: 'bg-red-500' },
  hihat: { label: 'HiHat', color: 'bg-yellow-500' },
  openHihat: { label: 'Open HiHat', color: 'bg-yellow-600' },
  crash: { label: 'Crash', color: 'bg-purple-500' },
  tom: { label: 'Tom', color: 'bg-orange-500' },
  ride: { label: 'Ride', color: 'bg-cyan-500' },
};

// 默认音色配置（初始显示的音色）
const DEFAULT_DRUM_CONFIGS: DrumConfig[] = [
  { type: 'kick', ...AVAILABLE_DRUM_TYPES.kick },
  { type: 'snare', ...AVAILABLE_DRUM_TYPES.snare },
  { type: 'hihat', ...AVAILABLE_DRUM_TYPES.hihat },
];

// 可选的颜色列表
const COLOR_OPTIONS = [
  { name: '蓝色', value: 'bg-blue-500' },
  { name: '红色', value: 'bg-red-500' },
  { name: '黄色', value: 'bg-yellow-500' },
  { name: '深黄', value: 'bg-yellow-600' },
  { name: '紫色', value: 'bg-purple-500' },
  { name: '橙色', value: 'bg-orange-500' },
  { name: '青色', value: 'bg-cyan-500' },
  { name: '绿色', value: 'bg-green-500' },
  { name: '粉色', value: 'bg-pink-500' },
  { name: '靛蓝', value: 'bg-indigo-500' },
];

const DEFAULT_PATTERN_LENGTH = 8;

const BeatEditor: React.FC<BeatEditorProps> = ({ onClose, onSave }) => {
  // 状态管理
  const [bpm, setBpm] = useState(60);
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

  // 新增：移动端优化状态
  const [currentPage, setCurrentPage] = useState(0);
  const [soloDrum, setSoloDrum] = useState<DrumType | null>(null);
  const currentPageRef = useRef(0);

  // 音色管理状态
  const [drumConfigs, setDrumConfigs] = useState<DrumConfig[]>(() => {
    // 从 localStorage 加载保存的音色配置，如果没有则使用默认配置
    try {
      const saved = localStorage.getItem('beatEditorDrumConfigs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load drum configs', e);
    }
    return DEFAULT_DRUM_CONFIGS;
  });
  const [showAddDrumModal, setShowAddDrumModal] = useState(false);
  const [showEditDrumModal, setShowEditDrumModal] = useState(false);
  const [editingDrum, setEditingDrum] = useState<DrumConfig | null>(null);
  const [newDrumType, setNewDrumType] = useState<DrumType>('kick');
  const [newDrumLabel, setNewDrumLabel] = useState('');
  const [newDrumColor, setNewDrumColor] = useState('bg-blue-500');
  const [editDrumType, setEditDrumType] = useState<DrumType>('kick');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [drumToDelete, setDrumToDelete] = useState<DrumType | null>(null);

  // 同步 Ref 以便在回调中使用
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // 新增：稳定的回调处理，防止 Metronome 频繁重启
  const handleBeatStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    // 播放时自动切换页面 (4步一页)
    const targetPage = Math.floor(step / 4);
    if (targetPage !== currentPageRef.current) {
      setCurrentPage(targetPage);
    }
  }, []);

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

  // 保存音色配置到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem('beatEditorDrumConfigs', JSON.stringify(drumConfigs));
    } catch (e) {
      console.error('Failed to save drum configs', e);
    }
  }, [drumConfigs]);

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
        let step = pattern[i];

        // 如果不是数组，转换为数组（旧格式兼容）
        if (!Array.isArray(step)) {
          step = [step];
        }

        // 重要：如果开启了 Solo 模式，则仅过滤出该乐器的发声
        if (soloDrum) {
          patternArray[i] = step.filter(d => d.type === soloDrum);
        } else {
          patternArray[i] = step;
        }
      } else {
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

  // 音色管理函数
  const handleAddDrum = useCallback(() => {
    // 检查该音色类型是否已存在
    if (drumConfigs.some(d => d.type === newDrumType)) {
      alert('该音色类型已存在！');
      return;
    }

    const defaultConfig = AVAILABLE_DRUM_TYPES[newDrumType];
    const newDrum: DrumConfig = {
      type: newDrumType,
      label: newDrumLabel.trim() || defaultConfig.label,
      color: newDrumColor,
    };

    setDrumConfigs(prev => [...prev, newDrum]);
    setShowAddDrumModal(false);
    setNewDrumType('kick');
    setNewDrumLabel('');
    setNewDrumColor('bg-blue-500');
  }, [drumConfigs, newDrumType, newDrumLabel, newDrumColor]);

  const handleEditDrum = useCallback(() => {
    if (!editingDrum) return;

    const oldDrumType = editingDrum.type;
    const newDrumType = editDrumType;
    const isTypeChanged = oldDrumType !== newDrumType;

    // 如果更换了音色类型，检查新类型是否已被使用
    if (isTypeChanged && drumConfigs.some(d => d.type === newDrumType && d.type !== oldDrumType)) {
      alert('该音色类型已被使用！');
      return;
    }

    // 更新音色配置
    setDrumConfigs(prev => {
      // 如果更换了音色类型，使用新类型的默认名称
      if (isTypeChanged) {
        const defaultLabel = AVAILABLE_DRUM_TYPES[newDrumType].label;
        return prev.map(d => 
          d.type === oldDrumType 
            ? { type: newDrumType, label: defaultLabel, color: newDrumColor }
            : d
        );
      } else {
        // 只更新颜色
        return prev.map(d => 
          d.type === oldDrumType 
            ? { ...d, color: newDrumColor }
            : d
        );
      }
    });

    // 如果更换了音色类型，需要更新模式中所有步骤
    if (isTypeChanged) {
      setPattern(prev => prev.map(step => 
        Array.isArray(step) 
          ? step.map(d => d.type === oldDrumType ? { ...d, type: newDrumType } : d)
          : []
      ));

      // 如果 solo 的是旧音色，更新为新的音色类型
      if (soloDrum === oldDrumType) {
        setSoloDrum(newDrumType);
      }
    }

    setShowEditDrumModal(false);
    setEditingDrum(null);
    setNewDrumLabel('');
    setNewDrumColor('bg-blue-500');
    setEditDrumType('kick');
  }, [editingDrum, editDrumType, newDrumColor, drumConfigs, soloDrum]);

  const handleDeleteDrum = useCallback((drumType: DrumType) => {
    if (drumConfigs.length <= 1) {
      return;
    }
    setDrumToDelete(drumType);
    setShowDeleteConfirm(true);
  }, [drumConfigs.length]);

  const confirmDeleteDrum = useCallback(() => {
    if (!drumToDelete) return;
    
    if (drumConfigs.length <= 1) {
      setShowDeleteConfirm(false);
      setDrumToDelete(null);
      return;
    }

    // 删除音色配置
    setDrumConfigs(prev => prev.filter(d => d.type !== drumToDelete));
    
    // 清除模式中该音色的所有步骤
    setPattern(prev => prev.map(step => 
      Array.isArray(step) ? step.filter(d => d.type !== drumToDelete) : []
    ));

    // 如果删除的是当前 solo 的音色，取消 solo
    if (soloDrum === drumToDelete) {
      setSoloDrum(null);
    }

    setShowDeleteConfirm(false);
    setDrumToDelete(null);
    
    // 如果正在编辑被删除的音色，关闭编辑模态框
    if (editingDrum && editingDrum.type === drumToDelete) {
      setShowEditDrumModal(false);
      setEditingDrum(null);
    }
  }, [drumToDelete, drumConfigs.length, soloDrum, editingDrum]);

  const openEditDrumModal = useCallback((drum: DrumConfig) => {
    setEditingDrum(drum);
    setEditDrumType(drum.type);
    setNewDrumColor(drum.color);
    setShowEditDrumModal(true);
  }, []);

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
    <div className="fixed inset-0 h-[100dvh] z-50 bg-[#020617] text-white flex flex-col font-sans overflow-hidden selection:bg-teal-500/30 max-h-[100dvh]">

      {/* 1. 净化后的标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#020617]/80 backdrop-blur-2xl z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
          <h1 className="text-xl font-[900] italic uppercase tracking-[-0.05em] text-white/90">
            Beat <span className="text-teal-500">Editor</span>
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-90"
        >
          <X className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* 2. 增强版仪表盘 - 压缩间距 */}
      <div className="px-4 py-2 bg-gradient-to-b from-[#020617] to-slate-900/40 border-b border-white/5 flex flex-col gap-2 shrink-0">

        <div className="flex flex-row items-center justify-center gap-6 w-full px-[10px]">
          {/* 左侧：播放按钮 */}
          <div className="flex items-center w-fit">
            <Metronome
              pattern={useMemo(() => buildBeatPattern(), [buildBeatPattern])}
              isPlaying={isPlaying}
              onPlayStateChange={setIsPlaying}
              onBeatStepChange={handleBeatStepChange}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2 w-full sm:w-auto">
            {/* 右侧上面：Tempo */}
            <div className="flex items-center gap-2.5">
              {/* BPM 仪表板 */}
              <div className="flex-1 sm:flex-none flex flex-col gap-1 min-w-[100px]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-teal-500/50 leading-tight">Tempo</span>
                  <span className="text-base font-black italic text-teal-400 tabular-nums leading-tight tracking-tighter">{bpm} <small className="text-[10px] opacity-40">BPM</small></span>
                </div>
                <input
                  type="range" min="60" max="200" value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full sm:w-36 accent-teal-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* 右侧下面：Length 和 Swing */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-white/20 leading-tight">Length</span>
                <select
                  value={patternLength}
                  onChange={(e) => {
                    const newLength = Number(e.target.value);
                    setPatternLength(newLength);
                    setPattern(prev => {
                      const newPattern = [...prev];
                      while (newPattern.length < newLength) newPattern.push([]);
                      while (newPattern.length > newLength) newPattern.pop();
                      return newPattern;
                    });
                    setCurrentPage(0);
                  }}
                  className="bg-transparent text-[10px] sm:text-xs font-black text-teal-400 focus:outline-none appearance-none cursor-pointer leading-tight"
                >
                  {[4, 8, 12, 16, 24, 32].map(len => (
                    <option key={len} value={len} className="bg-[#0f172a] text-white">{len} STEPS</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-px bg-white/10 hidden sm:block" />

              <div className="flex flex-col gap-1 flex-1 max-w-[100px] h-[28px]">
                <div className="flex justify-between items-center pr-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-white/20 leading-tight">Swing</span>
                  <span className="text-[10px] sm:text-xs font-black italic tabular-nums text-teal-400 leading-tight">{swing}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={swing}
                  onChange={(e) => setSwing(Number(e.target.value))}
                  className="w-full accent-teal-500 h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分页控制器容器 - 独立容器 */}
      <div className="px-4 py-2 border-b border-white/5 shrink-0">
        <PageNavigator
          patternLength={patternLength}
          currentPage={currentPage}
          isPlaying={isPlaying}
          currentStep={currentStep}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 3. 沉浸式网格编辑区 - 紧凑化布局 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#020617]">
        <div className="flex-1 flex flex-col p-2 sm:p-4 relative min-h-0 overflow-y-auto">

          {/* 网格核心容器 - 减小圆角 */}
          <div className="flex-1 border border-white/10 rounded-xl overflow-hidden bg-slate-900/30 backdrop-blur-sm shadow-xl flex flex-col">

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {drumConfigs.map((drum) => {
                const isSolo = soloDrum === drum.type;
                const anySolo = soloDrum !== null;
                const isDisabled = anySolo && !isSolo;

                return (
                  <div
                    key={drum.type}
                    className={`flex border-b border-white/5 last:border-0 transition-opacity duration-300 ${isDisabled ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {/* 左侧固定：组合按钮 - 左边2/3是Solo，右边1/3是编辑 */}
                    <div className="w-20 sm:w-28 bg-[#0f172a]/95 backdrop-blur-2xl px-2 py-1.5 sm:px-3 sm:py-2 border-r border-white/10 flex items-center shrink-0 sticky left-0 z-20">
                      <div className="w-full flex rounded-lg overflow-hidden border border-white/10 h-14">
                        {/* 左边2/3：Solo功能 */}
                        <button
                          onClick={() => {
                            setSoloDrum(isSolo ? null : drum.type);
                            setSelectedDrumType(drum.type);
                            playDrumPreview(drum.type);
                          }}
                          className={`flex-[2] h-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all relative overflow-hidden group flex items-center justify-center ${isSolo
                            ? `${drum.color} text-white shadow-lg shadow-teal-500/10`
                            : 'bg-white/5 text-white/30 hover:bg-white/10'
                            }`}
                        >
                          <div className="relative z-10 flex flex-col items-center">
                            <span>{drum.label}</span>
                            {isSolo && <span className="text-[6px] italic opacity-60 leading-none mt-0.5">SOLO</span>}
                          </div>
                        </button>
                        {/* 右边1/3：编辑入口 */}
                        <button
                          onClick={() => openEditDrumModal(drum)}
                          className="flex-1 h-full bg-white/5 hover:bg-blue-500/20 text-white/40 hover:text-blue-400 transition-colors border-l border-white/10 flex items-center justify-center"
                          title="编辑"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 右侧：当页步进 - 减小间距与圆角 */}
                    <div className="flex-1 flex p-1.5 sm:p-3 gap-1.5 sm:gap-3 items-center">
                      {Array.from({ length: 4 }).map((_, i) => {
                        const stepIndex = currentPage * 4 + i;
                        const isActive = isCellActive(stepIndex, drum.type);
                        const isCurrentStep = isPlaying && currentStep === stepIndex;
                        const isMajorBeat = stepIndex % 4 === 0;

                        return (
                          <button
                            key={stepIndex}
                            onClick={() => handleCellClick(stepIndex, drum.type)}
                            disabled={stepIndex >= patternLength}
                            className={`flex-1 aspect-square sm:aspect-video sm:h-14 rounded-lg transition-all relative group/step ${stepIndex >= patternLength ? 'opacity-0 pointer-events-none' : ''
                              } ${isActive
                                ? `${drum.color} shadow-lg shadow-teal-500/20 z-10`
                                : isMajorBeat ? 'bg-white/10 hover:bg-white/15' : 'bg-white/[0.04] hover:bg-white/10'
                              }`}
                          >
                            {/* 强拍标记 */}
                            {isMajorBeat && !isActive && (
                              <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full" />
                            )}

                            {/* 播放头扫描线 - 紧凑型 */}
                            {isCurrentStep && (
                              <div className={`absolute inset-0 rounded-lg border-2 border-teal-400 ${isActive ? 'bg-white/20' : 'bg-teal-500/20'}`}>
                                <div className="absolute inset-0 bg-teal-500/5 blur-md rounded-lg -z-10" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* 添加音色按钮 - 放在列表底部 */}
              {(Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[]).filter(type => !drumConfigs.some(d => d.type === type)).length > 0 && (
                <div className="flex border-b border-white/5">
                  <div className="w-20 sm:w-28 bg-[#0f172a]/95 backdrop-blur-2xl px-2 py-1.5 sm:px-3 sm:py-2 border-r border-white/10 flex items-center shrink-0 sticky left-0 z-20">
                    <button
                      onClick={() => {
                        const availableTypes = (Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[]).filter(type => !drumConfigs.some(d => d.type === type));
                        if (availableTypes.length > 0) {
                          setNewDrumType(availableTypes[0]);
                          const defaultConfig = AVAILABLE_DRUM_TYPES[availableTypes[0]];
                          setNewDrumLabel('');
                          setNewDrumColor(defaultConfig.color);
                          setShowAddDrumModal(true);
                        }
                      }}
                      className="w-full h-14 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:border-teal-500/50 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>添加</span>
                    </button>
                  </div>
                  <div className="flex-1 flex p-1.5 sm:p-3 gap-1.5 sm:gap-3 items-center">
                    {/* 占位空间，保持布局一致 */}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-1 aspect-square sm:aspect-video sm:h-14" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部播放头提示 - 压缩高度 */}
            <div className="flex border-t border-white/10 bg-black/40 p-1.5 sm:p-2">
              <div className="w-20 sm:w-28 border-r border-white/10 flex items-center justify-center">
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-teal-500/20 tracking-[0.2em] leading-tight">Timeline</span>
              </div>
              <div className="flex-1 flex gap-1.5 sm:gap-3 px-1.5 sm:px-3">
                {Array.from({ length: 4 }).map((_, i) => {
                  const stepIndex = currentPage * 4 + i;
                  const isCurrentStep = isPlaying && currentStep === stepIndex;
                  return (
                    <div
                      key={stepIndex}
                      className={`flex-1 text-center text-[10px] sm:text-xs font-black italic leading-tight ${isCurrentStep ? 'text-teal-400' : 'text-white/10'
                        }`}
                    >
                      {stepIndex < patternLength ? String(stepIndex + 1).padStart(2, '0') : '--'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. 底栏操作 - 极致紧凑 Grid */}
        <div className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 border-t border-white/10 bg-[#020617]/95 backdrop-blur-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:flex sm:items-center sm:justify-between gap-1.5 sm:gap-2">

              {/* 操作区 */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={handleClear}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-2 bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">Clear</span>
                </button>
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-2 bg-blue-500/5 text-blue-400/60 hover:text-blue-400 border border-blue-500/10 rounded-lg transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-tight">Load</span>
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex-[2] sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-500 text-white font-black rounded-lg transition-all hover:bg-teal-400 active:scale-95 shadow-lg shadow-teal-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-tight">STORE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
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
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmSave}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors text-sm"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">加载节拍模式</h3>
              <button onClick={() => setShowLoadModal(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {savedPatterns.length === 0 ? (
                <div className="text-center text-slate-500 py-12">暂无保存的模式</div>
              ) : (
                [...savedPatterns].reverse().map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors group">
                    <div className="flex-1 cursor-pointer" onClick={() => loadPattern(p)}>
                      <div className="font-bold text-teal-400">{p.name}</div>
                      <div className="text-xs text-slate-400 flex gap-3 mt-1">
                        <span>{p.bpm} BPM</span>
                        <span>{p.length} 步</span>
                        <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
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

      {/* Add Drum Modal */}
      {showAddDrumModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">添加音色</h3>
              <button onClick={() => setShowAddDrumModal(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">音色类型</label>
                {(Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[]).filter(type => !drumConfigs.some(d => d.type === type)).length === 0 ? (
                  <div className="w-full bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-white/50 text-center">
                    所有音色类型已添加
                  </div>
                ) : (
                  <>
                    <select
                      value={newDrumType}
                      onChange={(e) => {
                        const type = e.target.value as DrumType;
                        setNewDrumType(type);
                        const defaultConfig = AVAILABLE_DRUM_TYPES[type];
                        setNewDrumLabel(defaultConfig.label);
                        setNewDrumColor(defaultConfig.color);
                      }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {(Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[])
                        .filter(type => !drumConfigs.some(d => d.type === type))
                        .map(type => (
                          <option key={type} value={type} className="bg-slate-700">
                            {AVAILABLE_DRUM_TYPES[type].label}
                          </option>
                        ))}
                    </select>
                    {drumConfigs.some(d => d.type === newDrumType) && (
                      <p className="text-xs text-red-400 mt-1">该音色类型已存在</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">显示名称</label>
                <input
                  type="text"
                  value={newDrumLabel}
                  onChange={(e) => setNewDrumLabel(e.target.value)}
                  placeholder={AVAILABLE_DRUM_TYPES[newDrumType].label}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">颜色</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setNewDrumColor(color.value)}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newDrumColor === color.value
                          ? 'border-teal-400 ring-2 ring-teal-400/50'
                          : 'border-slate-600 hover:border-slate-500'
                      } ${color.value}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddDrumModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddDrum}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={drumConfigs.some(d => d.type === newDrumType) || (Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[]).filter(type => !drumConfigs.some(d => d.type === type)).length === 0}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drum Modal */}
      {showEditDrumModal && editingDrum && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">编辑音色</h3>
              <button onClick={() => setShowEditDrumModal(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">音色类型</label>
                <select
                  value={editDrumType}
                  onChange={(e) => {
                    const type = e.target.value as DrumType;
                    setEditDrumType(type);
                    // 更换音色类型时，不修改名字，只更新颜色为默认颜色
                    const defaultConfig = AVAILABLE_DRUM_TYPES[type];
                    setNewDrumColor(defaultConfig.color);
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {(Object.keys(AVAILABLE_DRUM_TYPES) as DrumType[]).map(type => {
                    const isUsed = drumConfigs.some(d => d.type === type && d.type !== editingDrum.type);
                    return (
                      <option 
                        key={type} 
                        value={type} 
                        className="bg-slate-700"
                        disabled={isUsed}
                      >
                        {AVAILABLE_DRUM_TYPES[type].label}{isUsed ? ' (已使用)' : ''}
                      </option>
                    );
                  })}
                </select>
                {editDrumType !== editingDrum.type && drumConfigs.some(d => d.type === editDrumType && d.type !== editingDrum.type) && (
                  <p className="text-xs text-red-400 mt-1">该音色类型已被使用</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">颜色</label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setNewDrumColor(color.value)}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newDrumColor === color.value
                          ? 'border-teal-400 ring-2 ring-teal-400/50'
                          : 'border-slate-600 hover:border-slate-500'
                      } ${color.value}`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  if (drumConfigs.length <= 1) {
                    return;
                  }
                  handleDeleteDrum(editingDrum.type);
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={drumConfigs.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditDrumModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleEditDrum}
                  className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editDrumType !== editingDrum.type && drumConfigs.some(d => d.type === editDrumType && d.type !== editingDrum.type)}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && drumToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400">确认删除</h3>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDrumToDelete(null);
                }} 
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 leading-relaxed">
                确定要删除这个音色吗？删除后该音色在所有步骤中的设置将被清除。
              </p>
              {drumConfigs.find(d => d.type === drumToDelete) && (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${drumConfigs.find(d => d.type === drumToDelete)?.color || 'bg-gray-500'}`} />
                    <span className="font-medium text-white">
                      {drumConfigs.find(d => d.type === drumToDelete)?.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDrumToDelete(null);
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteDrum}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeatEditor;
