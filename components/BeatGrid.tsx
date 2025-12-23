/**
 * 网格音序器组件
 * 每行代表一种鼓点类型，每列代表一个节拍位置
 */

import React, { useState } from 'react';
import { DrumStep, DrumType } from '../beats';

interface Props {
  pattern: DrumStep[];
  steps: number;
  currentStep: number;
  isPlaying: boolean;
  onCellClick: (type: DrumType, col: number) => void;
  onVelocityChange: (col: number, velocity: number) => void;
}

const DRUM_TYPES: Array<{ type: DrumType; label: string; color: string }> = [
  { type: 'kick', label: 'Kick', color: 'bg-red-500' },
  { type: 'snare', label: 'Snare', color: 'bg-blue-500' },
  { type: 'hihat', label: 'Hi-Hat', color: 'bg-yellow-500' },
  { type: 'crash', label: 'Crash', color: 'bg-purple-500' },
  { type: 'openHihat', label: 'Open HH', color: 'bg-orange-500' },
  { type: 'rimshot', label: 'Rim', color: 'bg-green-500' },
];

const BeatGrid: React.FC<Props> = ({
  pattern,
  steps,
  currentStep,
  isPlaying,
  onCellClick,
  onVelocityChange,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const getCellState = (type: DrumType, col: number): { active: boolean; velocity: number } => {
    if (col >= pattern.length) {
      return { active: false, velocity: 0 };
    }

    const step = pattern[col];
    if (!step) {
      return { active: false, velocity: 0 };
    }

    if (typeof step === 'number') {
      // 旧格式兼容
      return { active: false, velocity: 0 };
    }

    return {
      active: step.type === type && step.velocity > 0,
      velocity: step.type === type ? step.velocity : 0,
    };
  };

  const getCellColor = (type: DrumType, col: number, isActive: boolean, velocity: number): string => {
    const drum = DRUM_TYPES.find((d) => d.type === type);
    if (!drum) return 'bg-slate-700';

    if (!isActive) {
      return 'bg-slate-800 hover:bg-slate-700';
    }

    // 根据力度调整亮度
    const brightness = 0.3 + (velocity / 127) * 0.7;
    const baseColor = drum.color;

    // 简化处理：使用透明度表示力度
    return `${baseColor} opacity-${Math.round(brightness * 100)}`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 border border-white/10">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* 表头 */}
          <div className="flex mb-2">
            <div className="w-24 flex-shrink-0"></div>
            <div className="flex gap-1">
              {Array.from({ length: steps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-8 flex items-center justify-center text-xs font-bold rounded ${isPlaying && currentStep === i
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                    }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* 网格行 */}
          {DRUM_TYPES.map((drum, rowIndex) => (
            <div key={drum.type} className="flex items-center mb-1">
              {/* 行标签 */}
              <div className="w-24 flex-shrink-0 flex items-center justify-end pr-4">
                <span className="text-sm font-bold text-white">{drum.label}</span>
              </div>

              {/* 单元格 */}
              <div className="flex gap-1">
                {Array.from({ length: steps }).map((_, col) => {
                  const { active, velocity } = getCellState(drum.type, col);
                  const isCurrent = isPlaying && currentStep === col;

                  return (
                    <div
                      key={col}
                      className="relative group"
                      onClick={() => onCellClick(drum.type, col)}
                    >
                      <button
                        className={`w-12 h-12 rounded transition-all ${active
                            ? `${drum.color} opacity-${Math.max(30, Math.round((velocity / 127) * 70 + 30))}`
                            : 'bg-slate-800 hover:bg-slate-700'
                          } ${isCurrent ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-900' : ''
                          }`}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingCell({ row: rowIndex, col });
                        }}
                      >
                        {active && (
                          <div className="text-xs font-bold text-white">
                            {Math.round((velocity / 127) * 100)}%
                          </div>
                        )}
                      </button>

                      {/* 力度调整提示 */}
                      {editingCell?.row === rowIndex && editingCell?.col === col && (
                        <div
                          className="absolute top-14 left-0 z-10 bg-slate-800 p-2 rounded border border-white/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="range"
                            min="0"
                            max="127"
                            value={velocity}
                            onChange={(e) => {
                              onVelocityChange(col, parseInt(e.target.value));
                            }}
                            className="w-32"
                            autoFocus
                            onBlur={() => setEditingCell(null)}
                          />
                          <div className="text-xs text-white mt-1 text-center">{velocity}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BeatGrid;

