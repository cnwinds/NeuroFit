import React, { useRef, useEffect } from 'react';
import type { GuideData } from '../actions/base/types';

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
      const drawSkeleton = (landmarks: any[], w: number, h: number) => {
        const connect = (i1: number, i2: number) => {
          const s = landmarks[i1], e = landmarks[i2];
          if (s && e) {
            ctx.beginPath();
            ctx.moveTo(s.x * w, s.y * h);
            ctx.lineTo(e.x * w, e.y * h);
            ctx.strokeStyle = '#2dd4bf';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        };
        [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]].forEach(pair => connect(pair[0], pair[1]));
      };
      drawSkeleton(frame, canvas.width, canvas.height);
    }
  }, [guideData, beatStep, beatProgress]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};
