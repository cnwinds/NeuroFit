/**
 * 完成效果组件
 * 根据评分显示不同的视觉效果和音效
 */

import React, { useEffect } from 'react';
import { ActionScore } from '../actions/base/types';
import { getScoreText, getScoreColor } from '../services/scoreCalculator';
import { getAudioEngine } from '../beats/audioEngine';

interface CompletionEffectProps {
  score: ActionScore;
  onComplete: () => void;
}

export const CompletionEffect: React.FC<CompletionEffectProps> = ({
  score,
  onComplete
}) => {
  useEffect(() => {
    const engine = getAudioEngine();

    // 根据评分播放不同的音效
    switch (score) {
      case ActionScore.EXCELLENT: engine.playExcellent(); break;
      case ActionScore.GOOD: engine.playGood(); break;
      case ActionScore.BAD: engine.playBad(); break;
      case ActionScore.MISS: engine.playMiss(); break;
    }
  }, [score]);

  // 3秒后自动完成
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1500); // 缩短完成效果时间，提高节奏感

    return () => clearTimeout(timer);
  }, [onComplete]);

  const scoreText = getScoreText(score);
  const scoreColor = getScoreColor(score);

  const getBackgroundClass = () => {
    switch (score) {
      case ActionScore.EXCELLENT: return 'bg-yellow-500/20';
      case ActionScore.GOOD: return 'bg-green-500/20';
      case ActionScore.BAD: return 'bg-orange-500/20';
      case ActionScore.MISS: return 'bg-red-500/20';
      default: return 'bg-black/40';
    }
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-md z-[100] transition-all duration-300 ${getBackgroundClass()}`}>
      <div className={`text-7xl md:text-9xl font-black italic tracking-tighter animate-ping-short ${scoreColor}`} style={{ textShadow: '0 0 30px currentColor' }}>
        {scoreText}
      </div>
    </div>
  );
};
