import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 120,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const kneePhase = Math.sin(progress * Math.PI * 2);
    const leftKneeUp = kneePhase > 0;
    const rightKneeY = 0.5 + (leftKneeUp ? kneePhase * 0.2 : 0);
    const leftKneeY = 0.5 + (!leftKneeUp ? -kneePhase * 0.2 : 0);

    return [
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.4, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.6, y: 0.45 },
      { x: 0.4, y: 0.45 }, { x: 0.35, y: 0.6 }, { x: 0.35, y: leftKneeY },
      { x: 0.6, y: 0.45 }, { x: 0.65, y: 0.6 }, { x: 0.65, y: rightKneeY },
      { x: 0.35, y: leftKneeY }, { x: 0.35, y: leftKneeY + 0.15 }, { x: 0.3, y: leftKneeY + 0.25 },
      { x: 0.65, y: rightKneeY }, { x: 0.65, y: rightKneeY + 0.15 }, { x: 0.7, y: rightKneeY + 0.25 },
      { x: 0.3, y: leftKneeY + 0.25 }, { x: 0.3, y: leftKneeY + 0.35 }, { x: 0.3, y: leftKneeY + 0.4 },
      { x: 0.7, y: rightKneeY + 0.25 }, { x: 0.7, y: rightKneeY + 0.35 }, { x: 0.7, y: rightKneeY + 0.4 },
      { x: 0.3, y: leftKneeY + 0.35 }, { x: 0.3, y: leftKneeY + 0.4 }, { x: 0.3, y: leftKneeY + 0.45 },
      { x: 0.7, y: rightKneeY + 0.35 }, { x: 0.7, y: rightKneeY + 0.4 }, { x: 0.7, y: rightKneeY + 0.45 },
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
