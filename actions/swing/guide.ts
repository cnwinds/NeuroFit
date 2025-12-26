import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 100,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const swingPhase = Math.sin(progress * Math.PI * 2);
    const armSwing = swingPhase * 0.25;
    const bodyLean = swingPhase * 0.05;

    return [
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.35 + bodyLean, y: 0.45 }, { x: 0.5 + bodyLean, y: 0.45 }, { x: 0.65 + bodyLean, y: 0.45 },
      { x: 0.35 + bodyLean, y: 0.45 }, { x: 0.25 + bodyLean - armSwing, y: 0.6 }, { x: 0.2 + bodyLean - armSwing, y: 0.7 },
      { x: 0.65 + bodyLean, y: 0.45 }, { x: 0.75 + bodyLean + armSwing, y: 0.6 }, { x: 0.8 + bodyLean + armSwing, y: 0.7 },
      { x: 0.2 + bodyLean - armSwing, y: 0.7 }, { x: 0.2 + bodyLean - armSwing, y: 0.8 }, { x: 0.2 + bodyLean - armSwing, y: 0.85 },
      { x: 0.8 + bodyLean + armSwing, y: 0.7 }, { x: 0.8 + bodyLean + armSwing, y: 0.8 }, { x: 0.8 + bodyLean + armSwing, y: 0.85 },
      { x: 0.2 + bodyLean - armSwing, y: 0.8 }, { x: 0.2 + bodyLean - armSwing, y: 0.85 }, { x: 0.2 + bodyLean - armSwing, y: 0.9 },
      { x: 0.8 + bodyLean + armSwing, y: 0.8 }, { x: 0.8 + bodyLean + armSwing, y: 0.85 }, { x: 0.8 + bodyLean + armSwing, y: 0.9 },
      { x: 0.35 + bodyLean, y: 0.55 }, { x: 0.35 + bodyLean, y: 0.65 }, { x: 0.35 + bodyLean, y: 0.7 },
      { x: 0.65 + bodyLean, y: 0.55 }, { x: 0.65 + bodyLean, y: 0.65 }, { x: 0.65 + bodyLean, y: 0.7 },
      { x: 0.35 + bodyLean, y: 0.65 }, { x: 0.35 + bodyLean, y: 0.7 }, { x: 0.35 + bodyLean, y: 0.75 },
      { x: 0.65 + bodyLean, y: 0.65 }, { x: 0.65 + bodyLean, y: 0.7 }, { x: 0.65 + bodyLean, y: 0.75 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 },
      { x: 0.5 + bodyLean, y: 0.35 }, { x: 0.5 + bodyLean, y: 0.35 }
    ];
  })
};

export default guide;
export { guide };
