/**
 * 完成效果组件
 * 根据评分显示不同的视觉效果和音效
 */

import React, { useEffect } from 'react';
import { ActionScore } from '../actions/base/types';
import { getScoreText, getScoreColor } from '../services/scoreCalculator';
import { playMissSound, playBadSound, playGoodSound, playExcellentSound } from '../services/audioUtils';

interface CompletionEffectProps {
  score: ActionScore;
  audioContext: AudioContext | null;
  onComplete: () => void;
}

export const CompletionEffect: React.FC<CompletionEffectProps> = ({ 
  score, 
  audioContext,
  onComplete 
}) => {
  useEffect(() => {
    if (!audioContext || audioContext.state !== 'running') return;

    // 根据评分播放不同的音效
    switch (score) {
      case ActionScore.EXCELLENT:
        playExcellentSound(audioContext);
        break;
      case ActionScore.GOOD:
        playGoodSound(audioContext);
        break;
      case ActionScore.BAD:
        playBadSound(audioContext);
        break;
      case ActionScore.MISS:
        playMissSound(audioContext);
        break;
    }
  }, [score, audioContext]);

  // 3秒后自动完成
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const scoreText = getScoreText(score);
  const scoreColor = getScoreColor(score);

  // 根据评分显示不同的视觉效果
  const getBackgroundClass = () => {
    switch (score) {
      case ActionScore.EXCELLENT:
        return 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30';
      case ActionScore.GOOD:
        return 'bg-gradient-to-br from-green-500/30 to-teal-500/30';
      case ActionScore.BAD:
        return 'bg-gradient-to-br from-orange-500/30 to-red-500/30';
      case ActionScore.MISS:
        return 'bg-gradient-to-br from-red-500/30 to-pink-500/30';
      default:
        return 'bg-black/40';
    }
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm ${getBackgroundClass()}`}>
      <div className={`text-6xl md:text-8xl font-black italic tracking-tighter animate-bounce ${scoreColor}`}>
        {scoreText}
      </div>
    </div>
  );
};


