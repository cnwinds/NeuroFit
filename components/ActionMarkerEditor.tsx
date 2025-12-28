import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Check, Wand2, Save, ArrowLeft, PlayCircle, Square } from 'lucide-react';
import { smoothActionFramesWithLoop } from '../services/geminiService';
import { drawSkeleton, SKELETON_COLOR, MARKER_COLOR, DEFAULT_FPS } from '../utils/skeletonDrawer';

interface Props {
    recordedFrames: any[][];
    onClose: () => void;
    onSave: (guideData: any) => void;
}

interface MarkerPoint {
    frameIndex: number;
    time: number;
    type: 'start' | 'end';
}

const ActionMarkerEditor: React.FC<Props> = ({ recordedFrames, onClose, onSave }) => {
    const [bpm, setBpm] = useState(120);
    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; frameIndex: number } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const markerBarRef = useRef<HTMLDivElement>(null);
    const thumbnailBarRef = useRef<HTMLDivElement>(null);
    const isScrollingRef = useRef(false);
    const isDraggingRef = useRef<'marker' | 'thumbnail' | null>(null);
    const dragStartXRef = useRef(0);
    const dragStartScrollLeftRef = useRef(0);
    const isClickRef = useRef(false);
    const [visibleWindow, setVisibleWindow] = useState<{ left: number; width: number }>({ left: 0, width: 100 });

    const totalFrames = recordedFrames.length;
    const framesPerSecond = DEFAULT_FPS;

    // 生成所有帧的缩略图
    const generateThumbnails = useCallback(() => {
        if (!thumbnailCanvasRef.current) {
            thumbnailCanvasRef.current = document.createElement('canvas');
        }
        const thumbCanvas = thumbnailCanvasRef.current;
        thumbCanvas.width = 120;
        thumbCanvas.height = 90;

        const thumbnailsList: string[] = [];
        const maxThumbnails = 50;
        const step = Math.max(1, Math.floor(totalFrames / maxThumbnails));

        for (let i = 0; i < totalFrames; i += step) {
            const ctx = thumbCanvas.getContext('2d');
            if (!ctx) continue;

            ctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);

            const landmarks = recordedFrames[i];
            if (landmarks) {
                drawSkeleton(ctx, landmarks, thumbCanvas.width, thumbCanvas.height, {
                    strokeColor: SKELETON_COLOR,
                    mirror: true,
                    lineWidth: 2
                });
            }

            thumbnailsList.push(thumbCanvas.toDataURL('image/png'));
        }

        // 确保最后一帧也被包含
        if (totalFrames > 0 && thumbnailsList.length > 0) {
            const lastFrameIndex = totalFrames - 1;
            const lastThumbnailIndex = Math.floor(lastFrameIndex / step) * step;
            if (lastThumbnailIndex !== (thumbnailsList.length - 1) * step) {
                const ctx = thumbCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
                    const landmarks = recordedFrames[lastFrameIndex];
                    if (landmarks) {
                        drawSkeleton(ctx, landmarks, thumbCanvas.width, thumbCanvas.height, {
                            strokeColor: SKELETON_COLOR,
                            mirror: true,
                            lineWidth: 2
                        });
                    }
                    thumbnailsList.push(thumbCanvas.toDataURL('image/png'));
                }
            }
        }

        setThumbnails(thumbnailsList);
    }, [recordedFrames, totalFrames]);

    // 生成缩略图
    useEffect(() => {
        if (recordedFrames.length > 0 && thumbnails.length === 0) {
            generateThumbnails();
        }
    }, [recordedFrames.length, thumbnails.length, generateThumbnails]);

    // 绘制当前帧
    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !recordedFrames[frameIndex]) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const landmarks = recordedFrames[frameIndex];
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const startMarker = markers.find(m => m.type === 'start' && m.frameIndex === frameIndex);
        const endMarker = markers.find(m => m.type === 'end' && m.frameIndex === frameIndex);
        const strokeColor = startMarker ? MARKER_COLOR : endMarker ? MARKER_COLOR : SKELETON_COLOR;

        drawSkeleton(ctx, landmarks, width, height, {
            strokeColor,
            mirror: true
        });
    }, [recordedFrames, markers]);

    // 绘制当前帧
    useEffect(() => {
        if (canvasRef.current && recordedFrames.length > 0) {
            drawFrame(currentFrameIndex);
        }
    }, [currentFrameIndex, recordedFrames, drawFrame]);

    // 播放循环 - 预览标记范围内的帧
    useEffect(() => {
        if (!isPlaying) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            return;
        }

        const { startMarker, endMarker } = getStartEndFrames();
        
        // 如果有开始和结束标记，只播放标记范围内的帧
        let playStartFrame = 0;
        let playEndFrame = totalFrames - 1;
        let shouldLoop = false;

        if (startMarker && endMarker && startMarker.frameIndex < endMarker.frameIndex) {
            playStartFrame = startMarker.frameIndex;
            playEndFrame = endMarker.frameIndex;
            shouldLoop = true;
            // 如果正在播放，且当前帧不在标记范围内，跳转到开始帧
            if (currentFrameIndex < playStartFrame || currentFrameIndex > playEndFrame) {
                setCurrentFrameIndex(playStartFrame);
            }
        }

        const playLoop = () => {
            if (!isPlaying) return;

            const now = performance.now();
            const deltaTime = now - lastFrameTimeRef.current;
            
            if (deltaTime >= 1000 / framesPerSecond) {
                setCurrentFrameIndex(prev => {
                    let next = prev + 1;
                    
                    // 如果在标记范围内播放
                    if (shouldLoop) {
                        if (next > playEndFrame) {
                            // 循环回到开始帧
                            next = playStartFrame;
                        }
                    } else {
                        // 播放全部帧
                        if (next >= totalFrames) {
                            setIsPlaying(false);
                            return totalFrames - 1;
                        }
                    }
                    
                    return next;
                });
                lastFrameTimeRef.current = now;
            }
            
            animationRef.current = requestAnimationFrame(playLoop);
        };

        lastFrameTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(playLoop);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [isPlaying, markers, totalFrames, framesPerSecond, currentFrameIndex]);

    // 同步标记条和缩略图条的滚动
    const syncScroll = useCallback((source: 'marker' | 'thumbnail') => {
        if (isScrollingRef.current || !markerBarRef.current || !thumbnailBarRef.current) return;

        isScrollingRef.current = true;

        if (source === 'marker') {
            const markerScrollLeft = markerBarRef.current.scrollLeft;
            const markerScrollWidth = markerBarRef.current.scrollWidth;
            const markerClientWidth = markerBarRef.current.clientWidth;
            const thumbnailScrollWidth = thumbnailBarRef.current.scrollWidth;
            const thumbnailClientWidth = thumbnailBarRef.current.clientWidth;

            if (markerScrollWidth > markerClientWidth && thumbnailScrollWidth > thumbnailClientWidth) {
                const scrollRatio = markerScrollLeft / (markerScrollWidth - markerClientWidth);
                thumbnailBarRef.current.scrollLeft = scrollRatio * (thumbnailScrollWidth - thumbnailClientWidth);
            }
        } else if (source === 'thumbnail') {
            const thumbnailScrollLeft = thumbnailBarRef.current.scrollLeft;
            const thumbnailScrollWidth = thumbnailBarRef.current.scrollWidth;
            const thumbnailClientWidth = thumbnailBarRef.current.clientWidth;
            const markerScrollWidth = markerBarRef.current.scrollWidth;
            const markerClientWidth = markerBarRef.current.clientWidth;

            if (thumbnailScrollWidth > thumbnailClientWidth && markerScrollWidth > markerClientWidth) {
                const scrollRatio = thumbnailScrollLeft / (thumbnailScrollWidth - thumbnailClientWidth);
                markerBarRef.current.scrollLeft = scrollRatio * (markerScrollWidth - markerClientWidth);
            }
        }

        requestAnimationFrame(() => {
            isScrollingRef.current = false;
        });
    }, []);

    // 滚动到指定帧位置
    const scrollToFrame = useCallback((frameIndex: number) => {
        if (!markerBarRef.current || !thumbnailBarRef.current) return;

        const progress = frameIndex / totalFrames;

        const markerScrollWidth = markerBarRef.current.scrollWidth;
        const markerClientWidth = markerBarRef.current.clientWidth;
        if (markerScrollWidth > markerClientWidth) {
            const maxScroll = markerScrollWidth - markerClientWidth;
            const targetScrollLeft = progress * maxScroll;
            markerBarRef.current.scrollLeft = targetScrollLeft;
        }

        const thumbnailScrollWidth = thumbnailBarRef.current.scrollWidth;
        const thumbnailClientWidth = thumbnailBarRef.current.clientWidth;
        if (thumbnailScrollWidth > thumbnailClientWidth) {
            const maxScroll = thumbnailScrollWidth - thumbnailClientWidth;
            const targetScrollLeft = progress * maxScroll;
            thumbnailBarRef.current.scrollLeft = targetScrollLeft;
        }
    }, [totalFrames]);

    // 当缩略图生成完成后，初始化滚动位置
    useEffect(() => {
        if (thumbnails.length > 0 && markerBarRef.current && thumbnailBarRef.current) {
            scrollToFrame(currentFrameIndex);
        }
    }, [thumbnails.length, scrollToFrame]);

    // 当 currentFrameIndex 变化时，同步两个栏的滚动位置
    useEffect(() => {
        if (thumbnails.length > 0 && !isDraggingRef.current) {
            scrollToFrame(currentFrameIndex);
        }
    }, [currentFrameIndex, thumbnails.length, scrollToFrame]);

    // 更新可见窗口指示器
    const updateVisibleWindow = useCallback(() => {
        if (thumbnailBarRef.current) {
            const scrollLeft = thumbnailBarRef.current.scrollLeft;
            const scrollWidth = thumbnailBarRef.current.scrollWidth;
            const clientWidth = thumbnailBarRef.current.clientWidth;
            const leftPercent = (scrollLeft / scrollWidth) * 100;
            const widthPercent = (clientWidth / scrollWidth) * 100;
            setVisibleWindow({ left: leftPercent, width: widthPercent });
        }
    }, []);

    useEffect(() => {
        if (thumbnailBarRef.current) {
            updateVisibleWindow();
            thumbnailBarRef.current.addEventListener('scroll', updateVisibleWindow);
            window.addEventListener('resize', updateVisibleWindow);
        }
        return () => {
            if (thumbnailBarRef.current) {
                thumbnailBarRef.current.removeEventListener('scroll', updateVisibleWindow);
            }
            window.removeEventListener('resize', updateVisibleWindow);
        };
    }, [thumbnails.length, updateVisibleWindow]);

    // 处理标记条滚动
    const handleMarkerBarScroll = useCallback(() => {
        syncScroll('marker');
    }, [syncScroll]);

    // 处理缩略图条滚动
    const handleThumbnailBarScroll = useCallback(() => {
        if (!isDraggingRef.current) {
            syncScroll('thumbnail');
        }
    }, [syncScroll]);

    // 处理标记栏拖动开始
    const handleMarkerBarMouseDown = useCallback((e: React.MouseEvent) => {
        if (!markerBarRef.current) return;
        isDraggingRef.current = 'marker';
        isClickRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartScrollLeftRef.current = markerBarRef.current.scrollLeft;
        markerBarRef.current.style.cursor = 'grabbing';
        e.preventDefault();
    }, []);

    // 处理缩略图条拖动开始
    const handleThumbnailBarMouseDown = useCallback((e: React.MouseEvent) => {
        if (!thumbnailBarRef.current) return;
        isDraggingRef.current = 'thumbnail';
        isClickRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartScrollLeftRef.current = thumbnailBarRef.current.scrollLeft;
        thumbnailBarRef.current.style.cursor = 'grabbing';
        e.preventDefault();
    }, []);

    // 添加全局鼠标事件监听
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            const deltaX = e.clientX - dragStartXRef.current;

            if (Math.abs(deltaX) > 5) {
                isClickRef.current = false;
            }

            if (isDraggingRef.current === 'marker' && markerBarRef.current) {
                markerBarRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
                // 同步到缩略图条
                if (thumbnailBarRef.current) {
                    const markerScrollLeft = markerBarRef.current.scrollLeft;
                    const markerScrollWidth = markerBarRef.current.scrollWidth;
                    const markerClientWidth = markerBarRef.current.clientWidth;
                    const thumbnailScrollWidth = thumbnailBarRef.current.scrollWidth;
                    const thumbnailClientWidth = thumbnailBarRef.current.clientWidth;

                    if (markerScrollWidth > markerClientWidth && thumbnailScrollWidth > thumbnailClientWidth) {
                        const scrollRatio = markerScrollLeft / (markerScrollWidth - markerClientWidth);
                        thumbnailBarRef.current.scrollLeft = scrollRatio * (thumbnailScrollWidth - thumbnailClientWidth);
                    }
                }
            } else if (isDraggingRef.current === 'thumbnail' && thumbnailBarRef.current) {
                thumbnailBarRef.current.scrollLeft = dragStartScrollLeftRef.current - deltaX;
                // 同步到标记条
                if (markerBarRef.current) {
                    const thumbnailScrollLeft = thumbnailBarRef.current.scrollLeft;
                    const thumbnailScrollWidth = thumbnailBarRef.current.scrollWidth;
                    const thumbnailClientWidth = thumbnailBarRef.current.clientWidth;
                    const markerScrollWidth = markerBarRef.current.scrollWidth;
                    const markerClientWidth = markerBarRef.current.clientWidth;

                    if (thumbnailScrollWidth > thumbnailClientWidth && markerScrollWidth > markerClientWidth) {
                        const scrollRatio = thumbnailScrollLeft / (thumbnailScrollWidth - thumbnailClientWidth);
                        markerBarRef.current.scrollLeft = scrollRatio * (markerScrollWidth - markerClientWidth);
                    }
                }
            }
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current === 'marker' && markerBarRef.current) {
                markerBarRef.current.style.cursor = 'grab';
            }
            if (isDraggingRef.current === 'thumbnail' && thumbnailBarRef.current) {
                thumbnailBarRef.current.style.cursor = 'grab';
            }
            isDraggingRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // 处理标记条点击
    const handleMarkerBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isClickRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / rect.width;
        const frameIndex = Math.floor(progress * totalFrames);
        const targetFrame = Math.max(0, Math.min(frameIndex, totalFrames - 1));

        // 跳转到该帧（标记功能已改为右键菜单）
        setCurrentFrameIndex(targetFrame);
        scrollToFrame(targetFrame);
    };

    // 处理缩略图右键菜单
    const handleThumbnailContextMenu = (e: React.MouseEvent, frameIndex: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, frameIndex });
    };

    // 标记开始帧
    const markStart = (frameIndex: number) => {
        setMarkers(prev => {
            // 移除旧的开始标记
            const filtered = prev.filter(m => m.type !== 'start');
            // 添加新的开始标记
            const newMarker: MarkerPoint = {
                frameIndex,
                time: frameIndex / framesPerSecond,
                type: 'start'
            };
            return [...filtered, newMarker].sort((a, b) => a.frameIndex - b.frameIndex);
        });
        setContextMenu(null);
        setCurrentFrameIndex(frameIndex);
    };

    // 标记结束帧
    const markEnd = (frameIndex: number) => {
        setMarkers(prev => {
            // 移除旧的结束标记
            const filtered = prev.filter(m => m.type !== 'end');
            // 添加新的结束标记
            const newMarker: MarkerPoint = {
                frameIndex,
                time: frameIndex / framesPerSecond,
                type: 'end'
            };
            return [...filtered, newMarker].sort((a, b) => a.frameIndex - b.frameIndex);
        });
        setContextMenu(null);
        setCurrentFrameIndex(frameIndex);
    };

    // 清除标记
    const clearMarkers = () => {
        setMarkers([]);
        setContextMenu(null);
    };

    // 获取开始和结束帧
    const getStartEndFrames = () => {
        const startMarker = markers.find(m => m.type === 'start');
        const endMarker = markers.find(m => m.type === 'end');
        return { startMarker, endMarker };
    };

    // 关闭右键菜单
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null);
        };
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);

    // toggleMarker 函数已废弃，标记功能改为右键菜单
    // 保留此函数以防其他地方调用，但不执行任何操作
    const toggleMarker = () => {
        // 标记功能已改为右键菜单，此函数不再使用
        console.warn('toggleMarker 已废弃，请使用右键菜单标记开始/结束帧');
    };

    const handleProcessAI = async () => {
        const { startMarker, endMarker } = getStartEndFrames();
        
        if (!startMarker || !endMarker) {
            setError('请先标记开始帧和结束帧（右键点击缩略图）');
            return;
        }

        if (startMarker.frameIndex >= endMarker.frameIndex) {
            setError('开始帧必须小于结束帧');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // 截取开始到结束的帧数据
            const selectedFrames = recordedFrames.slice(startMarker.frameIndex, endMarker.frameIndex + 1);

            // 调用 AI 进行平滑处理和首尾衔接
            const guideData = await smoothActionFramesWithLoop(selectedFrames, bpm);
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
                        className="max-w-full max-h-full object-contain mirror"
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-white/40">开始帧: </span>
                                    <span className="text-green-400 font-black text-xl">
                                        {markers.find(m => m.type === 'start')?.frameIndex ?? '未设置'}
                                    </span>
                                </div>
                            </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                    <span className="text-white/40">结束帧: </span>
                                    <span className="text-red-400 font-black text-xl">
                                        {markers.find(m => m.type === 'end')?.frameIndex ?? '未设置'}
                                    </span>
                                </div>
                            </div>
                            {(() => {
                                const { startMarker, endMarker } = getStartEndFrames();
                                if (startMarker && endMarker) {
                                    const frameCount = endMarker.frameIndex - startMarker.frameIndex + 1;
                                    const duration = (frameCount / framesPerSecond).toFixed(2);
                                    return (
                                        <div className="text-xs text-teal-400 bg-teal-500/10 p-2 rounded">
                                            标记范围: {frameCount} 帧 ({duration}秒) - 点击播放按钮预览
                                        </div>
                                    );
                                }
                                return (
                                    <div className="text-xs text-white/50">
                                        提示：在缩略图上右键可以标记开始或结束帧
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">标记信息</h3>
                        <div className="space-y-2">
                            {markers.map((marker) => (
                                <div
                                    key={`${marker.type}-${marker.frameIndex}`}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                        marker.frameIndex === currentFrameIndex
                                            ? marker.type === 'start'
                                                ? 'bg-green-500/20 border border-green-500/50'
                                                : 'bg-red-500/20 border border-red-500/50'
                                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                                    }`}
                                    onClick={() => setCurrentFrameIndex(marker.frameIndex)}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                                        marker.type === 'start' ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                        {marker.type === 'start' ? <PlayCircle className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold">
                                            {marker.type === 'start' ? '开始帧' : '结束帧'}
                                        </div>
                                        <div className="text-xs text-white/50">帧 {marker.frameIndex}</div>
                                    </div>
                                    <div className="text-xs text-white/50 font-mono">
                                        {formatTime(marker.time)}
                                    </div>
                                </div>
                            ))}
                            {markers.length === 0 && (
                                <div className="text-center text-white/40 text-sm py-8">
                                    暂无标记，右键点击缩略图进行标记
                                </div>
                            )}
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
                        onClick={() => {
                            const { startMarker, endMarker } = getStartEndFrames();
                            if (startMarker && endMarker && !isPlaying) {
                                // 如果有标记，跳转到开始帧
                                setCurrentFrameIndex(startMarker.frameIndex);
                            }
                            setIsPlaying(!isPlaying);
                        }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'
                        }`}
                        title={(() => {
                            const { startMarker, endMarker } = getStartEndFrames();
                            if (startMarker && endMarker) {
                                return `预览标记范围 (${startMarker.frameIndex}-${endMarker.frameIndex})`;
                            }
                            return '播放全部帧';
                        })()}
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

                <div className="space-y-2">
                    {/* 标记条 */}
                    <div className="relative">
                        <div
                            ref={markerBarRef}
                            className="h-8 bg-white/5 rounded-lg overflow-x-auto overflow-y-hidden cursor-grab select-none relative"
                            onMouseDown={handleMarkerBarMouseDown}
                            onScroll={handleMarkerBarScroll}
                            style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
                        >
                            <div
                                className="relative h-full min-w-full"
                                onClick={handleMarkerBarClick}
                            >
                                {/* 可见窗口指示器 */}
                                {visibleWindow.width > 0 && (
                                    <div
                                        className="absolute top-0 bottom-0 bg-teal-500/20 z-5 pointer-events-none border-l-2 border-r-2 border-teal-500/50"
                                        style={{
                                            left: `${visibleWindow.left}%`,
                                            width: `${visibleWindow.width}%`
                                        }}
                                    />
                                )}
                                {/* 标记点 */}
                            {markers.map(marker => (
                                    <div
                                        key={`${marker.type}-${marker.frameIndex}`}
                                        className={`absolute top-0 bottom-0 w-1 z-10 ${
                                            marker.type === 'start' ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{ left: `${(marker.frameIndex / totalFrames) * 100}%` }}
                                    />
                                ))}
                                {/* 当前帧指示器 */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-20"
                                    style={{ left: `${(currentFrameIndex / totalFrames) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 缩略图时间轴 */}
                    <div className="relative">
                        <div
                            ref={thumbnailBarRef}
                            className="flex gap-1 overflow-x-auto overflow-y-hidden pb-2 cursor-grab select-none"
                            onMouseDown={handleThumbnailBarMouseDown}
                            onScroll={handleThumbnailBarScroll}
                            style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
                        >
                            {thumbnails.length > 0 ? (
                                thumbnails.map((thumb, index) => {
                                    const step = Math.max(1, Math.floor(totalFrames / thumbnails.length));
                                    const frameIndex = Math.min(index * step, totalFrames - 1);
                                    const startMarker = markers.find(m => m.type === 'start' && m.frameIndex >= frameIndex && m.frameIndex < frameIndex + step);
                                    const endMarker = markers.find(m => m.type === 'end' && m.frameIndex >= frameIndex && m.frameIndex < frameIndex + step);
                                    const isCurrent = currentFrameIndex >= frameIndex && currentFrameIndex < frameIndex + step;
                                    
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                if (!isClickRef.current) return;
                                                setCurrentFrameIndex(frameIndex);
                                                scrollToFrame(frameIndex);
                                            }}
                                            onContextMenu={(e) => handleThumbnailContextMenu(e, frameIndex)}
                                            onMouseDown={() => {
                                                if (!isDraggingRef.current) {
                                                    isClickRef.current = true;
                                                }
                                            }}
                                            className={`relative flex-shrink-0 rounded overflow-hidden border-2 transition-all cursor-pointer ${
                                                isCurrent 
                                                    ? 'border-teal-400 scale-110' 
                                                    : startMarker
                                                        ? 'border-green-500' 
                                                        : endMarker
                                                            ? 'border-red-500'
                                                            : 'border-white/10'
                                            }`}
                                            style={{ width: '80px', height: '60px' }}
                                        >
                                            <img
                                                src={thumb}
                                                alt={`Frame ${frameIndex}`}
                                                className="w-full h-full object-contain"
                                            />
                                            {startMarker && (
                                                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                                    <PlayCircle className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                            {endMarker && (
                                                <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                                    <Square className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex-1 h-16 bg-white/5 rounded-lg flex items-center justify-center text-white/40 text-sm">
                                    正在生成缩略图...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 时间显示 */}
                    <div className="flex items-center justify-between text-sm text-white/60">
                        <span className="font-mono">{formatTime(currentFrameIndex / framesPerSecond)}</span>
                    <span className="font-mono">{formatTime(totalFrames / framesPerSecond)}</span>
                    </div>
                </div>
            </div>

            {/* 右键菜单 */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-slate-800 border border-white/20 rounded-lg shadow-2xl py-2 min-w-[150px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => markStart(contextMenu.frameIndex)}
                        className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-sm transition-colors"
                    >
                        <PlayCircle className="w-4 h-4 text-green-400" />
                        <span>标记为开始帧</span>
                    </button>
                    <button
                        onClick={() => markEnd(contextMenu.frameIndex)}
                        className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-sm transition-colors"
                    >
                        <Square className="w-4 h-4 text-red-400" />
                        <span>标记为结束帧</span>
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button
                        onClick={clearMarkers}
                        className="w-full px-4 py-2 text-left hover:bg-white/10 text-sm text-white/60 transition-colors"
                    >
                        清除所有标记
                    </button>
                </div>
            )}

            <style>{`.mirror { transform: scaleX(-1); }`}</style>
        </div>
    );
};

export default ActionMarkerEditor;
