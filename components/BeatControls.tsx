/**
 * 播放控制组件
 */

import React from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface Props {
  bpm: number;
  steps: number;
  swing: number;
  timeSignature: [number, number];
  isPlaying: boolean;
  currentStep: number;
  onBpmChange: (bpm: number) => void;
  onStepsChange: (steps: number) => void;
  onSwingChange: (swing: number) => void;
  onTimeSignatureChange: (ts: [number, number]) => void;
  onPlayPause: () => void;
  onStop: () => void;
}

const BeatControls: React.FC<Props> = ({
  bpm,
  steps,
  swing,
  timeSignature,
  isPlaying,
  currentStep,
  onBpmChange,
  onStepsChange,
  onSwingChange,
  onTimeSignatureChange,
  onPlayPause,
  onStop,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* BPM 控制 */}
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">BPM</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value) || 120)}
              className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-center font-bold"
            />
          </div>
        </div>
        
        {/* 步数选择 */}
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">步数</label>
          <select
            value={steps}
            onChange={(e) => onStepsChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-bold"
          >
            <option value={8}>8 步</option>
            <option value={16}>16 步</option>
            <option value={32}>32 步</option>
          </select>
        </div>
        
        {/* 拍号 */}
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">拍号</label>
          <select
            value={`${timeSignature[0]}/${timeSignature[1]}`}
            onChange={(e) => {
              const [num, den] = e.target.value.split('/').map(Number);
              onTimeSignatureChange([num, den]);
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white font-bold"
          >
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="5/4">5/4</option>
            <option value="6/8">6/8</option>
          </select>
        </div>
        
        {/* 摇摆 */}
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">
            摇摆: {swing}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={swing}
            onChange={(e) => onSwingChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      
      {/* 播放控制 */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={onPlayPause}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-black rounded-lg font-black flex items-center gap-2"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button
          onClick={onStop}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-black flex items-center gap-2"
        >
          <Square className="w-5 h-5" />
          停止
        </button>
        <div className="text-white font-bold">
          当前位置: {currentStep + 1} / {steps}
        </div>
      </div>
    </div>
  );
};

export default BeatControls;

