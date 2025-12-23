/**
 * 节奏库组件
 * 管理保存和加载的节奏模式
 */

import React, { useState, useEffect } from 'react';
import { BeatPattern } from '../beats';
import { X, Trash2, Play } from 'lucide-react';

interface SavedPattern {
  name: string;
  pattern: BeatPattern;
  timestamp: number;
}

interface Props {
  onClose: () => void;
  onLoad: (pattern: BeatPattern) => void;
  onSelect?: (pattern: BeatPattern) => void;
}

const BeatLibrary: React.FC<Props> = ({ onClose, onLoad, onSelect }) => {
  const [patterns, setPatterns] = useState<SavedPattern[]>([]);
  
  useEffect(() => {
    loadPatterns();
  }, []);
  
  const loadPatterns = () => {
    const saved = localStorage.getItem('beatPatterns');
    if (saved) {
      try {
        setPatterns(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load patterns:', error);
      }
    }
  };
  
  const handleDelete = (index: number) => {
    if (confirm('确定要删除这个节奏吗？')) {
      const newPatterns = patterns.filter((_, i) => i !== index);
      setPatterns(newPatterns);
      localStorage.setItem('beatPatterns', JSON.stringify(newPatterns));
    }
  };
  
  const handleLoad = (pattern: BeatPattern) => {
    onLoad(pattern);
    if (onSelect) {
      onSelect(pattern);
    }
  };
  
  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-white/10 shadow-2xl z-50 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-black text-white uppercase">节奏库</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* 列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {patterns.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <p>还没有保存的节奏</p>
            <p className="text-sm mt-2">在编辑器中点击"保存"来保存节奏</p>
          </div>
        ) : (
          <div className="space-y-2">
            {patterns.map((item, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-teal-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      BPM: {item.pattern.bpm} | 步数: {item.pattern.pattern.length}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handleLoad(item.pattern)}
                  className="w-full mt-2 px-3 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  加载
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BeatLibrary;

