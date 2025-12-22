
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPlan, PlayerState } from '../types';
import { generateStickFigureAnimation } from '../services/geminiService';
import { decodeAudioData, playTone, playSuccessSound, playCountdownBeep, playDrumStep } from '../services/audioUtils';
import { Play, Pause, SkipForward, CheckCircle, Star, Loader2, Camera, X } from 'lucide-react';
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const [cameraReady, setCameraReady] = useState(false);

  const isJumping = useRef<boolean>(false);
  const baselineY = useRef<number>(0);
  
  // 性能优化：帧跳跃和时间节流
  const frameSkipCounter = useRef<number>(0);
  const lastDetectionTime = useRef<number>(0);
  const detectionInterval = 150; // 每150ms检测一次（约6-7fps）
  const frameSkip = 2; // 每2帧检测一次

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = plan.exercises[currentExerciseIndex];

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    // 优化：使用较低的采样率以减少CPU负担，同时保持音质
    audioContextRef.current = new AudioContextClass({ 
      sampleRate: 24000,
      latencyHint: 'interactive' // 优化音频延迟
    });
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
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const prepareExercise = async () => {
      setState(PlayerState.PREPARING);
      setTimeLeft(currentExercise.durationSeconds);
      setFrames([]);
      setCurrentFrameIndex(0);

      const generatedFrames = await generateStickFigureAnimation(currentExercise.name, !!plan.isDemo);
      if (isMounted) {
        if (generatedFrames.length > 0) setFrames(generatedFrames);
        setState(PlayerState.INSTRUCTION);
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
          
          // 使用 requestIdleCallback 如果可用，否则使用 setTimeout 来避免阻塞音频线程
          const detectionCallback = (result: any) => {
              // 使用 requestAnimationFrame 来确保绘制不阻塞音频
              requestAnimationFrame(() => {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  if (result.landmarks && result.landmarks.length > 0) {
                      const landmarks = result.landmarks[0];
                      drawStickFigure(ctx, landmarks, canvas.width, canvas.height);
                      const hipY = (landmarks[23].y + landmarks[24].y) / 2;
                      if (baselineY.current === 0 || hipY > baselineY.current) {
                          baselineY.current = baselineY.current * 0.95 + hipY * 0.05;
                      }
                      const jumpThreshold = 0.08; 
                      const isUp = hipY < (baselineY.current - jumpThreshold);
                      if (isUp && !isJumping.current) {
                          isJumping.current = true;
                      } else if (!isUp && isJumping.current) { 
                          isJumping.current = false; 
                          triggerScore(); 
                      }
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

  const triggerScore = () => {
      const id = Date.now();
      const x = 20 + Math.random() * 60; 
      const y = 30 + Math.random() * 20; 
      setFloatingScores(prev => [...prev, { id, x, y, value: "PERFECT!" }]);
      setTimeout(() => setFloatingScores(prev => prev.filter(p => p.id !== id)), 1000);
      setXp(prev => prev + 1);
      if (state === PlayerState.PLAYING && audioContextRef.current) playTone(audioContextRef.current, 880, 0.05, 'triangle');
  };

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
          
          beatIntervalRef.current = setInterval(() => {
             setBeatStep(v => {
                 const next = (v + 1) % 4;
                 // 优化：使用 requestIdleCallback 或 setTimeout(0) 来避免阻塞
                 if (audioContextRef.current && audioContextRef.current.state === 'running') {
                     // 使用微任务来确保音频播放不阻塞主线程
                     Promise.resolve().then(() => {
                         if (audioContextRef.current && audioContextRef.current.state === 'running') {
                             playDrumStep(audioContextRef.current, next);
                         }
                     });
                 }
                 return next;
             });
          }, 125); 
      }
      return () => { if (beatIntervalRef.current) clearInterval(beatIntervalRef.current); };
  }, [state]);

  const togglePause = () => {
    if (state === PlayerState.PLAYING) setState(PlayerState.PAUSED);
    else if (state === PlayerState.PAUSED) setState(PlayerState.PLAYING);
    else if (state === PlayerState.INSTRUCTION) startCountdown();
  };

  const progress = ((currentExercise.durationSeconds - timeLeft) / currentExercise.durationSeconds) * 100;

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
                 {frames.length > 0 ? (
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
         <div className={`absolute inset-0 transition-opacity duration-75 ${beatStep === 0 ? 'bg-teal-500/20' : beatStep === 2 ? 'bg-blue-500/20' : 'bg-transparent'}`}></div>
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
          <h1 className={`text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter text-center transition-transform duration-75 ${beatStep === 0 ? 'scale-110' : 'scale-100'}`} style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}>
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

      <div className="absolute inset-0 z-20" onClick={togglePause}>
         {state === PlayerState.PAUSED && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <Play className="w-16 h-16 text-white fill-white" />
            </div>
         )}
         {state === PlayerState.CELEBRATION && (
              <div className="absolute inset-0 flex items-center justify-center bg-teal-500/20 backdrop-blur-sm">
                <div className="text-6xl font-black text-white italic tracking-tighter animate-bounce">太棒了!</div>
              </div>
         )}
      </div>

      {/* Mobile-optimized PIP Camera */}
      <div className="absolute bottom-36 right-4 z-40 w-24 md:w-40 aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
         <video ref={videoRef} className="w-full h-full object-cover mirror opacity-80" autoPlay playsInline muted></video>
         <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-10 flex flex-col gap-2 bg-gradient-to-t from-black via-black/80 to-transparent pt-16">
         <div className="flex justify-center items-end gap-1.5 mb-2">
            {['DONG', 'CI', 'DA', 'CI'].map((label, idx) => (
                <div key={idx} className={`h-6 flex items-center justify-center rounded-lg transition-all duration-75 ${beatStep === idx ? 'bg-white text-black px-3 font-black text-[10px]' : 'bg-white/5 text-white/20 px-2 text-[8px]'}`}>
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
