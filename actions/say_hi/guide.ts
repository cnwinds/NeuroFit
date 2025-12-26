import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: 4,
  framesPerBeat: 15,
  bpm: 100,
  markedFrameIndices: [0, 15, 30, 45],
  frames: Array(60).fill(null).map((_, i) => {
    const progress = (i % 60) / 60;
    const wavePhase = Math.sin(progress * Math.PI * 2);
    const armPhase = progress * Math.PI * 2;
    const rightArmAngle = wavePhase * 0.5 + 0.3;
    const rightHandX = 0.5 + Math.sin(armPhase) * 0.2;
    const rightHandY = 0.35 + Math.cos(armPhase) * 0.05;

    return [
      { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.25 },
      { x: 0.35, y: 0.3 }, { x: 0.5, y: 0.3 }, { x: 0.65, y: 0.3 },
      { x: 0.35, y: 0.3 }, { x: 0.3, y: 0.45 }, { x: 0.3, y: 0.55 },
      { x: 0.65, y: 0.3 }, { x: rightHandX, y: rightHandY }, { x: rightHandX, y: rightHandY + 0.1 },
      { x: 0.3, y: 0.55 }, { x: 0.3, y: 0.65 }, { x: 0.28, y: 0.75 },
      { x: rightHandX, y: rightHandY + 0.1 }, { x: rightHandX, y: rightHandY + 0.2 }, { x: rightHandX, y: rightHandY + 0.25 },
      { x: 0.3, y: 0.65 }, { x: 0.32, y: 0.75 }, { x: 0.35, y: 0.8 },
      { x: rightHandX, y: rightHandY + 0.2 }, { x: rightHandX, y: rightHandY + 0.25 }, { x: rightHandX, y: rightHandY + 0.28 },
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
