/**
 * 动作解析服务
 * 从actions.md文件解析动作列表
 */

export interface ParsedAction {
  index: number;
  name: string;
  englishName: string;
}

/**
 * 解析actions.md文件内容
 * 格式: 第X个动作"ACTION_NAME"
 */
export function parseActionsFromText(text: string): ParsedAction[] {
  const lines = text.split('\n').filter(line => line.trim());
  const actions: ParsedAction[] = [];
  
  for (const line of lines) {
    // 匹配格式: 第X个动作"ACTION_NAME" 或 第个动作"ACTION_NAME"
    const match = line.match(/第(?:(\d+))?个动作[""]([^""]+)[""]/);
    if (match) {
      const index = match[1] ? parseInt(match[1], 10) : actions.length + 1;
      const englishName = match[2].trim();
      
      // 提取动作名称（去除逗号分隔的部分，如 "BREATH IN,BREATH OUT" -> "BREATH IN")
      const actionName = englishName.split(',')[0].trim();
      
      actions.push({
        index,
        name: actionName,
        englishName: actionName.toUpperCase()
      });
    }
  }
  
  return actions;
}

/**
 * 从actions.md文件读取并解析动作列表
 */
export async function parseActionsFromFile(): Promise<ParsedAction[]> {
  try {
    const response = await fetch('/actions.md');
    if (!response.ok) {
      throw new Error(`Failed to fetch actions.md: ${response.statusText}`);
    }
    const text = await response.text();
    return parseActionsFromText(text);
  } catch (error) {
    console.error('Failed to parse actions.md:', error);
    // 返回空数组，允许程序继续运行
    return [];
  }
}



