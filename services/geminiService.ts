import { getStickFigureBase64, getPredefinedAnimation } from "./stickFigureAsset";
import { GoogleGenAI } from "@google/genai";
import type { GuideData, Landmark } from "../actions/base/types";
import { DEFAULT_FPS } from "../utils/skeletonDrawer";

// 辅助函数：将数组格式 [x, y, z] 转换为对象格式 { x, y, z }
const convertArrayToLandmark = (arr: any): Landmark => {
    if (Array.isArray(arr)) {
        return { x: arr[0] || 0, y: arr[1] || 0, z: arr[2] || 0 };
    }
    // 如果已经是对象格式，直接返回
    return arr as Landmark;
};

// 辅助函数：转换整个帧数组
const convertFramesToLandmarks = (frames: any[]): Landmark[][] => {
    return frames.map(frame => {
        if (!Array.isArray(frame)) return [];
        return frame.map(landmark => convertArrayToLandmark(landmark));
    });
};

// 从环境变量获取 API key，不允许硬编码
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error(
        "请设置 VITE_GEMINI_API_KEY 环境变量。\n" +
        "创建 .env.local 文件并添加: VITE_GEMINI_API_KEY=your_api_key_here"
    );
}

// 调试：检查环境变量是否加载
if (import.meta.env.DEV) {
    console.log("环境变量检查:", {
        VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY ? "已设置" : "未设置",
        apiKeyLength: apiKey.length,
        source: "环境变量"
    });
}

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

// 平滑处理并首尾衔接，生成可循环播放的动画
export const smoothActionFramesWithLoop = async (
    frames: number[][][],
    bpm: number = 120,
    framesPerBeat: number = 30
): Promise<GuideData> => {
    try {
        if (!apiKey) {
            throw new Error("请先设置 GEMINI_API_KEY 或 VITE_GEMINI_API_KEY 环境变量");
        }

        const simplifiedData = frames.map(frame =>
            frame.map((lp: any) => ({
                x: Math.round(lp.x * 1000) / 1000,
                y: Math.round(lp.y * 1000) / 1000,
                z: Math.round(lp.z * 1000) / 1000
            }))
        );

        // 计算总拍数（基于帧数和BPM）
        const durationSeconds = frames.length / DEFAULT_FPS;
        const totalBeats = Math.ceil((durationSeconds * bpm) / 60);

        const prompt = `
你是一个专业的动作平滑处理AI。我会给你一段动作的骨骼点序列数据，这是一个完整的动作循环。

请分析这段数据并执行平滑处理，生成可以无缝循环播放的动画帧序列。

要求：
1. 对原始帧序列进行平滑插值，确保动作流畅自然
2. 总共生成 ${totalBeats * framesPerBeat} 帧完整动画
3. **关键要求**：确保最后一帧和第一帧能够完美衔接，实现无缝循环
4. 最后一帧的骨骼点位置应该平滑过渡到第一帧，形成一个完整的循环
5. 返回格式为JSON对象：
{
  "totalBeats": ${totalBeats},
  "framesPerBeat": ${framesPerBeat},
  "frames": [...], // 完整的骨骼点序列，每个元素是 [landmark][x,y,z]，最后一帧应该能平滑过渡到第一帧
  "isLoop": true // 标记为循环动画
}

原始数据序列（${frames.length} 帧）：
${JSON.stringify(simplifiedData)}

请务必只返回 JSON 格式，不要有任何多余的解释。确保最后一帧能平滑过渡到第一帧。
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
            
            // 确保最后一帧能平滑过渡到第一帧
            let processedFrames = parsed.frames || [];
            if (processedFrames.length > 0) {
                const firstFrame = processedFrames[0];
                const lastFrame = processedFrames[processedFrames.length - 1];
                
                // 在最后一帧和第一帧之间添加过渡帧
                const transitionFrames = [];
                for (let i = 0; i < 5; i++) {
                    const ratio = i / 5;
                    const transitionFrame = firstFrame.map((landmark: any, idx: number) => {
                        const first = convertArrayToLandmark(firstFrame[idx]);
                        const last = convertArrayToLandmark(lastFrame[idx]);
                        return {
                            x: last.x * (1 - ratio) + first.x * ratio,
                            y: last.y * (1 - ratio) + first.y * ratio,
                            z: (last.z || 0) * (1 - ratio) + (first.z || 0) * ratio
                        };
                    });
                    transitionFrames.push(transitionFrame);
                }
                
                // 将过渡帧插入到末尾
                processedFrames = [...processedFrames, ...transitionFrames];
            }
            
            // 转换数组格式为对象格式
            const convertedFrames = convertFramesToLandmarks(processedFrames);
            
            return {
                totalBeats: parsed.totalBeats || totalBeats,
                framesPerBeat: parsed.framesPerBeat || framesPerBeat,
                frames: convertedFrames,
                bpm: bpm,
                markedFrameIndices: [],
                isLoop: true
            };
        }

        throw new Error("AI 返回格式错误");
    } catch (error) {
        console.error("Gemini Smooth Loop Error:", error);
        throw error;
    }
};

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
            // 转换数组格式为对象格式
            const convertedFrames = convertFramesToLandmarks(parsed.frames || []);
            return {
                totalBeats: parsed.totalBeats || totalBeats,
                framesPerBeat: parsed.framesPerBeat || framesPerBeat,
                frames: convertedFrames,
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
