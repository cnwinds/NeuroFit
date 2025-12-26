/**
 * Action 文件更新工具
 * 用于自动更新 Action 文件以使用 beat.tsx 导入
 */

/**
 * 更新 Action 文件以使用 beat 导入
 * @param fileContent 原始文件内容
 * @param actionName 动作英文名称（小写，下划线分隔）
 * @returns 更新后的文件内容
 */
export function updateActionFileToUseBeat(
  fileContent: string,
  actionName: string
): string {
  // 将 action_name 转换为 ActionName 格式
  const className = actionName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const beatVarName = `${className}Beat`;
  const beatImportStatement = `import { ${beatVarName} } from './beat';`;

  let updatedContent = fileContent;

  // 1. 检查并处理现有的 Beat 导入
  const hasBeatImport = fileContent.includes(`from './beat'`) || fileContent.includes(`from "./beat"`);
  
  // 检查是否有旧的 Beat 导入（如 import { JumpBeat } from './JumpBeat'）
  const oldBeatImportRegex = new RegExp(`import\\s+{\\s*${beatVarName}\\s*}\\s+from\\s+['"]\\.\\/[^'"]+['"];?\\s*\\n`, 'g');
  const hasOldBeatImport = oldBeatImportRegex.test(fileContent);

  if (hasOldBeatImport && !hasBeatImport) {
    // 替换旧的 Beat 导入为新的导入
    updatedContent = updatedContent.replace(oldBeatImportRegex, beatImportStatement + '\n');
  } else if (!hasBeatImport) {
    // 找到最后一个 import 语句的位置
    const importRegex = /import\s+.*?from\s+['"].*?['"];?\s*\n/g;
    const imports = fileContent.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = fileContent.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      // 在最后一个 import 后添加 beat 导入
      updatedContent = 
        fileContent.slice(0, insertPosition) +
        beatImportStatement + '\n' +
        fileContent.slice(insertPosition);
    } else {
      // 如果没有找到 import 语句，在文件开头添加（在注释之后）
      const lines = fileContent.split('\n');
      let insertIndex = 0;
      
      // 跳过开头的注释
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('/**') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
          insertIndex = i + 1;
        } else if (trimmed.length > 0 && !trimmed.startsWith('//')) {
          break;
        }
      }
      
      lines.splice(insertIndex, 0, '', beatImportStatement);
      updatedContent = lines.join('\n');
    }
  }

  // 2. 更新 Beat 属性
  // 使用更智能的方法来查找和替换 Beat 属性
  const beatMatch = /Beat:\s*/.exec(updatedContent);
  
  if (beatMatch) {
    const startIndex = beatMatch.index + beatMatch[0].length;
    let endIndex = startIndex;
    
    // 检查是否是对象字面量
    if (updatedContent[startIndex] === '{') {
      // 手动计数花括号以找到匹配的结束位置
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      
      for (let i = startIndex; i < updatedContent.length; i++) {
        const char = updatedContent[i];
        const prevChar = i > 0 ? updatedContent[i - 1] : '';
        
        // 处理字符串（跳过字符串内的花括号）
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }
        
        if (!inString) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
      }
      
      // 替换整个对象字面量
      if (endIndex > startIndex) {
        updatedContent = 
          updatedContent.slice(0, beatMatch.index) +
          `Beat: ${beatVarName}` +
          updatedContent.slice(endIndex);
      }
    } else {
      // 如果是标识符，使用正则替换
      const identifierRegex = /Beat:\s*\w+/;
      const identMatch = identifierRegex.exec(updatedContent);
      
      if (identMatch) {
        const currentBeatVar = identMatch[0].replace(/Beat:\s*/, '');
        if (currentBeatVar !== beatVarName) {
          updatedContent = updatedContent.replace(
            identifierRegex,
            `Beat: ${beatVarName}`
          );
        }
      }
    }
  }

  return updatedContent;
}

/**
 * 检查文件是否已经使用 beat 导入
 */
export function isUsingBeatImport(fileContent: string): boolean {
  return fileContent.includes(`from './beat'`) || fileContent.includes(`from "./beat"`);
}

/**
 * 提取动作英文名称
 */
export function extractActionEnglishName(fileContent: string): string | null {
  const match = fileContent.match(/englishName:\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

