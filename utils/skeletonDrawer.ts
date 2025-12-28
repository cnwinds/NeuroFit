import { POSE_CONNECTIONS, SKELETON_COLOR, RECORDING_COLOR, DEFAULT_LINE_WIDTH, DEFAULT_FPS, MARKER_COLOR } from '../constants/pose';

export { SKELETON_COLOR, RECORDING_COLOR, MARKER_COLOR, DEFAULT_FPS };

export interface DrawSkeletonOptions {
  strokeColor?: string;
  lineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  lineCap?: CanvasLineCap;
  mirror?: boolean; // 是否镜像绘制（用于匹配CSS镜像的视频）
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
    lineCap = 'round',
    mirror = false
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
      // 如果启用镜像，需要翻转 x 坐标以匹配 CSS 镜像的视频
      const x1 = mirror ? (1 - s.x) * width : s.x * width;
      const y1 = s.y * height;
      const x2 = mirror ? (1 - e.x) * width : e.x * width;
      const y2 = e.y * height;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
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
