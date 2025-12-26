# 节拍模式使用指南

## 设计模式 → 发布模式工作流

### 步骤 1: 在设计模式下创建节拍模式

1. 在开发模式下打开应用
2. 点击"设计节奏"按钮进入节拍编辑器
3. 设计你的节拍模式（调整 BPM、节拍、摇摆感等）
4. 点击"STORE"保存节拍模式

### 步骤 2: 导出为代码

在节拍编辑器中，你有两个导出选项：

#### 选项 A: 导出当前节拍模式
- 点击 **"Code"** 按钮
- 会下载一个 `.ts` 文件，包含当前节拍模式的 TypeScript 代码

#### 选项 B: 导出所有节拍模式
- 点击 **"All"** 按钮
- 会下载一个 `beatPatterns.ts` 文件，包含所有保存的节拍模式

### 步骤 3: 在代码中使用导出的节拍模式

#### 方法 1: 直接导入使用（推荐）

1. 将下载的 `.ts` 文件放到 `actions/` 目录下的合适位置，例如：
   ```
   actions/beats/MyBeatPattern.ts
   ```

2. 在你的 Action 中导入并使用：

```typescript
import { ActionComponent } from '../base/ActionBase';
import { GenericActionGuide } from '../base/GenericActionGuide';
import { SimpleDetector } from '../base/SimpleDetector';
import { myBeatPattern } from '../beats/MyBeatPattern'; // 导入导出的节拍模式

export const MyAction: ActionComponent = {
  name: '我的动作',
  englishName: 'MY_ACTION',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 30,
  Guide: (props) => <GenericActionGuide actionName="MY_ACTION" {...props} />,
  Beat: myBeatPattern, // 直接使用导入的节拍模式
  Detector: new SimpleDetector({...}),
  Display: () => null,
};
```

#### 方法 2: 使用工具函数加载（运行时加载）

如果你需要在运行时从 localStorage 加载（仅开发模式）：

```typescript
import { loadBeatPatternByName, getDefaultBeatPattern } from '../base/beatUtils';

export const MyAction: ActionComponent = {
  // ...
  Beat: loadBeatPatternByName('beat1') || getDefaultBeatPattern(120),
  // ...
};
```

**注意**: 这种方式只在开发模式下有效，因为发布模式下 localStorage 可能为空。

## 最佳实践

### ✅ 推荐做法

1. **在设计模式下设计节拍模式**
2. **导出为代码文件**
3. **将代码文件添加到版本控制**
4. **在 Action 中直接导入使用**

这样做的好处：
- ✅ 节拍模式成为代码的一部分，可以版本控制
- ✅ 发布模式下不依赖 localStorage
- ✅ 团队协作更容易
- ✅ 可以轻松修改和维护

### ❌ 不推荐做法

- ❌ 在发布模式下依赖 localStorage 中的节拍模式
- ❌ 手动复制粘贴 JSON 数据到代码中

## 示例：完整工作流

### 1. 设计节拍模式

在节拍编辑器中创建一个名为 "FastCardio" 的节拍模式：
- BPM: 140
- 16 步
- 自定义节拍模式

### 2. 导出代码

点击 "Code" 按钮，下载 `FastCardio.ts` 文件：

```typescript
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

### 3. 在 Action 中使用

```typescript
// actions/cardio/CardioAction.tsx
import { ActionComponent } from '../base/ActionBase';
import { fastCardio } from '../beats/FastCardio';

export const CardioAction: ActionComponent = {
  name: '有氧运动',
  englishName: 'CARDIO',
  category: 'cardio',
  targetParts: ['full-body'],
  durationSeconds: 60,
  Guide: (props) => <GenericActionGuide actionName="CARDIO" {...props} />,
  Beat: fastCardio, // 使用导出的节拍模式
  Detector: new SimpleDetector({...}),
  Display: () => null,
};
```

## 常见问题

### Q: 导出的代码文件应该放在哪里？

A: 建议放在 `actions/beats/` 目录下，或者与使用它的 Action 放在同一目录。

### Q: 可以修改导出的代码吗？

A: 可以！导出的代码是标准的 TypeScript 代码，你可以根据需要修改。

### Q: 如果我想在运行时动态切换节拍模式怎么办？

A: 可以使用函数返回 ActionComponent，根据条件选择不同的节拍模式：

```typescript
export function createActionWithBeat(beatName: string): ActionComponent {
  const beat = loadBeatPatternByName(beatName) || getDefaultBeatPattern(120);
  return {
    // ... 使用 beat
  };
}
```

### Q: 导出所有节拍模式后，如何选择使用哪一个？

A: 导出所有节拍模式会生成多个 export，你可以按需导入：

```typescript
import { beat1, beat2, patternA } from '../beats/beatPatterns';
```


