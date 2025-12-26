/**
 * 动作节拍编辑器
 * 为每个 Action 编辑和保存节拍配置
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Play, Pause, Save, ArrowLeft, Music, CheckCircle2, AlertCircle, Plus, Trash2, Pencil, Lock } from 'lucide-react';
import { getAllActions, type ActionComponent } from '../actions';
import Metronome from './Metronome';
import PageNavigator from './PageNavigator';
import { type DrumType, type DrumStep, type BeatPattern, getAudioEngine } from '../beats';
import { loadGuideData } from '../actions/base/guideLoader';
import type { GuideData } from '../actions/base/types';
import { GuidePreview } from './GuidePreview';

interface ActionBeatEditorProps {
  onClose?: () => void;
}

// 音色类型定义
type DrumConfig = {
  type: DrumType;
  label: string;
  color: string;
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

// 默认音色配置
const DEFAULT_DRUM_CONFIGS: DrumConfig[] = [
  { type: 'kick', ...AVAILABLE_DRUM_TYPES.kick },
  { type: 'snare', ...AVAILABLE_DRUM_TYPES.snare },
  { type: 'hihat', ...AVAILABLE_DRUM_TYPES.hihat },
];

const ActionBeatEditor: React.FC<ActionBeatEditorProps> = ({ onClose }) => {
  // 动作列表状态
  const [actions, setActions] = useState<ActionComponent[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 编辑器状态
  const [bpm, setBpm] = useState(60);
  const [swing, setSwing] = useState(0);
  const [patternLength, setPatternLength] = useState(8);
  const [pattern, setPattern] = useState<DrumStep[][]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [drumConfigs, setDrumConfigs] = useState<DrumConfig[]>(DEFAULT_DRUM_CONFIGS);
  const [soloDrum, setSoloDrum] = useState<DrumType | null>(null);
  
  // 音色管理状态
  const [showAddDrumModal, setShowAddDrumModal] = useState(false);
  const [showEditDrumModal, setShowEditDrumModal] = useState(false);
  const [editingDrum, setEditingDrum] = useState<DrumConfig | null>(null);
  const [newDrumType, setNewDrumType] = useState<DrumType>('kick');
  const [newDrumLabel, setNewDrumLabel] = useState('');
  const [newDrumColor, setNewDrumColor] = useState('bg-blue-500');
  const [editDrumType, setEditDrumType] = useState<DrumType>('kick');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [drumToDelete, setDrumToDelete] = useState<DrumType | null>(null);
  
  // Guide数据状态
  const [guideData, setGuideData] = useState<GuideData | null>(null);
  const [guidePreviewStep, setGuidePreviewStep] = useState(0);
  const [guidePreviewProgress, setGuidePreviewProgress] = useState(0);
  
  const audioEngineRef = useRef<ReturnType<typeof getAudioEngine> | null>(null);
  const currentPageRef = useRef(0);
  const guideAnimationRef = useRef<number | null>(null);
  const currentStepStartTimeRef = useRef<number>(0);

  // 加载所有动作
  useEffect(() => {
    const allActions = getAllActions();
    setActions(allActions);
  }, []);

  // 同步 Ref
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // 初始化音频引擎
  useEffect(() => {
    const initEngine = async () => {
      const engine = getAudioEngine();
      await engine.initialize();
      audioEngineRef.current = engine;
    };
    initEngine();
  }, []);

  // 加载选中动作的节拍
  useEffect(() => {
    if (selectedAction) {
      const beat = selectedAction.Beat;
      setBpm(beat.bpm);
      setSwing(beat.swing || 0);
      
      // 处理 pattern
      let patternArray: DrumStep[][] = [];
      if (Array.isArray(beat.pattern)) {
        if (beat.pattern.length > 0 && Array.isArray(beat.pattern[0])) {
          // 已经是 DrumStep[][]
          patternArray = beat.pattern as DrumStep[][];
        } else {
          // 是 DrumStep[]，转换为 DrumStep[][]
          patternArray = (beat.pattern as DrumStep[]).map(step => [step]);
        }
      }
      
      setPatternLength(patternArray.length || 8);
      setPattern(patternArray);
      setCurrentPage(0);
      setCurrentStep(0);

      // 检测是否有 guide 数据
      if (beat.totalBeats) {
        loadGuideData(selectedAction.englishName).then(setGuideData);
      } else {
        setGuideData(null);
      }
    }
  }, [selectedAction]);

  // 初始化默认模式
  useEffect(() => {
    if (pattern.length === 0 && patternLength > 0) {
      setPattern(Array(patternLength).fill(null).map(() => []));
    }
  }, [patternLength, pattern.length]);

  // Guide 预览平滑动画
  useEffect(() => {
    if (!isPlaying || !guideData) {
      if (guideAnimationRef.current) {
        cancelAnimationFrame(guideAnimationRef.current);
        guideAnimationRef.current = null;
      }
      return;
    }

    const animate = () => {
      const now = performance.now();
      const elapsed = now - currentStepStartTimeRef.current;
      const beatDurationMs = (60 / bpm) * 1000;
      const stepDurationMs = beatDurationMs / 4; // 每个步进的时长（1/4拍）

      const progress = Math.min(elapsed / stepDurationMs, 1);
      setGuidePreviewProgress(progress);

      guideAnimationRef.current = requestAnimationFrame(animate);
    };

    guideAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (guideAnimationRef.current) {
        cancelAnimationFrame(guideAnimationRef.current);
        guideAnimationRef.current = null;
      }
    };
  }, [isPlaying, guideData, bpm]);

  // 停止播放时重置 Guide 预览
  useEffect(() => {
    if (!isPlaying && guideData) {
      if (guideAnimationRef.current) {
        cancelAnimationFrame(guideAnimationRef.current);
        guideAnimationRef.current = null;
      }
      setGuidePreviewStep(0);
      setGuidePreviewProgress(0);
    }
  }, [isPlaying, guideData]);

  // 切换单元格状态
  const toggleCell = useCallback((stepIndex: number, drumType: DrumType) => {
    setPattern(prev => {
      const newPattern = [...prev];
      
      while (newPattern.length <= stepIndex) {
        newPattern.push([]);
      }
      
      const stepDrums = newPattern[stepIndex] || [];
      const stepDrumsCopy = [...stepDrums];
      const existingDrumIndex = stepDrumsCopy.findIndex(d => d.type === drumType);
      
      if (existingDrumIndex >= 0) {
        stepDrumsCopy.splice(existingDrumIndex, 1);
      } else {
        const defaultVolume = drumType === 'kick' ? 0.9 : 0.6;
        stepDrumsCopy.push({ type: drumType, volume: defaultVolume });
      }
      
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
        
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            const volume = drumType === 'kick' ? 0.9 : 0.6;
            engine.playDrum(drumType, volume, 0);
          }).catch(console.error);
        } else {
          const volume = drumType === 'kick' ? 0.9 : 0.6;
          engine.playDrum(drumType, volume, 0);
        }
      } catch (error) {
        console.error('播放试听声音失败:', error);
      }
    }
  }, []);

  // 处理单元格点击
  const handleCellClick = useCallback((stepIndex: number, drumType: DrumType) => {
    const step = pattern[stepIndex];
    const isCurrentlyActive = step && Array.isArray(step) &&
      step.some(d => d.type === drumType && (d.volume || 0) > 0);
    
    toggleCell(stepIndex, drumType);
    
    if (!isCurrentlyActive) {
      playDrumPreview(drumType);
    }
  }, [toggleCell, pattern, playDrumPreview]);

  // 构建节拍模式
  const buildBeatPattern = useCallback((): BeatPattern => {
    const patternArray: DrumStep[][] = Array(patternLength);

    for (let i = 0; i < patternLength; i++) {
      if (i < pattern.length && pattern[i] !== undefined && pattern[i] !== null) {
        let step = pattern[i];
        if (!Array.isArray(step)) {
          step = [step];
        }
        if (soloDrum) {
          patternArray[i] = step.filter(d => d.type === soloDrum);
        } else {
          patternArray[i] = step;
        }
      } else {
        patternArray[i] = [];
      }
    }

    for (let i = 0; i < patternLength; i++) {
      if (patternArray[i] === undefined || patternArray[i] === null) {
        patternArray[i] = [];
      }
    }

    const result: BeatPattern = {
      bpm,
      pattern: patternArray,
      timeSignature: [4, 4],
      swing
    };

    if (guideData && guideData.totalBeats) {
      result.totalBeats = guideData.totalBeats;
      result.beatFrameMapping = guideData.markedFrameIndices || [];
    }

    return result;
  }, [bpm, swing, patternLength, pattern, soloDrum, guideData]);

  // 保存节拍到文件
  const handleSaveBeat = async () => {
    if (!selectedAction) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const beatPattern = buildBeatPattern();
      const actionName = selectedAction.englishName;

      const response = await fetch('/api/save-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionName,
          beatPattern
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSaveMessage({ 
          type: 'success', 
          text: `节拍已保存！文件已更新，刷新页面即可生效。` 
        });
        // 3秒后自动隐藏消息
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: `保存失败: ${result.error}` 
        });
      }
    } catch (error) {
      console.error('保存节拍失败:', error);
      setSaveMessage({ 
        type: 'error', 
        text: '保存失败，请查看控制台了解详情' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 音色管理函数
  const handleAddDrum = useCallback(() => {
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

    if (isTypeChanged && drumConfigs.some(d => d.type === newDrumType && d.type !== oldDrumType)) {
      alert('该音色类型已被使用！');
      return;
    }

    setDrumConfigs(prev => {
      if (isTypeChanged) {
        const defaultLabel = AVAILABLE_DRUM_TYPES[newDrumType].label;
        return prev.map(d => 
          d.type === oldDrumType 
            ? { type: newDrumType, label: defaultLabel, color: newDrumColor }
            : d
        );
      } else {
        return prev.map(d => 
          d.type === oldDrumType 
            ? { ...d, color: newDrumColor }
            : d
        );
      }
    });

    if (isTypeChanged) {
      setPattern(prev => prev.map(step => 
        Array.isArray(step) 
          ? step.map(d => d.type === oldDrumType ? { ...d, type: newDrumType } : d)
          : []
      ));
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

    setDrumConfigs(prev => prev.filter(d => d.type !== drumToDelete));
    setPattern(prev => prev.map(step => 
      Array.isArray(step) ? step.filter(d => d.type !== drumToDelete) : []
    ));

    if (soloDrum === drumToDelete) {
      setSoloDrum(null);
    }

    setShowDeleteConfirm(false);
    setDrumToDelete(null);
    
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

  // 处理节拍步进变化
  const handleBeatStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    const targetPage = Math.floor(step / 4);
    if (targetPage !== currentPageRef.current) {
      setCurrentPage(targetPage);
    }
    // 同步 Guide 预览 - 重置时间和进度
    currentStepStartTimeRef.current = performance.now();
    setGuidePreviewStep(step);
    setGuidePreviewProgress(0);
  }, []);

  // 检查单元格是否激活
  const isCellActive = useCallback((stepIndex: number, drumType: DrumType): boolean => {
    const step = pattern[stepIndex];
    if (!step || !Array.isArray(step)) {
      return false;
    }
    return step.some(d => d.type === drumType && (d.volume || 0) > 0);
  }, [pattern]);

  // 构建节拍模式（必须在条件渲染之前调用，遵守 Hooks 规则）
  const builtBeatPattern = useMemo(() => buildBeatPattern(), [buildBeatPattern]);

  // 如果没有选中动作，显示动作列表
  if (!selectedAction) {
    return (
      <div className="fixed inset-0 h-[100dvh] z-50 bg-[#020617] text-white flex flex-col font-sans overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#020617]/80 backdrop-blur-2xl z-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
            <h1 className="text-xl font-[900] italic uppercase tracking-[-0.05em] text-white/90">
              动作节拍 <span className="text-teal-500">编辑器</span>
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-90"
          >
            <X className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* 动作列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-4 text-white/80">选择要编辑的动作</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {actions.map(action => (
                <button
                  key={action.englishName}
                  onClick={() => setSelectedAction(action)}
                  className="p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                      <Music className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{action.name}</div>
                      <div className="text-xs text-slate-400">{action.englishName}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    BPM: {action.Beat.bpm} | {action.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 编辑视图
  return (
    <div className="fixed inset-0 h-[100dvh] z-50 bg-[#020617] text-white flex flex-col font-sans overflow-hidden max-h-[100dvh]">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#020617]/80 backdrop-blur-2xl z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedAction(null);
              setIsPlaying(false);
            }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-white/40 hover:text-white" />
          </button>
          <div className="w-1 h-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
          <h1 className="text-xl font-[900] italic uppercase tracking-[-0.05em] text-white/90">
            {selectedAction.name} <span className="text-teal-500">节拍</span>
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group active:scale-90"
        >
          <X className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* 浮动保存通知 - 不影响布局 */}
      {saveMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-fade-in max-w-md">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 ${
            saveMessage.type === 'success' 
              ? 'bg-teal-500/95 border-teal-400/50 shadow-teal-500/50' 
              : 'bg-red-500/95 border-red-400/50 shadow-red-500/50'
          }`}>
            <div className="flex items-center gap-3 flex-1">
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
              )}
              <span className="text-white font-bold text-sm">
                {saveMessage.text}
              </span>
            </div>
            <button
              onClick={() => setSaveMessage(null)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 仪表盘 */}
      <div className="px-4 py-2 bg-gradient-to-b from-[#020617] to-slate-900/40 border-b border-white/5 flex flex-col gap-2 shrink-0">
        <div className="flex flex-row items-center justify-center gap-6 w-full px-[10px]">
          {/* 播放按钮 */}
          <div className="flex items-center w-fit">
            <Metronome
              pattern={builtBeatPattern}
              isPlaying={isPlaying}
              onPlayStateChange={setIsPlaying}
              onBeatStepChange={handleBeatStepChange}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2 w-full sm:w-auto">
            {/* Tempo */}
            <div className="flex items-center gap-2.5">
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

            {/* Length 和 Swing */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-white/20 leading-tight">
                  Length
                  {guideData && <Lock className="w-3 h-3 inline ml-1 text-orange-400" />}
                </span>
                <select
                  value={patternLength}
                  disabled={guideData !== null}
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
                  className={`text-[10px] sm:text-xs font-black text-teal-400 focus:outline-none leading-tight ${
                    guideData ? 'bg-transparent opacity-50' : 'bg-transparent appearance-none cursor-pointer'
                  }`}
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

      {/* 分页控制器 */}
      <div className="px-4 py-2 border-b border-white/5 shrink-0">
        <PageNavigator
          patternLength={patternLength}
          currentPage={currentPage}
          isPlaying={isPlaying}
          currentStep={currentStep}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 网格编辑区 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#020617]">
        <div className="flex-1 flex flex-col p-2 sm:p-4 relative min-h-0 overflow-y-auto">
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
                    {/* 音色标签 - 左边2/3 Solo，右边1/3编辑 */}
                    <div className="w-20 sm:w-28 bg-[#0f172a]/95 backdrop-blur-2xl px-2 py-1.5 sm:px-3 sm:py-2 border-r border-white/10 flex items-center shrink-0 sticky left-0 z-20">
                      <div className="w-full flex rounded-lg overflow-hidden border border-white/10 h-14">
                        {/* 左边2/3：Solo功能 */}
                        <button
                          onClick={() => {
                            setSoloDrum(isSolo ? null : drum.type);
                            playDrumPreview(drum.type);
                          }}
                          className={`flex-[2] h-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all relative overflow-hidden group flex items-center justify-center ${
                            isSolo
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

                  {/* 步进格子 */}
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
                          className={`flex-1 aspect-square sm:aspect-video sm:h-14 rounded-lg transition-all relative ${
                            stepIndex >= patternLength ? 'opacity-0 pointer-events-none' : ''
                          } ${
                            isActive
                              ? `${drum.color} shadow-lg shadow-teal-500/20 z-10`
                              : isMajorBeat ? 'bg-white/10 hover:bg-white/15' : 'bg-white/[0.04] hover:bg-white/10'
                          }`}
                        >
                          {isMajorBeat && !isActive && (
                            <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full" />
                          )}
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

            {/* 底部播放头提示 */}
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
                      className={`flex-1 text-center text-[10px] sm:text-xs font-black italic leading-tight ${
                        isCurrentStep ? 'text-teal-400' : 'text-white/10'
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

        {/* 底栏操作 */}
        <div className="shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 border-t border-white/10 bg-[#020617]/95 backdrop-blur-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40">
          <div className="max-w-7xl mx-auto flex justify-center">
            <button
              onClick={handleSaveBeat}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 px-6 py-3 bg-teal-500 text-white font-black rounded-lg transition-all hover:bg-teal-400 active:scale-95 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm uppercase tracking-widest">
                {isSaving ? '保存中...' : '保存节拍文件'}
              </span>
            </button>
          </div>
        </div>
      </div>

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
                )}
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

      {/* Guide Preview Window */}
      {guideData && selectedAction && (
        <div className="fixed bottom-4 right-4 z-50 bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl" style={{ width: 'calc(50vw / 2)', maxWidth: '320px', aspectRatio: '4/3' }}>
          <div className="absolute top-2 left-2 bg-teal-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-black text-white z-10">
            Guide 预览
          </div>
          <GuidePreview guideData={guideData} beatStep={guidePreviewStep} beatProgress={guidePreviewProgress} />
        </div>
      )}
    </div>
  );
};

export default ActionBeatEditor;

