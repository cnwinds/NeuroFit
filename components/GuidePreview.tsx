import React, { useRef, useEffect } from 'react';
import type { GuideData } from '../actions/base/types';
import { drawSkeleton } from '../utils/skeletonDrawer';

interface Props {
  guideData: GuideData;
  beatStep: number;
  beatProgress: number;
}

export const GuidePreview: React.FC<Props> = ({ guideData, beatStep, beatProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || guideData.frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = guideData.frames.length;
    const currentFrameIndex = Math.floor((beatStep + beatProgress) * guideData.framesPerBeat) % totalFrames;
    const frame = guideData.frames[currentFrameIndex];

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frame && frame.length > 0) {
      drawSkeleton(ctx, frame, canvas.width, canvas.height);
    }
  }, [guideData, beatStep, beatProgress]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
