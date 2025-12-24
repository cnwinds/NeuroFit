
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPlan, PlayerState } from '../types';
import { generateStickFigureAnimation } from '../services/geminiService';
import { decodeAudioData, playTone, playSuccessSound, playCountdownBeep, playDrumStepCached, pregenerateDrumBuffers } from '../services/audioUtils';
import { convertLegacyPattern, type DrumStep, getAudioEngine } from '../beats';
import { Play, Pause, SkipForward, CheckCircle, Star, Loader2, Camera, X, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { getAction, ActionComponent } from '../actions';
import { ActionScore } from '../actions/base/types';
import { calculateScore } from '../services/scoreCalculator';
import { CompletionEffect } from './CompletionEffect';

interface Props {
  plan: WorkoutPlan;
  onExit: () => void;
}

interface ScoreParticle {
  id: number;
  x: number;
  y: number;
  value: string;
}

const Player: React.FC<Props> = ({ plan, onExit }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(plan.exercises[0].durationSeconds);
  const [state, setState] = useState<PlayerState>(PlayerState.PREPARING);
  const [audioEnabled] = useState(true);
  
  const [countdownValue, setCountdownValue] = useState(3);
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [beatStep, setBeatStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [floatingScores, setFloatingScores] = useState<ScoreParticle[]>([]);
  const [currentScore, setCurrentScore] = useState<ActionScore | null>(null);
  const [actionAccuracy, setActionAccuracy] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const [cameraReady, setCameraReady] = useState(false);

  // 动作系统相关
  const currentActionRef = useRef<ActionComponent | null>(null);
  const previousLandmarksRef = useRef<any[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  
  // 性能优化：帧跳跃和时间节流
  const frameSkipCounter = useRef<number>(0);
  const lastDetectionTime = useRef<number>(0);
  const detectionInterval = 150; // 每150ms检测一次（约6-7fps）
  const frameSkip = 2; // 每2帧检测一次
  
  // 性能监控
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    detectionTime: 0,
    maxDetectionTime: 0,
    drawTime: 0,
    maxDrawTime: 0,
    audioTime: 0,
    maxAudioTime: 0,
    fps: 0
  });
  const performanceData = useRef<{
    detectionTime: number[];
    drawTime: number[];
    audioTime: number[];
    fps: number[];
  }>({
    detectionTime: [],
    drawTime: [],
    audioTime: [],
    fps: []
  });
  const lastFrameTime = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  const updateStatsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = plan.exercises[currentExerciseIndex];

  // 获取当前动作组件
  useEffect(() => {
    // 尝试从动作名称中提取英文名称
    // 例如: "跳跃 (Jump)" -> "JUMP", "开合跳 (Jumping Jacks)" -> "JUMP"
    const exerciseName = currentExercise.name;
    let actionName = '';
    
    // 尝试匹配括号中的英文名称
    const match = exerciseName.match(/\(([^)]+)\)/);
    if (match) {
      actionName = match[1].toUpperCase().split(' ')[0]; // 取第一个单词
    } else {
      // 如果没有括号，尝试直接匹配常见动作名称
      if (exerciseName.includes('跳') || exerciseName.includes('Jump')) {
        actionName = 'JUMP';
      } else if (exerciseName.includes('拍') || exerciseName.includes('Clap')) {
        actionName = 'CLAP';
      } else {
        // 默认尝试使用整个名称
        actionName = exerciseName.toUpperCase().split(' ')[0];
      }
    }
    
    const action = getAction(actionName);
    if (action) {
      currentActionRef.current = action;
      // 重置检测器
      action.Detector.reset();
      previousLandmarksRef.current = [];
    } else {
      currentActionRef.current = null;
    }
  }, [currentExerciseIndex, currentExercise.name]);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    // 优化：使用较低的采样率以减少CPU负担，同时保持音质
    audioContextRef.current = new AudioContextClass({ 
      sampleRate: 24000,
      latencyHint: 'interactive' // 优化音频延迟
    });
    
    // 预生成所有鼓点音频缓冲区（避免实时生成导致的延迟）
    if (audioContextRef.current) {
      pregenerateDrumBuffers(audioContextRef.current).catch(console.error);
    }
    
    return () => { audioContextRef.current?.close(); };
  }, []);

  useEffect(() => {
    const initMediaPipeAndCamera = async () => {
        try {
            const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
            poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1
            });

            // 降低视频分辨率以减少CPU负担
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: 'user', 
                width: { ideal: 320, max: 480 }, 
                height: { ideal: 240, max: 360 } 
              },
              audio: false 
            });
            streamRef.current = stream;
            setCameraReady(true);
        } catch (error) {
            console.error(error);
            alert("请授予摄像头权限以进行 AI 动作识别。");
        }
    };
    initMediaPipeAndCamera();
    
    return () => {
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
        if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if(updateStatsTimeoutRef.current) clearTimeout(updateStatsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const prepareExercise = async () => {
      setState(PlayerState.PREPARING);
      setTimeLeft(currentExercise.durationSeconds);
      setFrames([]);
      setCurrentFrameIndex(0);
      setCurrentScore(null);
      setActionAccuracy(0);

      // 如果有动作组件，使用动作组件的引导动画
      if (currentActionRef.current) {
        // 动作组件的Guide会在准备好后调用onReady
        setState(PlayerState.INSTRUCTION);
      } else {
        // 回退到原有的动画生成方式
        const generatedFrames = await generateStickFigureAnimation(currentExercise.name, !!plan.isDemo);
        if (isMounted) {
          if (generatedFrames.length > 0) setFrames(generatedFrames);
          setState(PlayerState.INSTRUCTION);
        }
      }
    };
    prepareExercise();
    return () => { isMounted = false; };
  }, [currentExerciseIndex, plan.exercises, plan.isDemo]);

  useEffect(() => {
      if (state === PlayerState.INSTRUCTION && frames.length > 1) {
          animationIntervalRef.current = setInterval(() => {
              setCurrentFrameIndex(prev => (prev + 1) % frames.length);
          }, 800);
      }
      return () => { if (animationIntervalRef.current) clearInterval(animationIntervalRef.current); }
  }, [state, frames]);

  useEffect(() => {
      if ((state === PlayerState.COUNTDOWN || state === PlayerState.PLAYING) && videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(console.error);
          if (poseLandmarkerRef.current) predictWebcam();
      }
  }, [state, cameraReady]);

  const predictWebcam = () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || video.videoWidth === 0) {
           requestRef.current = requestAnimationFrame(predictWebcam);
           return;
      }
      
      // 只在首次或尺寸变化时设置canvas尺寸
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }

      const now = performance.now();
      const timeSinceLastDetection = now - lastDetectionTime.current;
      
      // 性能优化：帧跳跃 + 时间节流
      frameSkipCounter.current++;
      const shouldDetect = 
          frameSkipCounter.current >= frameSkip && 
          timeSinceLastDetection >= detectionInterval &&
          lastVideoTimeRef.current !== video.currentTime;

      if (shouldDetect) {
          frameSkipCounter.current = 0;
          lastDetectionTime.current = now;
          lastVideoTimeRef.current = video.currentTime;
          
          // 性能监控：记录检测开始时间
          const detectionStartTime = performance.now();
          
          // 使用 requestIdleCallback 如果可用，否则使用 setTimeout 来避免阻塞音频线程
          const detectionCallback = (result: any) => {
              // 性能监控：记录检测耗时（从调用detectForVideo到回调执行）
              const detectionEndTime = performance.now();
              const detectionDuration = detectionEndTime - detectionStartTime;
              
              // 使用 requestAnimationFrame 来确保绘制不阻塞音频
              requestAnimationFrame(() => {
                  const drawStartTime = performance.now();
                  
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  if (result.landmarks && result.landmarks.length > 0) {
                      const landmarks = result.landmarks[0];
                      drawStickFigure(ctx, landmarks, canvas.width, canvas.height);
                      
                      // 使用动作组件的检测器
                      if (currentActionRef.current && state === PlayerState.PLAYING) {
                          const detectionResult = currentActionRef.current.Detector.detect(
                              landmarks,
                              previousLandmarksRef.current
                          );
                          
                          // 更新准确度
                          setActionAccuracy(detectionResult.accuracy);
                          
                          // 如果动作完成，触发评分
                          if (detectionResult.isCompleted) {
                              handleActionComplete(detectionResult.accuracy);
                          }
                          
                          previousLandmarksRef.current = landmarks;
                      }
                  }
                  
                  // 性能监控：记录绘制耗时
                  const drawEndTime = performance.now();
                  const drawDuration = drawEndTime - drawStartTime;
                  
                  // 更新性能数据（保留最近30次记录）
                  if (performanceData.current.detectionTime.length >= 30) {
                      performanceData.current.detectionTime.shift();
                      performanceData.current.drawTime.shift();
                  }
                  performanceData.current.detectionTime.push(detectionDuration);
                  performanceData.current.drawTime.push(drawDuration);
                  
                  // 更新性能统计（节流更新，每200ms更新一次UI）
                  if (showPerformance && !updateStatsTimeoutRef.current) {
                      updateStatsTimeoutRef.current = setTimeout(() => {
                          const detection = performanceData.current.detectionTime;
                          const draw = performanceData.current.drawTime;
                          const audio = performanceData.current.audioTime;
                          const fps = performanceData.current.fps;
                          
                          setPerformanceStats({
                              detectionTime: detection.length > 0 ? detection.reduce((a, b) => a + b, 0) / detection.length : 0,
                              maxDetectionTime: detection.length > 0 ? Math.max(...detection) : 0,
                              drawTime: draw.length > 0 ? draw.reduce((a, b) => a + b, 0) / draw.length : 0,
                              maxDrawTime: draw.length > 0 ? Math.max(...draw) : 0,
                              audioTime: audio.length > 0 ? audio.reduce((a, b) => a + b, 0) / audio.length : 0,
                              maxAudioTime: audio.length > 0 ? Math.max(...audio) : 0,
                              fps: fps.length > 0 ? fps.reduce((a, b) => a + b, 0) / fps.length : 0
                          });
                          updateStatsTimeoutRef.current = null;
                      }, 200);
                  }
              });
          };
          
          poseLandmarkerRef.current.detectForVideo(video, now, detectionCallback);
      } else {
          // 即使不检测，也继续动画循环以保持流畅
          if (lastVideoTimeRef.current !== video.currentTime) {
              lastVideoTimeRef.current = video.currentTime;
          }
      }
      
      // 性能监控：计算FPS
      frameCount.current++;
      const currentFrameTime = performance.now();
      const timeSinceLastFrame = currentFrameTime - lastFrameTime.current;
      if (timeSinceLastFrame >= 1000) { // 每秒更新一次FPS
          const fps = Math.round((frameCount.current * 1000) / timeSinceLastFrame);
          if (performanceData.current.fps.length >= 30) {
              performanceData.current.fps.shift();
          }
          performanceData.current.fps.push(fps);
          frameCount.current = 0;
          lastFrameTime.current = currentFrameTime;
          
          // 更新性能统计（节流更新）
          if (showPerformance && !updateStatsTimeoutRef.current) {
              updateStatsTimeoutRef.current = setTimeout(() => {
                  const detection = performanceData.current.detectionTime;
                  const draw = performanceData.current.drawTime;
                  const audio = performanceData.current.audioTime;
                  const fps = performanceData.current.fps;
                  
                  setPerformanceStats({
                      detectionTime: detection.length > 0 ? detection.reduce((a, b) => a + b, 0) / detection.length : 0,
                      maxDetectionTime: detection.length > 0 ? Math.max(...detection) : 0,
                      drawTime: draw.length > 0 ? draw.reduce((a, b) => a + b, 0) / draw.length : 0,
                      maxDrawTime: draw.length > 0 ? Math.max(...draw) : 0,
                      audioTime: audio.length > 0 ? audio.reduce((a, b) => a + b, 0) / audio.length : 0,
                      maxAudioTime: audio.length > 0 ? Math.max(...audio) : 0,
                      fps: fps.length > 0 ? fps.reduce((a, b) => a + b, 0) / fps.length : 0
                  });
                  updateStatsTimeoutRef.current = null;
              }, 200);
          }
      }
      
      requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const drawStickFigure = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
      // 优化：减少 save/restore 调用，批量绘制
      ctx.save();
      
      // 优化：预先计算坐标，减少重复计算
      const drawLine = (start: any, end: any, color: string, width: number, blur: number = 0) => {
        if(start && end) {
            ctx.beginPath();
            ctx.moveTo(start.x * w, start.y * h);
            ctx.lineTo(end.x * w, end.y * h);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            if (blur > 0) {
                ctx.shadowBlur = blur;
                ctx.shadowColor = color;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.lineCap = "round";
            ctx.stroke();
        }
      }
      
      // 优化：减少函数调用开销，直接绘制
      const connect = (idx1: number, idx2: number) => {
          const s = landmarks[idx1], e = landmarks[idx2];
          if (s && e) {
              // 合并绘制：先绘制阴影，再绘制主线条
              ctx.beginPath();
              ctx.moveTo(s.x * w, s.y * h);
              ctx.lineTo(e.x * w, e.y * h);
              
              // 阴影层
              ctx.strokeStyle = "#2dd4bf";
              ctx.lineWidth = 10;
              ctx.shadowBlur = 20;
              ctx.shadowColor = "#2dd4bf";
              ctx.stroke();
              
              // 主线条
              ctx.beginPath();
              ctx.moveTo(s.x * w, s.y * h);
              ctx.lineTo(e.x * w, e.y * h);
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 3;
              ctx.shadowBlur = 0;
              ctx.stroke();
          }
      };
      
      connect(11, 12); connect(11, 23); connect(12, 24); connect(23, 24);
      connect(11, 13); connect(13, 15); connect(12, 14); connect(14, 16);
      connect(23, 25); connect(25, 27); connect(24, 26); connect(26, 28);
      
      if(landmarks[0]) {
        ctx.beginPath();
        ctx.arc(landmarks[0].x * w, landmarks[0].y * h, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 25;
        ctx.fill();
      }
      ctx.restore();
  };

  const handleActionComplete = useCallback((accuracy: number) => {
      if (!audioContextRef.current || state !== PlayerState.PLAYING) return;
      
      // 计算节拍偏差
      const now = Date.now();
      const timingOffset = lastBeatTimeRef.current > 0 ? Math.abs(now - lastBeatTimeRef.current) : 0;
      
      // 计算评分
      const score = calculateScore(accuracy, timingOffset, beatStep);
      setCurrentScore(score);
      
      // 显示浮动分数
      const id = Date.now();
      const x = 20 + Math.random() * 60; 
      const y = 30 + Math.random() * 20;
      const scoreText = score === ActionScore.EXCELLENT ? 'EXCELLENT!' : 
                       score === ActionScore.GOOD ? 'GOOD!' :
                       score === ActionScore.BAD ? 'BAD' : 'MISS';
      setFloatingScores(prev => [...prev, { id, x, y, value: scoreText }]);
      setTimeout(() => setFloatingScores(prev => prev.filter(p => p.id !== id)), 1000);
      
      // 根据评分增加XP
      const xpGain = score === ActionScore.EXCELLENT ? 10 : 
                     score === ActionScore.GOOD ? 5 :
                     score === ActionScore.BAD ? 2 : 1;
      setXp(prev => prev + xpGain);
      
      // 暂停播放，显示完成效果
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      setState(PlayerState.CELEBRATION);
  }, [state, beatStep]);

  const startCountdown = async () => {
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
      setState(PlayerState.COUNTDOWN);
      setCountdownValue(3);
  };

  useEffect(() => {
    if (state === PlayerState.COUNTDOWN) {
        if (audioContextRef.current) playCountdownBeep(audioContextRef.current, countdownValue === 0);
        if (countdownValue > 0) {
            const id = setTimeout(() => setCountdownValue(v => v - 1), 1000);
            return () => clearTimeout(id);
        } else { setState(PlayerState.PLAYING); }
    }
  }, [state, countdownValue]);

  const handleExerciseComplete = useCallback(() => {
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (audioContextRef.current) playSuccessSound(audioContextRef.current);
      setXp(v => v + 50);
      setState(PlayerState.CELEBRATION);
      setTimeout(() => {
          if (currentExerciseIndex < plan.exercises.length - 1) {
            setCurrentExerciseIndex(v => v + 1);
            setState(PlayerState.INSTRUCTION);
          } else { setState(PlayerState.COMPLETED); }
      }, 3000);
  }, [currentExerciseIndex, plan.exercises]);

  const handleCompletionEffectComplete = useCallback(() => {
      setCurrentScore(null);
      if (currentExerciseIndex < plan.exercises.length - 1) {
        setCurrentExerciseIndex(v => v + 1);
        setState(PlayerState.INSTRUCTION);
      } else {
        setState(PlayerState.COMPLETED);
      }
  }, [currentExerciseIndex, plan.exercises]);

  // Added skipExercise fix: This function clears existing timers and moves to the next exercise or completion state.
  const skipExercise = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setCurrentExerciseIndex(v => v + 1);
      setState(PlayerState.INSTRUCTION);
    } else {
      setState(PlayerState.COMPLETED);
    }
  };

  useEffect(() => {
    if (state === PlayerState.PLAYING) {
        timerRef.current = setInterval(() => {
            setTimeLeft(v => {
                if (v <= 1) { clearInterval(timerRef.current!); return 0; }
                return v - 1;
            });
        }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]); 

  useEffect(() => { if (state === PlayerState.PLAYING && timeLeft === 0) handleExerciseComplete(); }, [timeLeft, state, handleExerciseComplete]);

  useEffect(() => {
      if (state === PlayerState.PLAYING) {
          // 优化：确保音频上下文已恢复
          if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume().catch(console.error);
          }
          
          // 使用动作组件的节拍配置，如果没有则使用默认值
          const beatPattern = currentActionRef.current?.Beat || {
              bpm: 120,
              pattern: [0, 1, 2, 3],
              audioConfig: { steps: [] }
          };
          
          // 处理新旧格式：如果是 number[]，转换为 DrumStep[]
          const patternSteps: (number | DrumStep)[] = beatPattern.pattern;
          const patternLength = patternSteps.length;
          
          // 计算节拍间隔（基于BPM）
          const beatIntervalMs = (60 / beatPattern.bpm) * 1000 / patternLength;
          
          beatIntervalRef.current = setInterval(() => {
             setBeatStep(v => {
                 const next = (v + 1) % patternLength;
                 
                 // 记录节拍时间（用于计算节拍偏差）
                 lastBeatTimeRef.current = Date.now();
                 
                 // 先更新状态，确保UI和声音同步
                 // 使用 requestAnimationFrame 确保在下一帧渲染前更新
                 requestAnimationFrame(() => {
                     // 播放音频（与UI同步）
                     if (audioContextRef.current && audioContextRef.current.state === 'running') {
                         // 性能监控：记录音频播放时间
                         const audioStartTime = performance.now();
                         
                         // 使用缓存的音频缓冲区播放（零延迟，高性能）
                         // 支持 number（旧格式）、DrumStep（新格式）和 DrumStep[]（多乐器）
                         const step = patternSteps[next];
                         if (Array.isArray(step)) {
                             // 新格式：数组，支持多个乐器同时播放
                             const engine = getAudioEngine();
                             step.forEach(drumStep => {
                                 if (drumStep && typeof drumStep === 'object' && drumStep.volume > 0) {
                                     engine.playDrumStep(drumStep);
                                 }
                             });
                         } else if (typeof step === 'number') {
                             // 旧格式：直接传递 number
                             playDrumStepCached(audioContextRef.current, step);
                         } else if (step && typeof step === 'object') {
                             // 单个 DrumStep 对象
                             if (step.volume > 0) {
                                 // 对于单个 DrumStep，使用类型映射（向后兼容）
                                 const legacyStep = step.type === 'kick' ? 0 :
                                                   step.type === 'hihat' ? 1 :
                                                   step.type === 'snare' ? 2 : 1;
                                 playDrumStepCached(audioContextRef.current, legacyStep);
                             }
                         }
                         
                         // 性能监控：记录音频播放耗时
                         const audioEndTime = performance.now();
                         const audioDuration = audioEndTime - audioStartTime;
                         
                         if (performanceData.current.audioTime.length >= 30) {
                             performanceData.current.audioTime.shift();
                         }
                         performanceData.current.audioTime.push(audioDuration);
                         
                         // 更新性能统计（节流更新）
                         if (showPerformance && !updateStatsTimeoutRef.current) {
                             updateStatsTimeoutRef.current = setTimeout(() => {
                                 const detection = performanceData.current.detectionTime;
                                 const draw = performanceData.current.drawTime;
                                 const audio = performanceData.current.audioTime;
                                 const fps = performanceData.current.fps;
                                 
                                 setPerformanceStats({
                                     detectionTime: detection.length > 0 ? detection.reduce((a: number, b: number) => a + b, 0) / detection.length : 0,
                                     maxDetectionTime: detection.length > 0 ? Math.max(...detection) : 0,
                                     drawTime: draw.length > 0 ? draw.reduce((a: number, b: number) => a + b, 0) / draw.length : 0,
                                     maxDrawTime: draw.length > 0 ? Math.max(...draw) : 0,
                                     audioTime: audio.length > 0 ? audio.reduce((a: number, b: number) => a + b, 0) / audio.length : 0,
                                     maxAudioTime: audio.length > 0 ? Math.max(...audio) : 0,
                                     fps: fps.length > 0 ? fps.reduce((a: number, b: number) => a + b, 0) / fps.length : 0
                                 });
                                 updateStatsTimeoutRef.current = null;
                             }, 200);
                         }
                     }
                 });
                 
                 return next;
             });
          }, beatIntervalMs);
      }
      return () => { if (beatIntervalRef.current) clearInterval(beatIntervalRef.current); };
  }, [state, showPerformance]);

  const togglePause = () => {
    if (state === PlayerState.PLAYING) setState(PlayerState.PAUSED);
    else if (state === PlayerState.PAUSED) setState(PlayerState.PLAYING);
    else if (state === PlayerState.INSTRUCTION) startCountdown();
  };

  const progress = ((currentExercise.durationSeconds - timeLeft) / currentExercise.durationSeconds) * 100;

  // 使用状态中的性能数据
  const avgDetectionTime = performanceStats.detectionTime;
  const maxDetectionTime = performanceStats.maxDetectionTime;
  const avgDrawTime = performanceStats.drawTime;
  const maxDrawTime = performanceStats.maxDrawTime;
  const avgAudioTime = performanceStats.audioTime;
  const maxAudioTime = performanceStats.maxAudioTime;
  const avgFps = performanceStats.fps;
  
  // 根据性能数据判断是否有问题
  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value > threshold * 1.5) return 'text-red-400';
    if (value > threshold) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getPerformanceBg = (value: number, threshold: number): string => {
    if (value > threshold * 1.5) return 'bg-red-500/20';
    if (value > threshold) return 'bg-yellow-500/20';
    return 'bg-green-500/20';
  };

  if (state === PlayerState.COMPLETED) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in bg-black">
        <CheckCircle className="w-20 h-20 text-teal-400 mb-6" />
        <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-widest">训练达成</h2>
        <div className="text-2xl font-bold text-yellow-400 mb-8">+{xp} XP</div>
        <button onClick={onExit} className="bg-white text-black font-black py-4 px-10 rounded-full text-sm uppercase">返回主页</button>
      </div>
    );
  }

  if (state === PlayerState.INSTRUCTION || state === PlayerState.PREPARING) {
     return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto no-scrollbar">
           <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full max-w-sm">
             <div className="space-y-2">
                 <p className="text-yellow-400 font-bold tracking-widest uppercase text-xs animate-pulse">下一项</p>
                 <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">{currentExercise.name}</h1>
             </div>
             
             <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
                 {currentActionRef.current ? (() => {
                    const GuideComponent = currentActionRef.current!.Guide;
                    return <GuideComponent onReady={() => {}} />;
                 })() : frames.length > 0 ? (
                    <img src={frames[currentFrameIndex]} className="w-full h-full object-contain p-4" alt="guide" />
                 ) : <Loader2 className="w-10 h-10 animate-spin text-teal-500" />}
                 
                 <div className="absolute top-3 right-3">
                     {cameraReady ? (
                         <div className="bg-green-500/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                             <Camera className="w-2 h-2" /> CAM ACTIVE
                         </div>
                     ) : (
                         <div className="bg-red-500/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                             <Loader2 className="w-2 h-2 animate-spin" /> CAM INIT
                         </div>
                     )}
                 </div>
             </div>

             <div className="bg-white/5 p-4 rounded-2xl border border-white/10 w-full">
                 <p className="text-sm text-white/80 leading-relaxed mb-2">{currentExercise.description}</p>
                 <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">{currentExercise.scientificBenefit}</p>
             </div>
           </div>
           
           <button 
              onClick={startCountdown} 
              disabled={!cameraReady && frames.length === 0}
              className="mt-8 mb-6 bg-teal-500 disabled:bg-slate-700 active:scale-95 text-black px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-teal-500/30 w-full max-w-sm"
            >
              开始准备
           </button>
        </div>
     )
  }

  if (state === PlayerState.COUNTDOWN) {
      return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
            <span className="text-9xl md:text-[15rem] font-black text-white tracking-tighter leading-none animate-ping-short z-10">
                {countdownValue === 0 ? "GO" : countdownValue}
            </span>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden select-none">
      <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
         <div className={`absolute inset-0 transition-opacity duration-150 ${beatStep === 0 ? 'bg-teal-500/20' : beatStep === 2 ? 'bg-blue-500/20' : 'bg-transparent'}`}></div>
      </div>
      
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
           <canvas ref={canvasRef} className="w-full h-full object-contain mirror drop-shadow-[0_0_20px_rgba(45,212,191,0.5)]"></canvas>
      </div>

      <div className="absolute inset-0 z-20 pointer-events-none">
          {floatingScores.map(score => (
              <div key={score.id} className="absolute text-3xl font-black text-yellow-400 score-float italic" style={{ left: `${score.x}%`, top: `${score.y}%` }}>{score.value}</div>
          ))}
      </div>

      <div className="absolute top-12 left-0 right-0 z-30 flex justify-center px-6 pointer-events-none">
          <h1 className={`text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter text-center transition-transform duration-150 ${beatStep === 0 ? 'scale-110' : 'scale-100'}`} style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}>
              {currentExercise.name}
          </h1>
      </div>

      <div className="absolute top-4 right-4 z-40">
         <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
             <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
             <span className="text-white text-sm font-black italic">{xp} PTS</span>
         </div>
      </div>
      
      <button onClick={onExit} className="absolute top-4 left-4 z-40 text-white/60 active:text-white p-2 bg-black/20 rounded-full">
          <X className="w-5 h-5" />
      </button>

      {/* 性能监控面板 */}
      <div className="absolute top-4 left-16 z-40">
        <button 
          onClick={() => setShowPerformance(!showPerformance)}
          className="text-white/60 active:text-white p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-all"
          title="性能监控"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>

      {showPerformance && state === PlayerState.PLAYING && (
        <div className="absolute top-16 left-4 z-40 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20 p-4 min-w-[280px] shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" />
              性能监控
            </h3>
            <button 
              onClick={() => setShowPerformance(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3 text-xs">
            {/* FPS */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60">帧率 (FPS)</span>
                <span className={`font-bold ${getPerformanceColor(60 - avgFps, 10)}`}>
                  {avgFps > 0 ? Math.round(avgFps) : '--'} fps
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getPerformanceBg(60 - avgFps, 10)}`}
                  style={{ width: `${Math.min(100, (avgFps / 60) * 100)}%` }}
                />
              </div>
            </div>

            {/* 姿态检测时间 */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60">姿态检测</span>
                <span className={`font-bold ${getPerformanceColor(avgDetectionTime, 50)}`}>
                  {avgDetectionTime > 0 ? avgDetectionTime.toFixed(1) : '--'}ms
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>平均</span>
                <span>峰值: {maxDetectionTime > 0 ? maxDetectionTime.toFixed(1) : '--'}ms</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getPerformanceBg(avgDetectionTime, 50)}`}
                  style={{ width: `${Math.min(100, (avgDetectionTime / 150) * 100)}%` }}
                />
              </div>
            </div>

            {/* 绘制时间 */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60">Canvas绘制</span>
                <span className={`font-bold ${getPerformanceColor(avgDrawTime, 10)}`}>
                  {avgDrawTime > 0 ? avgDrawTime.toFixed(1) : '--'}ms
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>平均</span>
                <span>峰值: {maxDrawTime > 0 ? maxDrawTime.toFixed(1) : '--'}ms</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getPerformanceBg(avgDrawTime, 10)}`}
                  style={{ width: `${Math.min(100, (avgDrawTime / 30) * 100)}%` }}
                />
              </div>
            </div>

            {/* 音频处理时间 */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/60">音频处理</span>
                <span className={`font-bold ${getPerformanceColor(avgAudioTime, 5)}`}>
                  {avgAudioTime > 0 ? avgAudioTime.toFixed(2) : '--'}ms
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>平均</span>
                <span>峰值: {maxAudioTime > 0 ? maxAudioTime.toFixed(2) : '--'}ms</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${getPerformanceBg(avgAudioTime, 5)}`}
                  style={{ width: `${Math.min(100, (avgAudioTime / 15) * 100)}%` }}
                />
              </div>
            </div>

            {/* 总耗时 */}
            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60">总耗时/帧</span>
                <span className={`font-bold ${getPerformanceColor(avgDetectionTime + avgDrawTime, 60)}`}>
                  {(avgDetectionTime + avgDrawTime).toFixed(1)}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-20" onClick={togglePause}>
         {state === PlayerState.PAUSED && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <Play className="w-16 h-16 text-white fill-white" />
            </div>
         )}
      </div>
      
      {state === PlayerState.CELEBRATION && currentScore && (
          <CompletionEffect 
            score={currentScore}
            audioContext={audioContextRef.current}
            onComplete={handleCompletionEffectComplete}
          />
      )}

      {/* Mobile-optimized PIP Camera */}
      <div className="absolute bottom-36 right-4 z-40 w-24 md:w-40 aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
         <video ref={videoRef} className="w-full h-full object-cover mirror opacity-80" autoPlay playsInline muted></video>
         <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-10 flex flex-col gap-2 bg-gradient-to-t from-black via-black/80 to-transparent pt-16">
         <div className="flex justify-center items-end gap-2 mb-2">
            {['DONG', 'CI', 'DA', 'CI'].map((label, idx) => (
                <div 
                    key={idx} 
                    className={`h-8 flex items-center justify-center rounded-xl transition-all duration-150 ${
                        beatStep === idx 
                            ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white px-4 font-black text-sm shadow-lg shadow-teal-500/50 scale-110' 
                            : 'bg-white/5 text-white/30 px-3 text-xs'
                    }`}
                    style={{
                        transform: beatStep === idx ? 'translateY(-4px) scale(1.1)' : 'translateY(0) scale(1)',
                    }}
                >
                    {label}
                </div>
            ))}
         </div>

         <div className="text-center mb-2">
            <span className={`text-6xl font-black italic text-white tabular-nums transition-all ${beatStep === 0 ? 'text-yellow-400' : ''}`}>
                {timeLeft}
            </span>
         </div>

         <div className="flex items-center gap-3">
             <button onClick={togglePause} className="text-white p-2">
                {state === PlayerState.PLAYING ? <Pause className="fill-white w-6 h-6"/> : <Play className="fill-white w-6 h-6"/>}
             </button>
             <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
             </div>
             <button onClick={skipExercise} className="text-white/40 active:text-white p-2">
                <SkipForward className="w-6 h-6"/>
             </button>
         </div>
      </div>
      
      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
};

export default Player;
