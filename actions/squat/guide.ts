import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 80,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const squatPhase = Math.sin(progress * Math.PI * 2);
    const kneeY = 0.5 + squatPhase * 0.15;
    return [
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.4, y: 0.35 }, { x: 0.5, y: 0.35 }, { x: 0.6, y: 0.35 },
      { x: 0.4, y: 0.35 }, { x: 0.35, y: 0.5 }, { x: 0.35, y: kneeY },
      { x: 0.6, y: 0.35 }, { x: 0.65, y: 0.5 }, { x: 0.65, y: kneeY },
      { x: 0.45, y: kneeY }, { x: 0.45, y: kneeY + 0.15 },
      { x: 0.55, y: kneeY }, { x: 0.55, y: kneeY + 0.15 },
      { x: 0.45, y: kneeY + 0.15 }, { x: 0.45, y: kneeY + 0.25 },
      { x: 0.55, y: kneeY + 0.15 }, { x: 0.55, y: kneeY + 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 }
    ];
  })
};

export default guide;
export { guide };
