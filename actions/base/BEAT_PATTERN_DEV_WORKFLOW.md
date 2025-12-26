# 节拍模式开发工作流

## 设计模式 → 代码文件工作流

由于节拍编辑器只在**开发模式**下可用，保存的节拍模式会**直接生成代码文件**，而不是仅保存在 localStorage 中。

## 工作流程

### 1. 设计节拍模式

1. 在开发模式下运行应用
2. 点击"设计节奏"按钮进入节拍编辑器
3. 设计你的节拍模式：
   - 调整 BPM（节拍速度）
   - 设置节拍模式（点击网格创建鼓点）
   - 调整摇摆感（Swing）
   - 设置模式长度

### 2. 保存为代码文件

1. 点击"STORE"按钮
2. 输入节拍模式名称（例如：`FastCardio`）
3. 点击确认保存

**自动完成的操作：**
- ✅ 生成 TypeScript 代码文件
- ✅ 自动下载到你的下载文件夹
- ✅ 文件命名：`节拍模式名称.ts`（例如：`FastCardio.ts`）

### 3. 将代码文件添加到项目

1. 将下载的 `.ts` 文件移动到项目目录：
   ```
   actions/beats/FastCardio.ts
   ```

2. 或者创建 `actions/beats/` 目录（如果不存在）

### 4. 在 Action 中使用

```typescript
// actions/cardio/MyCardioAction.tsx
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';
import { fastCardio } from '../beats/FastCardio'; // 导入生成的节拍模式

export const MyCardioAction: ActionComponent = {
  name: '有氧运动',
  englishName: 'CARDIO',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 60,
  Guide: (props) => <GenericActionGuide actionName="CARDIO" {...props} />,
  Beat: fastCardio, // 直接使用导入的节拍模式
  Detector: new SimpleDetector({
    type: 'height',
    points: [25, 23],
    threshold: 0.2,
    direction: 'less'
  }),
  Display: () => null,
};
```

## 优势

### ✅ 代码即文档
- 节拍模式成为代码的一部分
- 可以直接查看和修改
- 版本控制友好

### ✅ 发布模式独立
- 不依赖 localStorage
- 不依赖浏览器环境
- 可以在任何环境下使用

### ✅ 团队协作
- 代码文件可以提交到 Git
- 团队成员可以直接使用
- 无需手动配置

### ✅ 易于维护
- 可以直接编辑代码文件
- 可以添加注释和文档
- 可以重构和优化

## 注意事项

### localStorage 的作用

localStorage 仍然会被使用，但**仅用于**：
- 在节拍编辑器中加载之前设计的模式（用于编辑）
- 临时存储，方便在开发过程中快速切换和测试

**重要**：localStorage 中的内容**不会**被发布到生产环境，只有代码文件会被使用。

### 文件命名建议

- 使用有意义的名称：`FastCardio.ts` 而不是 `beat1.ts`
- 使用驼峰命名：`FastCardio` 而不是 `fast-cardio`
- 避免特殊字符和空格

### 代码文件结构

生成的代码文件示例：

```typescript
/**
 * 节拍模式: FastCardio
 * BPM: 140
 * 步数: 16
 * 生成时间: 2025/1/24 10:30:00
 */

import { BeatPattern } from '../base/ActionBase';

export const fastCardio: BeatPattern = {
  bpm: 140,
  timeSignature: [4, 4],
  swing: 0,
  pattern: [
    [{ type: 'kick', volume: 1.0 }],
    [{ type: 'hihat', volume: 0.6 }],
    // ... 更多步骤
  ],
};
```

## 批量导出

如果需要导出所有保存的节拍模式：

1. 在节拍编辑器中点击 **"All"** 按钮
2. 会下载 `beatPatterns.ts` 文件，包含所有节拍模式
3. 将文件放到 `actions/beats/` 目录
4. 按需导入使用：

```typescript
import { beat1, beat2, patternA } from '../beats/beatPatterns';
```

## 常见问题

### Q: 保存后文件下载到哪里了？

A: 默认下载到浏览器的下载文件夹。你可以在浏览器设置中查看下载位置。

### Q: 可以修改生成的代码吗？

A: 可以！生成的代码是标准的 TypeScript，你可以根据需要修改。

### Q: 如果我想重新设计节拍模式怎么办？

A: 在节拍编辑器中点击"Load"按钮，选择之前保存的模式进行编辑，然后重新保存即可。

### Q: 代码文件中的导入路径需要修改吗？

A: 如果文件放在 `actions/beats/` 目录下，导入路径 `../base/ActionBase` 是正确的。如果放在其他位置，需要相应调整。

### Q: 可以删除 localStorage 中的内容吗？

A: 可以，但建议保留，这样在开发时可以快速加载和编辑之前设计的模式。


