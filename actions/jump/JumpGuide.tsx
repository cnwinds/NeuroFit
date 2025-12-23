/**
 * JUMP动作的引导动画组件
 */

import React, { useEffect, useState } from 'react';
import { GuideProps } from '../base/ActionBase';
import { generateStickFigureAnimation } from '../../services/geminiService';
import { Loader2 } from 'lucide-react';

export const JumpGuide: React.FC<GuideProps> = ({ onReady }) => {
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const generatedFrames = await generateStickFigureAnimation('JUMP', false);
        if (generatedFrames.length > 0) {
          setFrames(generatedFrames);
          setLoading(false);
          onReady();
        }
      } catch (error) {
        console.error('Failed to load jump animation:', error);
        setLoading(false);
        onReady();
      }
    };

    loadAnimation();
  }, [onReady]);

  useEffect(() => {
    if (frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex(prev => (prev + 1) % frames.length);
    }, 500); // 每500ms切换一帧

    return () => clearInterval(interval);
  }, [frames.length]);

  if (loading) {
    return (
      <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
      </div>
    );
  }

  if (frames.length === 0) {
    return (
      <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
        <p className="text-white/60">无法加载动画</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
      <img 
        src={frames[currentFrameIndex]} 
        className="w-full h-full object-contain p-4" 
        alt="Jump guide animation" 
      />
    </div>
  );
};

