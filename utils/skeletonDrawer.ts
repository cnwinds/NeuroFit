import { POSE_CONNECTIONS, SKELETON_COLOR, RECORDING_COLOR, DEFAULT_LINE_WIDTH, DEFAULT_FPS, MARKER_COLOR } from '../constants/pose';

export { SKELETON_COLOR, RECORDING_COLOR, MARKER_COLOR, DEFAULT_FPS };

export interface DrawSkeletonOptions {
  strokeColor?: string;
  lineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  lineCap?: CanvasLineCap;
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number,
  options: DrawSkeletonOptions = {}
): void {
  const {
    strokeColor = SKELETON_COLOR,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineCap = 'round'
  } = options;

  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = lineCap;

  if (options.shadowColor !== undefined) {
    ctx.shadowColor = options.shadowColor;
  }
  if (options.shadowBlur !== undefined) {
    ctx.shadowBlur = options.shadowBlur;
  }

  const connect = (i1: number, i2: number) => {
    const s = landmarks[i1], e = landmarks[i2];
    if (s && e) {
      ctx.beginPath();
      ctx.moveTo(s.x * width, s.y * height);
      ctx.lineTo(e.x * width, e.y * height);
      ctx.stroke();
    }
  };

  POSE_CONNECTIONS.forEach(pair => connect(pair[0], pair[1]));
  ctx.restore();
}

export function drawSkeletonWithHighlight(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number,
  highlightColor = '#ffffff',
  highlightWidth = 3
): void {
  drawSkeleton(ctx, landmarks, width, height, {
    lineWidth: 10,
    shadowBlur: 20,
    shadowColor: '#2dd4bf'
  });
  drawSkeleton(ctx, landmarks, width, height, {
    strokeColor: highlightColor,
    lineWidth: highlightWidth,
    shadowBlur: 0
  });
}
