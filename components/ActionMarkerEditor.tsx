import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Check, Wand2, Save, ArrowLeft } from 'lucide-react';
import { smoothActionFrames } from '../services/geminiService';
import { drawSkeleton, SKELETON_COLOR, MARKER_COLOR, DEFAULT_FPS } from '../utils/skeletonDrawer';

interface Props {
    recordedFrames: any[][];
    onClose: () => void;
    onSave: (guideData: any) => void;
}

interface MarkerPoint {
    frameIndex: number;
    time: number;
}

const ActionMarkerEditor: React.FC<Props> = ({ recordedFrames, onClose, onSave }) => {
    const [bpm, setBpm] = useState(120);
    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);

    const totalFrames = recordedFrames.length;
    const framesPerSecond = DEFAULT_FPS;

    useEffect(() => {
        if (canvasRef.current && recordedFrames.length > 0) {
            drawFrame(currentFrameIndex);
        }
    }, [currentFrameIndex, recordedFrames]);

    useEffect(() => {
        if (isPlaying) {
            lastFrameTimeRef.current = performance.now();
            animationRef.current = requestAnimationFrame(playLoop);
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying]);

    const playLoop = useCallback(() => {
        const now = performance.now();
        const deltaTime = now - lastFrameTimeRef.current;
        
        if (deltaTime >= 1000 / framesPerSecond) {
            setCurrentFrameIndex(prev => {
                if (prev >= totalFrames - 1) {
                    setIsPlaying(false);
                    return totalFrames - 1;
                }
                return prev + 1;
            });
            lastFrameTimeRef.current = now;
        }
        
        animationRef.current = requestAnimationFrame(playLoop);
    }, [totalFrames]);

    const drawFrame = (frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !recordedFrames[frameIndex]) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const landmarks = recordedFrames[frameIndex];
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        drawSkeleton(ctx, landmarks, width, height, {
            strokeColor: markers.some(m => m.frameIndex === frameIndex) ? MARKER_COLOR : SKELETON_COLOR
        });
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const frameIndex = Math.floor(progress * totalFrames);
        setCurrentFrameIndex(Math.max(0, Math.min(frameIndex, totalFrames - 1)));
    };

    const toggleMarker = () => {
        const existingIndex = markers.findIndex(m => m.frameIndex === currentFrameIndex);
        if (existingIndex >= 0) {
            setMarkers(prev => prev.filter((_, i) => i !== existingIndex));
        } else {
            const newMarker: MarkerPoint = {
                frameIndex: currentFrameIndex,
                time: currentFrameIndex / framesPerSecond
            };
            setMarkers(prev => [...prev, newMarker].sort((a, b) => a.frameIndex - b.frameIndex));
        }
    };

    const handleProcessAI = async () => {
        if (markers.length === 0) {
            setError('请先标记至少一个拍点');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const markedFrames = markers.map(marker => [recordedFrames[marker.frameIndex]]);
            const totalBeats = markers.length;

            const guideData = await smoothActionFrames(markedFrames, totalBeats, bpm);
            onSave(guideData);
        } catch (err: any) {
            setError('AI处理失败: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col font-sans">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black italic uppercase tracking-tight">动作标记编辑器</h2>
                        <p className="text-xs text-white/50">标记拍点以生成Guide动画</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={640}
                        height={480}
                        className="max-w-full max-h-full object-contain"
                    />

                    {markers.some(m => m.frameIndex === currentFrameIndex) && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-2 rounded-full font-black text-sm">
                            <Check className="w-4 h-4 inline mr-1" />
                            已标记
                        </div>
                    )}
                </div>

                <div className="w-full md:w-96 bg-slate-900 flex flex-col border-l border-white/10">
                    <div className="p-4 space-y-4 border-b border-white/10">
                        <div>
                            <label className="block text-xs font-bold text-teal-500 uppercase tracking-widest mb-2">BPM (节拍速度)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="60"
                                    max="200"
                                    value={bpm}
                                    onChange={(e) => setBpm(Number(e.target.value))}
                                    className="flex-1 accent-teal-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                                />
                                <span className="text-xl font-black text-teal-400 w-16 text-right">{bpm}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-white/40">标记拍点: </span>
                                <span className="text-orange-400 font-black text-xl">{markers.length}</span>
                            </div>
                            <button
                                onClick={toggleMarker}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                                    markers.some(m => m.frameIndex === currentFrameIndex)
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                        : 'bg-teal-500 hover:bg-teal-600 text-white'
                                }`}
                            >
                                {markers.some(m => m.frameIndex === currentFrameIndex) ? '移除标记' : '标记此帧'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">已标记的拍点</h3>
                        <div className="space-y-2">
                            {markers.map((marker, index) => (
                                <div
                                    key={marker.frameIndex}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                        marker.frameIndex === currentFrameIndex
                                            ? 'bg-orange-500/20 border border-orange-500/50'
                                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                    }`}
                                    onClick={() => setCurrentFrameIndex(marker.frameIndex)}
                                >
                                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-black text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">拍点 {index + 1}</div>
                                        <div className="text-xs text-white/50">帧 {marker.frameIndex}</div>
                                    </div>
                                    <div className="text-xs text-white/50 font-mono">
                                        {formatTime(marker.time)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 space-y-3">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-red-200 text-sm flex items-center gap-2">
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleProcessAI}
                            disabled={isProcessing || markers.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-black py-3 rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>AI 处理中...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>AI 平滑处理并生成 Guide</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border-t border-white/10 p-4">
                <div className="flex items-center gap-4 mb-3">
                    <button
                        onClick={() => setCurrentFrameIndex(0)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 10))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'
                        }`}
                    >
                        {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                    </button>
                    <button
                        onClick={() => setCurrentFrameIndex(Math.min(totalFrames - 1, currentFrameIndex + 10))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setCurrentFrameIndex(totalFrames - 1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/60">
                    <span className="font-mono">{formatTime(currentFrameIndex / framesPerSecond)}</span>
                    <div
                        className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                        onClick={handleTimelineClick}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 relative"
                            style={{ width: `${(currentFrameIndex / totalFrames) * 100}%` }}
                        >
                            {markers.map(marker => (
                                <div
                                    key={marker.frameIndex}
                                    className="absolute top-0 bottom-0 w-2 bg-orange-500"
                                    style={{ left: `${(marker.frameIndex / totalFrames) * 100}%` }}
                                />
                            ))}
                        </div>
                    </div>
                    <span className="font-mono">{formatTime(totalFrames / framesPerSecond)}</span>
                </div>
            </div>
        </div>
    );
};

export default ActionMarkerEditor;
