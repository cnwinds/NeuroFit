import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 80,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const bendPhase = Math.sin(progress * Math.PI * 2);
    const sideLean = bendPhase * 0.15;
    const armRaise = Math.abs(bendPhase) * 0.2;

    return [
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.45 }, { x: 0.5 + sideLean, y: 0.45 }, { x: 0.5 + sideLean, y: 0.45 },
      { x: 0.5 + sideLean, y: 0.45 }, { x: 0.5 + sideLean, y: 0.55 }, { x: 0.5 + sideLean + armRaise, y: 0.65 },
      { x: 0.5 + sideLean, y: 0.45 }, { x: 0.5 + sideLean, y: 0.55 }, { x: 0.5 + sideLean - armRaise, y: 0.65 },
      { x: 0.5 + sideLean + armRaise, y: 0.65 }, { x: 0.5 + sideLean + armRaise, y: 0.75 }, { x: 0.5 + sideLean + armRaise, y: 0.8 },
      { x: 0.5 + sideLean - armRaise, y: 0.65 }, { x: 0.5 + sideLean - armRaise, y: 0.75 }, { x: 0.5 + sideLean - armRaise, y: 0.8 },
      { x: 0.5 + sideLean + armRaise, y: 0.75 }, { x: 0.5 + sideLean + armRaise, y: 0.8 }, { x: 0.5 + sideLean + armRaise, y: 0.85 },
      { x: 0.5 + sideLean - armRaise, y: 0.75 }, { x: 0.5 + sideLean - armRaise, y: 0.8 }, { x: 0.5 + sideLean - armRaise, y: 0.85 },
      { x: 0.5 + sideLean + armRaise, y: 0.8 }, { x: 0.5 + sideLean + armRaise, y: 0.85 }, { x: 0.5 + sideLean + armRaise, y: 0.9 },
      { x: 0.5 + sideLean - armRaise, y: 0.8 }, { x: 0.5 + sideLean - armRaise, y: 0.85 }, { x: 0.5 + sideLean - armRaise, y: 0.9 },
      { x: 0.5 + sideLean + armRaise, y: 0.85 }, { x: 0.5 + sideLean + armRaise, y: 0.9 }, { x: 0.5 + sideLean + armRaise, y: 0.95 },
      { x: 0.5 + sideLean - armRaise, y: 0.85 }, { x: 0.5 + sideLean - armRaise, y: 0.9 }, { x: 0.5 + sideLean - armRaise, y: 0.95 },
      { x: 0.5 + sideLean, y: 0.55 }, { x: 0.5 + sideLean, y: 0.65 }, { x: 0.5 + sideLean, y: 0.7 },
      { x: 0.5 + sideLean, y: 0.55 }, { x: 0.5 + sideLean, y: 0.65 }, { x: 0.5 + sideLean, y: 0.7 },
      { x: 0.5 + sideLean, y: 0.65 }, { x: 0.5 + sideLean, y: 0.7 }, { x: 0.5 + sideLean, y: 0.75 },
      { x: 0.5 + sideLean, y: 0.65 }, { x: 0.5 + sideLean, y: 0.7 }, { x: 0.5 + sideLean, y: 0.75 },
      { x: 0.5 + sideLean, y: 0.7 }, { x: 0.5 + sideLean, y: 0.75 }, { x: 0.5 + sideLean, y: 0.8 },
      { x: 0.5 + sideLean, y: 0.7 }, { x: 0.5 + sideLean, y: 0.75 }, { x: 0.5 + sideLean, y: 0.8 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 },
      { x: 0.5 + sideLean, y: 0.35 }, { x: 0.5 + sideLean, y: 0.35 }
    ];
  })
};

export default guide;
export { guide };
