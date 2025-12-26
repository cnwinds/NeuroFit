import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 100,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const clapPhase = Math.sin(progress * Math.PI * 2);
    const handDistance = Math.abs(clapPhase) * 0.3;
    const elbowAngle = clapPhase * 0.5 + 0.3;

    return [
      { x: 0.5, y: 0.35 }, { x: 0.5, y: 0.35 },
      { x: 0.5 - handDistance, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.5 + handDistance, y: 0.45 },
      { x: 0.5 - handDistance, y: 0.45 }, { x: 0.5 - handDistance - elbowAngle, y: 0.55 }, { x: 0.5 - handDistance, y: 0.55 },
      { x: 0.5 + handDistance, y: 0.45 }, { x: 0.5 + handDistance + elbowAngle, y: 0.55 }, { x: 0.5 + handDistance, y: 0.55 },
      { x: 0.5 - handDistance, y: 0.55 }, { x: 0.5 - handDistance, y: 0.6 }, { x: 0.5 - handDistance, y: 0.65 },
      { x: 0.5 + handDistance, y: 0.55 }, { x: 0.5 + handDistance, y: 0.6 }, { x: 0.5 + handDistance, y: 0.65 },
      { x: 0.5 - handDistance, y: 0.6 }, { x: 0.5 - handDistance, y: 0.65 }, { x: 0.5 - handDistance, y: 0.7 },
      { x: 0.5 + handDistance, y: 0.6 }, { x: 0.5 + handDistance, y: 0.65 }, { x: 0.5 + handDistance, y: 0.7 },
      { x: 0.5 - handDistance, y: 0.65 }, { x: 0.5 - handDistance, y: 0.7 }, { x: 0.5 - handDistance, y: 0.75 },
      { x: 0.5 + handDistance, y: 0.65 }, { x: 0.5 + handDistance, y: 0.7 }, { x: 0.5 + handDistance, y: 0.75 },
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
