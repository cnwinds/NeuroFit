/**
 * 节拍模式代码生成器
 * 将保存的节拍模式转换为可直接在代码中使用的 TypeScript 代码
 */

import { SavedBeatPattern } from '../../beats/types';
import { BeatPattern } from './ActionBase';

/**
 * 将单个节拍模式转换为 TypeScript 代码
 */
export function generateBeatPatternCode(
  savedPattern: SavedBeatPattern,
  variableName?: string
): string {
  const varName = variableName || toCamelCase(savedPattern.name);
  const beatPattern: BeatPattern = {
    bpm: savedPattern.bpm,
    pattern: savedPattern.pattern,
    timeSignature: savedPattern.timeSignature,
    swing: savedPattern.swing,
  };

  // 格式化 pattern 数组
  const patternCode = formatPatternCode(beatPattern.pattern);

  let code = `/**\n`;
  code += ` * 节拍模式: ${savedPattern.name}\n`;
  code += ` * BPM: ${savedPattern.bpm}\n`;
  code += ` * 步数: ${savedPattern.length}\n`;
  code += ` * 生成时间: ${new Date(savedPattern.createdAt || Date.now()).toLocaleString('zh-CN')}\n`;
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
  code += `};\n`;

  return code;
}

/**
 * 批量生成节拍模式代码
 */
export function generateAllBeatPatternsCode(): string {
  try {
    const saved = localStorage.getItem('savedBeatPatterns');
    if (!saved) {
      return '// 没有保存的节拍模式\n';
    }

    const patterns: SavedBeatPattern[] = JSON.parse(saved);
    if (patterns.length === 0) {
      return '// 没有保存的节拍模式\n';
    }

    let code = `/**\n`;
    code += ` * 自动生成的节拍模式代码\n`;
    code += ` * 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    code += ` * 共 ${patterns.length} 个节拍模式\n`;
    code += ` * \n`;
    code += ` * 使用说明：\n`;
    code += ` * 1. 将此文件放到 actions/beats/ 目录下\n`;
    code += ` * 2. 在 Action 中导入：import { patternName } from '../beats/beatPatterns';\n`;
    code += ` * 3. 在 ActionComponent 中使用：Beat: patternName\n`;
    code += ` */\n\n`;
    code += `import { BeatPattern } from '../base/ActionBase';\n\n`;

    patterns.forEach((pattern, index) => {
      const varName = toCamelCase(pattern.name);
      const beatPattern: BeatPattern = {
        bpm: pattern.bpm,
        pattern: pattern.pattern,
        timeSignature: pattern.timeSignature,
        swing: pattern.swing,
      };

      const patternCode = formatPatternCode(beatPattern.pattern);

      code += `// ${pattern.name} (${pattern.bpm} BPM, ${pattern.length}步)\n`;
      code += `export const ${varName}: BeatPattern = {\n`;
      code += `  bpm: ${beatPattern.bpm},\n`;
      
      if (beatPattern.timeSignature) {
        code += `  timeSignature: [${beatPattern.timeSignature[0]}, ${beatPattern.timeSignature[1]}],\n`;
      }
      
      if (beatPattern.swing !== undefined && beatPattern.swing !== 0) {
        code += `  swing: ${beatPattern.swing},\n`;
      }
      
      code += `  pattern: ${patternCode},\n`;
      code += `};\n\n`;
    });

    return code;
  } catch (e) {
    console.error('生成代码失败:', e);
    return `// 生成代码失败: ${e}\n`;
  }
}

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
 * 将名称转换为驼峰命名
 */
function toCamelCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, ' ') // 替换特殊字符为空格
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '') // 移除所有非字母数字字符
    || 'beatPattern'; // 如果结果为空，使用默认名称
}

/**
 * 下载代码文件
 */
export function downloadCodeFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 为 Action 生成 beat.tsx 文件代码
 * @param actionName 动作的英文名称（小写，下划线分隔）
 * @param beatPattern 节拍模式配置
 * @returns TypeScript 代码字符串
 */
export function generateActionBeatCode(
  actionName: string,
  beatPattern: { bpm: number; pattern: any; timeSignature?: [number, number]; swing?: number }
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
  code += `};\n`;

  return code;
}
