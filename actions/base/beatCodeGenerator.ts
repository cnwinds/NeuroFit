/**
 * 动作节拍代码生成器
 * 为 Action 生成 beat.tsx 文件
 */

/**
 * 格式化 pattern 数组为代码字符串
 */
function formatPatternCode(pattern: any): string {
  if (!Array.isArray(pattern) || pattern.length === 0) {
    return '[]';
  }

  // 检查是否是二维数组（DrumStep[][]）
  if (Array.isArray(pattern[0])) {
    const lines: string[] = [];
    pattern.forEach((step, index) => {
      if (Array.isArray(step) && step.length > 0) {
        const stepCode = step.map(s =>
          `{ type: '${s.type}', volume: ${s.volume}${s.timeOffset ? `, timeOffset: ${s.timeOffset}` : ''} }`
        ).join(', ');
        lines.push(`    [${stepCode}]`);
      } else {
        lines.push(`    []`);
      }
    });
    return `[\n${lines.join(',\n')}\n  ]`;
  } else {
    // 一维数组（DrumStep[]）
    const stepCodes = pattern.map(s =>
      `{ type: '${s.type}', volume: ${s.volume}${s.timeOffset ? `, timeOffset: ${s.timeOffset}` : ''} }`
    );
    return `[\n    ${stepCodes.join(',\n    ')}\n  ]`;
  }
}

/**
 * 为 Action 生成 beat.tsx 文件代码
 * @param actionName 动作的英文名称（小写，下划线分隔）
 * @param beatPattern 节拍模式配置
 * @returns TypeScript 代码字符串
 */
export function generateActionBeatCode(
  actionName: string,
  beatPattern: { bpm: number; pattern: any; timeSignature?: [number, number]; swing?: number; totalBeats?: number; beatFrameMapping?: number[] }
): string {
  // 将 action_name 转换为 ActionName 格式
  const className = actionName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const varName = `${className}Beat`;

  // 格式化 pattern 数组
  const patternCode = formatPatternCode(beatPattern.pattern);

  let code = `/**\n`;
  code += ` * ${className} 动作的节拍配置\n`;
  code += ` * BPM: ${beatPattern.bpm}\n`;
  code += ` * 自动生成于: ${new Date().toLocaleString('zh-CN')}\n`;
  code += ` */\n\n`;
  code += `import { BeatPattern } from '../base/ActionBase';\n\n`;
  code += `export const ${varName}: BeatPattern = {\n`;
  code += `  bpm: ${beatPattern.bpm},\n`;

  if (beatPattern.timeSignature) {
    code += `  timeSignature: [${beatPattern.timeSignature[0]}, ${beatPattern.timeSignature[1]}],\n`;
  }

  if (beatPattern.swing !== undefined && beatPattern.swing !== 0) {
    code += `  swing: ${beatPattern.swing},\n`;
  }

  code += `  pattern: ${patternCode},\n`;

  if (beatPattern.totalBeats !== undefined) {
    code += `  totalBeats: ${beatPattern.totalBeats},\n`;
  }

  if (beatPattern.beatFrameMapping !== undefined && beatPattern.beatFrameMapping.length > 0) {
    code += `  beatFrameMapping: [${beatPattern.beatFrameMapping.join(', ')}],\n`;
  }

  code += `};\n`;

  return code;
}

