import { getStickFigureBase64, getPredefinedAnimation } from "./stickFigureAsset";
import { GoogleGenAI } from "@google/genai";
import type { GuideData } from "../actions/base/types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const analyzeMovement = async (landmarksSequence: any[]): Promise<any> => {
    try {
        if (!apiKey) {
            throw new Error("请先设置 GEMINI_API_KEY 或 VITE_GEMINI_API_KEY 环境变量");
        }

        const sampledData = landmarksSequence.filter((_, i) => i % 5 === 0);
        const simplifiedData = sampledData.map(frame =>
            frame.map((lp: any) => ({
                x: Math.round(lp.x * 1000) / 1000,
                y: Math.round(lp.y * 1000) / 1000,
                z: Math.round(lp.z * 1000) / 1000
            }))
        );

        const prompt = `
        你是一个专业的健身动作分析AI。我会给你一段 3D 骨骼点序列数据（MediaPipe Pose 格式）。
        这段数据包含用户重复做了至少 3 次的动作。

        请分析这段数据并返回一个 JSON 对象，包含以下字段：
        1. name: 动作的中文名称
        2. englishName: 动作的英文名称 (UpperCamelCase, 如 "Squat" 或 "JumpingJack")
        3. description: 动作的简短中文描述
        4. keyPoints: 一个包含 3 个索引的数组，代表该动作中最关键的三个关节点（MediaPipe 索引）。
        5. threshold: 动作触发的阈值。
        6. logic: 简述检测该动作的逻辑。

        数据序列：
        ${JSON.stringify(simplifiedData)}

        请务必只返回 JSON 格式，不要有任何多余的解释。
        `;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const text = result.text;
        if (!text) {
            throw new Error("AI 返回内容为空");
        }

        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error("AI 返回格式错误");
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
}

// Generates 4 frames to simulate a smooth loop
// OR returns static asset if useStaticOnly is true
export const generateStickFigureAnimation = async (exerciseName: string, useStaticOnly: boolean = false): Promise<string[]> => {

    // 1. Check for Predefined Animated SVG (High Priority, Best Quality)
    // If we have a hand-crafted SVG animation for this exercise, use it!
    const predefined = getPredefinedAnimation(exerciseName);
    if (predefined) {
        // Return as a single frame. The SVG itself contains SMIL animations (<animate>),
        // so the browser will handle the looping automatically.
        return [predefined];
    }

    // 2. Fallback to static "Stick Man" reference image.
    const refImageBase64 = await getStickFigureBase64();
    return [`data:image/png;base64,${refImageBase64}`];
}

export const smoothActionFrames = async (
    markedFrames: number[][][],
    totalBeats: number,
    bpm: number = 120,
    framesPerBeat: number = 30
): Promise<GuideData> => {
    try {
        if (!apiKey) {
            throw new Error("请先设置 GEMINI_API_KEY 或 VITE_GEMINI_API_KEY 环境变量");
        }

        const simplifiedData = markedFrames.map(beat =>
            beat.map(frame =>
                frame.map((lp: any) => ({
                    x: Math.round(lp.x * 1000) / 1000,
                    y: Math.round(lp.y * 1000) / 1000,
                    z: Math.round(lp.z * 1000) / 1000
                }))
            )
        );

        const prompt = `
你是一个专业的动作平滑处理AI。我会给你一段动作的骨骼点序列数据，其中每一拍对应一帧骨骼点。

请分析这段数据并执行平滑处理，生成完整的guide动画帧序列。

要求：
1. 在每两个标记帧之间进行平滑插值
2. 总共生成 ${totalBeats} * ${framesPerBeat} 帧完整动画
3. 确保动作流畅自然，没有突变
4. 返回格式为JSON对象：
{
  "totalBeats": ${totalBeats},
  "framesPerBeat": ${framesPerBeat},
  "frames": [...], // 完整的骨骼点序列，每个元素是 [landmark][x,y,z]
  "markedFrameIndices": [...] // 标记帧在完整序列中的索引
}

数据序列（每拍对应的骨骼点）：
${JSON.stringify(simplifiedData)}

请务必只返回 JSON 格式，不要有任何多余的解释。
`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        const text = result.text;
        if (!text) {
            throw new Error("AI 返回内容为空");
        }

        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                totalBeats: parsed.totalBeats || totalBeats,
                framesPerBeat: parsed.framesPerBeat || framesPerBeat,
                frames: parsed.frames || [],
                bpm: bpm,
                markedFrameIndices: parsed.markedFrameIndices || []
            };
        }

        throw new Error("AI 返回格式错误");
    } catch (error) {
        console.error("Gemini Smooth Error:", error);
        throw error;
    }
}
