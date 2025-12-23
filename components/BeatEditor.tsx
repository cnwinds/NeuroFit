/**
 * 节奏编辑器主组件
 * 类似 GarageBand 的节拍音序器界面
 */

import React, { useState, useEffect, useRef } from 'react';
import { BeatPattern, DrumStep, DrumType } from '../beats';
import { getBeatPlayer, getBeatCache, convertLegacyPattern } from '../beats';
import { X, Save, Download, Upload, Play, Pause, Square } from 'lucide-react';
import BeatGrid from './BeatGrid';
import BeatControls from './BeatControls';
import BeatLibrary from './BeatLibrary';

interface Props {
  onClose: () => void;
  onSelect?: (pattern: BeatPattern) => void; // 选择节奏后回调
}

const BeatEditor: React.FC<Props> = ({ onClose, onSelect }) => {
  const [pattern, setPattern] = useState<BeatPattern>({
    bpm: 120,
    pattern: [
      { type: 'kick', velocity: 127 },
      { type: 'hihat', velocity: 80 },
      { type: 'snare', velocity: 100 },
      { type: 'hihat', velocity: 80 },
    ],
    timeSignature: [4, 4],
    swing: 0,
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(16); // 默认16步
  const [showLibrary, setShowLibrary] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const playerRef = useRef<ReturnType<typeof getBeatPlayer> | null>(null);
  
  // 初始化 AudioContext
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({
      sampleRate: 24000,
      latencyHint: 'interactive',
    });
    
    const cache = getBeatCache();
    cache.setAudioContext(audioContextRef.current);
    
    // 清理旧缓存，确保使用新的合成算法
    cache.clear();
    
    const player = getBeatPlayer();
    player.setAudioContext(audioContextRef.current);
    player.setOnStepChange((step) => {
      setCurrentStep(step);
    });
    playerRef.current = player;
    
    // 预生成常用鼓点（在后台进行）
    cache.pregenerateAll().catch((error) => {
      console.error('Failed to pregenerate drums:', error);
    });
    
    return () => {
      audioContextRef.current?.close();
    };
  }, []);
  
  // 更新模式步数
  useEffect(() => {
    const currentLength = Array.isArray(pattern.pattern) ? pattern.pattern.length : 0;
    if (currentLength !== steps) {
      const newPattern: DrumStep[] = [];
      const currentPattern = pattern.pattern;
      
      for (let i = 0; i < steps; i++) {
        if (i < currentLength && currentPattern[i]) {
          const step = currentPattern[i];
          if (typeof step === 'number') {
            newPattern.push(convertLegacyPattern([step])[0]);
          } else {
            newPattern.push(step);
          }
        } else {
          // 填充空步骤
          newPattern.push({ type: 'kick', velocity: 0 });
        }
      }
      setPattern({ ...pattern, pattern: newPattern });
    }
  }, [steps, pattern.pattern.length]);
  
  // 实时更新播放器中的 pattern（使用 useRef 避免过度更新）
  const patternRef = useRef<BeatPattern>(pattern);
  patternRef.current = pattern;
  
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      // 转换旧格式（如果有）
      const convertedPattern: BeatPattern = {
        ...patternRef.current,
        pattern: patternRef.current.pattern.map((step) => {
          if (typeof step === 'number') {
            return convertLegacyPattern([step])[0];
          }
          return step;
        }) as DrumStep[],
      };
      
      // 实时更新播放器
      playerRef.current.updatePattern(convertedPattern);
    }
  }, [pattern.bpm, pattern.pattern, pattern.timeSignature, pattern.swing, isPlaying]);
  
  // 处理网格点击
  const handleCellClick = (row: DrumType, col: number) => {
    const newPattern = [...pattern.pattern] as DrumStep[];
    if (col < newPattern.length) {
      const step = newPattern[col];
      if (step && step.type === row && step.velocity > 0) {
        // 关闭
        newPattern[col] = { type: row, velocity: 0 };
      } else {
        // 开启（默认力度）
        newPattern[col] = { type: row, velocity: 127 };
        
        // 如果正在播放，立即播放这个鼓点（实时反馈）
        if (isPlaying && audioContextRef.current && playerRef.current) {
          const cache = getBeatCache();
          const buffer = cache.getBuffer(row, 127);
          if (buffer) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
          }
        }
      }
      setPattern({ ...pattern, pattern: newPattern });
    }
  };
  
  // 处理力度调整
  const handleVelocityChange = (col: number, velocity: number) => {
    const newPattern = [...pattern.pattern] as DrumStep[];
    if (col < newPattern.length && newPattern[col]) {
      newPattern[col] = { ...newPattern[col], velocity };
      setPattern({ ...pattern, pattern: newPattern });
    }
  };
  
  // 播放/暂停
  const handlePlayPause = async () => {
    if (!audioContextRef.current || !playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // 确保 AudioContext 已恢复（浏览器要求用户交互）
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // 确保缓存已生成（如果还没有）
        const cache = getBeatCache();
        const patternSteps = pattern.pattern as DrumStep[];
        
        // 检查并预生成需要的鼓点
        const neededTypes = new Set<DrumType>();
        const neededVelocities = new Set<number>();
        
        patternSteps.forEach((step) => {
          if (step && step.velocity > 0) {
            neededTypes.add(step.type);
            neededVelocities.add(step.velocity);
          }
        });
        
        // 预生成缺失的鼓点
        const pregenPromises: Promise<AudioBuffer>[] = [];
        neededTypes.forEach((type) => {
          neededVelocities.forEach((velocity) => {
            const buffer = cache.getBuffer(type, velocity);
            if (!buffer) {
              pregenPromises.push(cache.pregenerateDrum(type, velocity));
            }
          });
        });
        
        // 等待预生成完成
        if (pregenPromises.length > 0) {
          await Promise.all(pregenPromises);
        }
        
        // 转换旧格式（如果有）
        const convertedPattern: BeatPattern = {
          ...pattern,
          pattern: patternSteps.map((step) => {
            if (typeof step === 'number') {
              return convertLegacyPattern([step])[0];
            }
            return step;
          }) as DrumStep[],
        };
        
        playerRef.current.start(convertedPattern);
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to start playback:', error);
        alert('播放失败，请检查浏览器音频权限');
      }
    }
  };
  
  // 停止
  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };
  
  // 保存到本地存储
  const handleSave = () => {
    const saved = localStorage.getItem('beatPatterns');
    const patterns: Array<{ name: string; pattern: BeatPattern; timestamp: number }> = saved
      ? JSON.parse(saved)
      : [];
    
    const name = prompt('输入节奏名称:');
    if (name) {
      patterns.push({
        name,
        pattern,
        timestamp: Date.now(),
      });
      localStorage.setItem('beatPatterns', JSON.stringify(patterns));
      alert('保存成功！');
    }
  };
  
  // 加载
  const handleLoad = (loadedPattern: BeatPattern) => {
    setPattern(loadedPattern);
    setSteps(loadedPattern.pattern.length);
    setShowLibrary(false);
  };
  
  // 导出 JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(pattern, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beat-pattern-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // 导入 JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const loaded = JSON.parse(e.target?.result as string) as BeatPattern;
            setPattern(loaded);
            setSteps(loaded.pattern.length);
          } catch (error) {
            alert('导入失败：文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h1 className="text-2xl font-black text-white uppercase italic">节奏编辑器</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold"
          >
            节奏库
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 控制面板 */}
          <BeatControls
            bpm={pattern.bpm}
            steps={steps}
            swing={pattern.swing || 0}
            timeSignature={pattern.timeSignature || [4, 4]}
            isPlaying={isPlaying}
            currentStep={currentStep}
            onBpmChange={(bpm) => setPattern({ ...pattern, bpm })}
            onStepsChange={setSteps}
            onSwingChange={(swing) => setPattern({ ...pattern, swing })}
            onTimeSignatureChange={(ts) => setPattern({ ...pattern, timeSignature: ts })}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
          />
          
          {/* 网格音序器 */}
          <BeatGrid
            pattern={pattern.pattern as DrumStep[]}
            steps={steps}
            currentStep={currentStep}
            isPlaying={isPlaying}
            onCellClick={handleCellClick}
            onVelocityChange={handleVelocityChange}
          />
        </div>
      </div>
      
      {/* 节奏库侧边栏 */}
      {showLibrary && (
        <BeatLibrary
          onClose={() => setShowLibrary(false)}
          onLoad={handleLoad}
          onSelect={onSelect}
        />
      )}
    </div>
  );
};

export default BeatEditor;

