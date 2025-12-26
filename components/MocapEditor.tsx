import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Play, Square, RefreshCcw, Loader2, Wand2, Check, Save, MapPin } from 'lucide-react';
import { poseService } from '../services/poseService';
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { analyzeMovement } from '../services/geminiService';
import ActionMarkerEditor from './ActionMarkerEditor';
import { drawSkeleton, RECORDING_COLOR, SKELETON_COLOR, DEFAULT_FPS } from '../utils/skeletonDrawer';

interface Props {
    onClose: () => void;
}

enum MocapState {
    IDLE,
    RECORDING,
    ANALYZING,
    RESULT,
    MARKING
}

const MocapEditor: React.FC<Props> = ({ onClose }) => {
    const [state, setState] = useState<MocapState>(MocapState.IDLE);
    const [cameraReady, setCameraReady] = useState(false);
    const [modelReady, setModelReady] = useState(false);
    const [recordedData, setRecordedData] = useState<any[][]>([]);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'none' | 'saving' | 'saved' | 'error'>('none');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);
    const recordingBufferRef = useRef<any[][]>([]);

    // 初始化摄像头和模型
    useEffect(() => {
        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setCameraReady(true);

                poseLandmarkerRef.current = await poseService.getPoseLandmarker();
                setModelReady(true);
            } catch (err: any) {
                console.error("Initialization failed", err);
                setError("初始化失败: " + err.message);
            }
        };
        init();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // 循环检测
    useEffect(() => {
        let isLooping = true;
        const loop = () => {
            if (!isLooping) return;
            predictWebcam();
            requestRef.current = requestAnimationFrame(loop);
        };

        if (cameraReady && modelReady) {
            loop();
        }
        return () => { isLooping = false; };
    }, [cameraReady, modelReady, state]);

    const predictWebcam = () => {
        const landmarker = poseLandmarkerRef.current;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!landmarker || !video || !canvas || video.readyState < 2) return;

        if (video.currentTime === lastVideoTimeRef.current) return;
        lastVideoTimeRef.current = video.currentTime;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const now = performance.now();
        landmarker.detectForVideo(video, now, (result) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (result.landmarks && result.landmarks[0]) {
                const landmarks = result.landmarks[0];
                drawSkeleton(ctx, landmarks, canvas.width, canvas.height, {
                    strokeColor: state === MocapState.RECORDING ? RECORDING_COLOR : SKELETON_COLOR
                });

                if (state === MocapState.RECORDING) {
                    recordingBufferRef.current.push(landmarks);
                }
            }
        });
    };

    const startRecording = () => {
        recordingBufferRef.current = [];
        setState(MocapState.RECORDING);
    };

    const stopRecording = () => {
        setState(MocapState.IDLE);
        setRecordedData([...recordingBufferRef.current]);
    };

    const handleAnalyze = async () => {
        if (recordedData.length === 0) return;
        setState(MocapState.ANALYZING);
        try {
            const result = await analyzeMovement(recordedData);
            setAnalysisResult(result);
            setState(MocapState.RESULT);
        } catch (err: any) {
            setError("分析失败: " + err.message);
            setState(MocapState.IDLE);
        }
    };

    const handleSaveToProject = async () => {
        if (!analysisResult) return;
        setSaveStatus('saving');

        try {
            // 构造文件内容
            const actionName = analysisResult.englishName;
            const files = {
                'Detector.ts': `
/**
 * AI 生成的动作检测逻辑
 */
export class \${actionName}Detector {
  private lastCompleted = false;

  detect(landmarks: any[], previousLandmarks: any[]) {
    // 基础检测逻辑 (基于 AI 提取的关键点和阈值)
    const points = [\${analysisResult.keyPoints.join(', ')}];
    const threshold = \${analysisResult.threshold};
    
    // 这是一个示意逻辑，实际会根据 AI 提供的 logic 进行更复杂的条件判定
    // \${analysisResult.logic}
    
    // 模拟完成判定
    const isCompleted = false; // TODO: 实现具体算法
    
    return {
      isCompleted,
      accuracy: 0.85
    };
  }

  reset() {
    this.lastCompleted = false;
  }
}
`,
                'Action.tsx': `
import React from 'react';
import { ActionComponent, ActionCategory, BodyPart } from '../base/ActionBase';
import { \${actionName}Detector } from './Detector';

const \${actionName}Action: ActionComponent = {
  name: '\${analysisResult.name}',
  englishName: '\${actionName.toUpperCase()}',
  category: ActionCategory.STRENGTH,
  targetParts: [BodyPart.ARMS],
  durationSeconds: 30,

  Guide: () => <div>Guide for \${analysisResult.name}</div>,
  Beat: { bpm: 120, pattern: [0, 1, 2, 3] },
  Detector: new \${actionName}Detector() as any,
  Display: () => <div>Display for \${analysisResult.name}</div>
};

export default \${actionName}Action;
`
            };

            const response = await fetch('/api/save-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    englishName: actionName,
                    files
                })
            });

            const result = await response.json();
            if (result.success) {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('none'), 3000);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError("保存失败: " + err.message);
            setSaveStatus('error');
        }
    };

    const handleSaveGuide = async (guideData: any) => {
        if (!analysisResult) return;
        
        try {
            const actionName = analysisResult.englishName.toLowerCase().replace(/\s+/g, '_');
            
            const response = await fetch('/api/save-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionName,
                    guideData: {
                        ...guideData,
                        bpm: guideData.bpm || 120
                    }
                })
            });

            const result = await response.json();
            if (result.success) {
                setState(MocapState.RESULT);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            setError("保存Guide失败: " + err.message);
        }
    };

    const reset = () => {
        setRecordedData([]);
        setAnalysisResult(null);
        setState(MocapState.IDLE);
    };

    if (state === MocapState.MARKING) {
        return (
            <ActionMarkerEditor
                recordedFrames={recordedData}
                onClose={() => setState(MocapState.IDLE)}
                onSave={handleSaveGuide}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col font-sans">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tight">动作捕获与 AI 分析</h2>
                        <p className="text-xs text-white/50 font-medium">录制动作并自动化生成项目代码</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-[2] relative bg-black flex items-center justify-center overflow-hidden">
                    <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50 mirror" playsInline muted />
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain z-10 mirror" />

                    {state === MocapState.RECORDING && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-red-600/20 border border-red-500/50 px-6 py-3 rounded-2xl backdrop-blur-md animate-pulse">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span className="font-black italic uppercase tracking-widest text-red-500">录制中 - 请重复做 3 遍动作</span>
                            <span className="text-white/70 font-mono">{Math.floor(recordingBufferRef.current.length / DEFAULT_FPS)}s</span>
                        </div>
                    )}

                    {state === MocapState.ANALYZING && (
                        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                            <Loader2 className="w-16 h-16 text-teal-500 animate-spin" />
                            <div className="text-center">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">AI 正在深度学习您的动作...</h3>
                                <p className="text-white/60 mt-2">正在提取关键骨骼点、节奏与完成标准</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute top-4 left-4 right-4 z-[60] bg-red-500/20 border border-red-500/50 p-4 rounded-xl backdrop-blur-md text-red-200 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                <div className="flex-1 border-l border-white/10 bg-slate-900 overflow-y-auto p-6 flex flex-col gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest">流程控制</h3>

                        <div className="grid grid-cols-1 gap-3">
                            {state === MocapState.IDLE && recordedData.length === 0 && (
                                <button
                                    onClick={startRecording}
                                    disabled={!modelReady}
                                    className="flex items-center justify-center gap-3 bg-white text-black font-black py-4 rounded-2xl hover:bg-teal-400 transition-all disabled:opacity-50"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    开始录制
                                </button>
                            )}

                            {state === MocapState.RECORDING && (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center justify-center gap-3 bg-red-500 text-white font-black py-4 rounded-2xl hover:bg-red-600 transition-all"
                                >
                                    <Square className="w-5 h-5 fill-current" />
                                    停止录制
                                </button>
                            )}

                            {recordedData.length > 0 && state === MocapState.IDLE && (
                                <>
                                    <button
                                        onClick={handleAnalyze}
                                        className="flex items-center justify-center gap-3 bg-teal-500 text-white font-black py-4 rounded-2xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                        AI 分析动作 ({recordedData.length} 帧)
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="flex items-center justify-center gap-3 bg-white/5 text-white/60 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                        重新录制
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {analysisResult && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
                                <div className="flex items-center gap-2 text-teal-400 mb-2">
                                    <Check className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">分析完成</span>
                                </div>
                                <h4 className="text-xl font-black italic text-white uppercase">{analysisResult.name}</h4>
                                <p className="text-sm text-white/70 mt-1">{analysisResult.description}</p>
                            </div>

                            <button
                                onClick={() => setState(MocapState.MARKING)}
                                className="w-full flex items-center justify-center gap-3 bg-orange-500 text-white font-black py-4 rounded-2xl hover:bg-orange-600 transition-all"
                            >
                                <MapPin className="w-5 h-5" />
                                标记动作拍点
                            </button>

                            <button
                                onClick={handleSaveToProject}
                                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all \${
                  saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-teal-400'
                }`}
                            >
                                {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saveStatus === 'saved' ? '已保存到 Actions 目录' : '一键同步到项目代码'}
                            </button>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">AI 逻辑推断</h3>
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                    <p className="text-xs text-white/80 leading-relaxed italic">
                                        "{analysisResult.logic}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!analysisResult && state === MocapState.IDLE && recordedData.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center gap-4">
                            <Camera className="w-16 h-16" />
                            <p className="text-sm font-medium px-10">准备好后点击开始，并至少重复动作 3 次以获得最佳效果</p>
                        </div>
                    )}
                </div>
            </div>
            <style>{`.mirror { transform: scaleX(-1); }`}</style>
        </div>
    );
};

export default MocapEditor;
