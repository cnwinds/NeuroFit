import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 100,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const jumpPhase = Math.sin(progress * Math.PI * 2);
    const armSpread = jumpPhase * 0.2 + 0.15;
    const legSpread = jumpPhase * 0.15 + 0.1;
    const bodyY = 0.4 + Math.abs(jumpPhase) * 0.1;

    return [
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5 - armSpread, y: bodyY + 0.1 }, { x: 0.5, y: bodyY + 0.1 }, { x: 0.5 + armSpread, y: bodyY + 0.1 },
      { x: 0.5 - armSpread, y: bodyY + 0.1 }, { x: 0.5 - armSpread, y: bodyY + 0.25 }, { x: 0.5 - armSpread, y: bodyY + 0.35 },
      { x: 0.5 + armSpread, y: bodyY + 0.1 }, { x: 0.5 + armSpread, y: bodyY + 0.25 }, { x: 0.5 + armSpread, y: bodyY + 0.35 },
      { x: 0.5 - legSpread, y: bodyY + 0.25 }, { x: 0.5 - legSpread, y: bodyY + 0.35 }, { x: 0.5 - legSpread * 1.5, y: bodyY + 0.5 },
      { x: 0.5 + legSpread, y: bodyY + 0.25 }, { x: 0.5 + legSpread, y: bodyY + 0.35 }, { x: 0.5 + legSpread * 1.5, y: bodyY + 0.5 },
      { x: 0.5 - legSpread * 1.5, y: bodyY + 0.5 }, { x: 0.5 - legSpread * 1.5, y: bodyY + 0.6 }, { x: 0.5 - legSpread * 1.5, y: bodyY + 0.65 },
      { x: 0.5 + legSpread * 1.5, y: bodyY + 0.5 }, { x: 0.5 + legSpread * 1.5, y: bodyY + 0.6 }, { x: 0.5 + legSpread * 1.5, y: bodyY + 0.65 },
      { x: 0.5 - armSpread, y: bodyY + 0.25 }, { x: 0.5 - armSpread, y: bodyY + 0.35 }, { x: 0.5 - armSpread, y: bodyY + 0.4 },
      { x: 0.5 + armSpread, y: bodyY + 0.25 }, { x: 0.5 + armSpread, y: bodyY + 0.35 }, { x: 0.5 + armSpread, y: bodyY + 0.4 },
      { x: 0.5 - armSpread, y: bodyY + 0.35 }, { x: 0.5 - armSpread, y: bodyY + 0.4 }, { x: 0.5 - armSpread, y: bodyY + 0.45 },
      { x: 0.5 + armSpread, y: bodyY + 0.35 }, { x: 0.5 + armSpread, y: bodyY + 0.4 }, { x: 0.5 + armSpread, y: bodyY + 0.45 },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY },
      { x: 0.5, y: bodyY }, { x: 0.5, y: bodyY }
    ];
  })
};

export default guide;
export { guide };
