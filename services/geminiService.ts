import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { WorkoutPlan, Difficulty } from "../types";
import { getStickFigureBase64, getPredefinedAnimation } from "./stickFigureAsset";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MOCK_PLAN: WorkoutPlan = {
    title: "全身激活演示 (离线版)",
    overview: "这是一个无需联网的演示计划，旨在快速激活全身肌肉群，适合测试程序功能。",
    totalDurationMinutes: 5,
    isDemo: true,
    exercises: [
        {
            name: "开合跳 (Jumping Jacks)",
            durationSeconds: 30,
            description: "双脚跳开，双臂上举，然后迅速回到起始姿势。",
            scientificBenefit: "快速提升心率，激活心肺功能。",
            category: "cardio"
        },
        {
            name: "深蹲 (Squats)",
            durationSeconds: 45,
            description: "双脚分开与肩同宽，臀部向后坐，保持背部挺直。",
            scientificBenefit: "强化大腿股四头肌与臀大肌，促进基础代谢。",
            category: "strength"
        },
        {
            name: "高抬腿 (High Knees)",
            durationSeconds: 30,
            description: "原地快速交替抬腿，膝盖尽量抬高至腰部水平。",
            scientificBenefit: "增强核心稳定性并进一步提升心肺耐力。",
            category: "cardio"
        },
        {
            name: "站立侧伸展 (Side Stretch)",
            durationSeconds: 30,
            description: "单手插腰，另一只手向对侧上方延伸，拉伸侧腹部。",
            scientificBenefit: "缓解脊柱压力，改善体态僵硬。",
            category: "flexibility"
        }
    ]
};

export const generateWorkoutPlan = async (
  focusArea: string,
  durationMinutes: number,
  difficulty: Difficulty,
  userState: string,
  onProgress?: (charsReceived: number) => void,
  useMock: boolean = false
): Promise<WorkoutPlan> => {
  
  // --- OFFLINE MODE ---
  if (useMock) {
      if (onProgress) {
          // Simulate progress bar for better UX
          let progress = 0;
          const interval = setInterval(() => {
              progress += 500;
              onProgress(progress);
              if (progress > 2500) clearInterval(interval);
          }, 100);
          await new Promise(resolve => setTimeout(resolve, 600)); // Fake delay
      }
      return MOCK_PLAN;
  }
  
  // --- ONLINE AI MODE ---
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    创建一个科学的健身计划。
    用户关注点：${focusArea}。
    期望时长：${durationMinutes} 分钟。
    难度：${difficulty}。
    用户当前状态：${userState}（例如：僵硬、精力充沛、疲惫）。

    规则：
    - 如果用户僵硬/疲惫，侧重于灵活性和动态伸展。
    - 如果用户精力充沛，侧重于 HIIT 或力量训练。
    - 包括热身和冷身动作。
    - "scientificBenefit" (科学益处) 应简要解释此特定动作如何从生理或神经学角度帮助用户当前的身体状态。
    - 分配每个动作的时长，使总时间大约为 ${durationMinutes} 分钟。
    - **所有文本内容（名称、描述、科学益处、标题、概述）必须使用中文。**
    - "category" 字段必须是以下英文单词之一：cardio, strength, flexibility, balance。
  `;

  // Use stream to get real-time progress
  const responseStream = await ai.models.generateContentStream({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overview: { type: Type.STRING },
          totalDurationMinutes: { type: Type.NUMBER },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                durationSeconds: { type: Type.NUMBER },
                description: { type: Type.STRING },
                scientificBenefit: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['cardio', 'strength', 'flexibility', 'balance'] }
              },
              required: ['name', 'durationSeconds', 'description', 'scientificBenefit', 'category']
            }
          }
        },
        required: ['title', 'overview', 'exercises', 'totalDurationMinutes']
      }
    }
  });

  let fullText = "";
  for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
          fullText += c.text;
          if (onProgress) {
              onProgress(fullText.length);
          }
      }
  }

  if (!fullText) {
    throw new Error("生成健身计划失败");
  }

  try {
      return JSON.parse(fullText) as WorkoutPlan;
  } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("生成的计划格式有误，请重试");
  }
};


// Generates 4 frames to simulate a smooth loop
// OR returns the static asset if useStaticOnly is true
export const generateStickFigureAnimation = async (exerciseName: string, useStaticOnly: boolean = false): Promise<string[]> => {
    
    // 1. Check for Predefined Animated SVG (High Priority, Best Quality)
    // If we have a hand-crafted SVG animation for this exercise, use it!
    const predefined = getPredefinedAnimation(exerciseName);
    if (predefined) {
        // Return as a single frame. The SVG itself contains SMIL animations (<animate>),
        // so the browser will handle the looping automatically.
        return [predefined];
    }

    // 2. Offline / Static Mode fallback
    // If no predefined animation, and we are in offline mode (or no API key),
    // fall back to the static "Stick Man" reference image.
    const refImageBase64 = await getStickFigureBase64();
    if (useStaticOnly || !process.env.API_KEY) {
        return [`data:image/png;base64,${refImageBase64}`];
    }

    // --- ONLINE AI MODE ---
    // Style prompt to enforce consistency
    const basePrompt = `
      Reference Image Provided: You MUST follow the visual style of the provided reference image EXACTLY.
      Style: Dark background (black), Neon Teal glowing lines (#2dd4bf), Pure White core lines, Golden glowing head.
      Subject: A stick figure character performing an exercise.
      Output: A single full-body image of the character in the specified pose. Do not add text.
      
      The character is performing: ${exerciseName}.
    `;

    // Define 4 phases of motion
    const prompts = [
        `${basePrompt} Phase 1: Preparation / Starting stance.`,
        `${basePrompt} Phase 2: Beginning the movement.`,
        `${basePrompt} Phase 3: Peak action / Maximum extension.`,
        `${basePrompt} Phase 4: Returning / Release.`
    ];

    try {
        // Generate all frames in parallel using the reference image
        const promises = prompts.map(p => {
             // Attach the static reference image to every request
             const parts: any[] = [{ text: p }];
             if (refImageBase64) {
                 parts.unshift({ inlineData: { mimeType: 'image/png', data: refImageBase64 } });
             }
             
             return ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts }
            });
        });

        const results = await Promise.all(promises);

        const frames = results.map(res => {
            if (res.candidates?.[0]?.content?.parts) {
                for (const part of res.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:image/png;base64,${part.inlineData.data}`;
                    }
                }
            }
            return null;
        }).filter(Boolean) as string[];

        return frames;

    } catch (e) {
        console.warn("Animation generation failed", e);
        // Fallback to static image on error
        return [`data:image/png;base64,${refImageBase64}`];
    }
}