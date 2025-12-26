import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 100,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const walkPhase = progress * Math.PI * 4;
    const legSwing = Math.sin(walkPhase) * 0.1;
    const leftLegForward = Math.sin(walkPhase) > 0;

    return [
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.45, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.55, y: 0.45 },
      { x: 0.45, y: 0.45 }, { x: 0.45, y: 0.6 }, { x: 0.45 + legSwing, y: 0.7 },
      { x: 0.55, y: 0.45 }, { x: 0.55, y: 0.6 }, { x: 0.55 - legSwing, y: 0.7 },
      { x: 0.45 + legSwing, y: 0.7 }, { x: 0.45 + legSwing, y: 0.85 }, { x: 0.45 + legSwing * 1.2, y: 0.95 },
      { x: 0.55 - legSwing, y: 0.7 }, { x: 0.55 - legSwing, y: 0.85 }, { x: 0.55 - legSwing * 1.2, y: 0.95 },
      { x: 0.45 + legSwing * 1.2, y: 0.95 }, { x: 0.45 + legSwing * 1.2, y: 1.05 }, { x: 0.45 + legSwing * 1.2, y: 1.1 },
      { x: 0.55 - legSwing * 1.2, y: 0.95 }, { x: 0.55 - legSwing * 1.2, y: 1.05 }, { x: 0.55 - legSwing * 1.2, y: 1.1 },
      { x: 0.45, y: 0.6 }, { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.7 },
      { x: 0.55, y: 0.6 }, { x: 0.55, y: 0.65 }, { x: 0.55, y: 0.7 },
      { x: 0.45, y: 0.65 }, { x: 0.45, y: 0.7 }, { x: 0.45, y: 0.75 },
      { x: 0.55, y: 0.65 }, { x: 0.55, y: 0.7 }, { x: 0.55, y: 0.75 },
      { x: 0.45, y: 0.7 }, { x: 0.45, y: 0.75 }, { x: 0.45, y: 0.8 },
      { x: 0.55, y: 0.7 }, { x: 0.55, y: 0.75 }, { x: 0.55, y: 0.8 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 }
    ];
  })
};

export default guide;
export { guide };
