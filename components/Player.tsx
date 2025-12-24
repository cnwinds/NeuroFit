import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPlan, PlayerState } from '../types';
import { generateStickFigureAnimation } from '../services/geminiService';
import { getAudioEngine, type DrumStep } from '../beats';
import { Play, Pause, SkipForward, CheckCircle, Star, Loader2, Camera, X, Activity } from 'lucide-react';
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { getAction, ActionComponent } from '../actions';
import { poseService } from '../services/poseService';
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
  // --- Core State ---
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(plan.exercises[0].durationSeconds);
  const [state, setState] = useState<PlayerState>(PlayerState.PREPARING);
  const [countdownValue, setCountdownValue] = useState(3);
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [beatStep, setBeatStep] = useState(0);
  const [xp, setXp] = useState(0);
  const [floatingScores, setFloatingScores] = useState<ScoreParticle[]>([]);
  const [currentScore, setCurrentScore] = useState<ActionScore | null>(null);
  const [actionAccuracy, setActionAccuracy] = useState<number>(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<any[]>([]);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const currentActionRef = useRef<ActionComponent | null>(null);
  const previousLandmarksRef = useRef<any[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const initializationStarted = useRef(false);
  const instructionSuccessCount = useRef(0);

  // Performance Control
  const frameSkipCounter = useRef(0);
  const lastDetectionTime = useRef(0);
  const DETECTION_INTERVAL = 150;
  const FRAME_SKIP = 2;

  // Timers
  const timerRef = useRef<any>(null);
  const beatIntervalRef = useRef<any>(null);
  const animationIntervalRef = useRef<any>(null);

  const currentExercise = plan.exercises[currentExerciseIndex];

  // --- Initialization & Action Matching ---

  useEffect(() => {
    // Match current action component
    const name = currentExercise.name;
    const match = name.match(/\(([^)]+)\)/);
    const actionKey = match ? match[1].toUpperCase() : name.toUpperCase();

    const action = getAction(actionKey) || getAction(actionKey.split(' ')[0]);
    if (action) {
      currentActionRef.current = action;
      action.Detector.reset();
    } else {
      currentActionRef.current = null;
    }
  }, [currentExerciseIndex]);

  // Stabilized callback to prevent re-renders of the Guide component
  const handleGuideReady = useCallback(() => {
    // console.log("Guide ready");
  }, []);

  useEffect(() => {
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    const init = async () => {
      try {
        // Init Camera
        // Relaxed constraints for better compatibility
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = stream;
        setCameraReady(true);

        // Init Pose
        poseLandmarkerRef.current = await poseService.getPoseLandmarker();
        setModelReady(true);
      } catch (err: any) {
        console.error("Initialization failed", err);
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          alert("未找到摄像头设备，请检查连接。");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert("摄像头权限被拒绝，请在浏览器设置中开启。");
        } else {
          alert("摄像头初始化失败: " + err.message);
        }
      }
    };
    init();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const prepare = async () => {
      setState(PlayerState.PREPARING);
      setTimeLeft(currentExercise.durationSeconds);
      setFrames([]);
      instructionSuccessCount.current = 0;

      if (currentActionRef.current) {
        setState(PlayerState.INSTRUCTION);
      } else {
        const generated = await generateStickFigureAnimation(currentExercise.name, !!plan.isDemo);
        if (isMounted) {
          setFrames(generated);
          setState(PlayerState.INSTRUCTION);
        }
      }
    };
    prepare();
    return () => { isMounted = false; };
  }, [currentExerciseIndex]);

  useEffect(() => {
    if (state === PlayerState.INSTRUCTION && frames.length > 1) {
      animationIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 800);
    }
    return () => clearInterval(animationIntervalRef.current);
  }, [state, frames]);

  useEffect(() => {
    const isVidActive = (state === PlayerState.COUNTDOWN || state === PlayerState.PLAYING || state === PlayerState.INSTRUCTION);
    if (isVidActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [state, cameraReady]);

  useEffect(() => {
    let isLooping = true;
    const loop = () => {
      if (!isLooping) return;
      predictWebcam();
      requestRef.current = requestAnimationFrame(loop);
    };

    const isVidActive = (state === PlayerState.COUNTDOWN || state === PlayerState.PLAYING || state === PlayerState.INSTRUCTION);
    if (isVidActive && cameraReady && modelReady) {
      loop();
    }

    return () => {
      isLooping = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state, cameraReady, modelReady]);

  // --- Detection Logic ---

  const predictWebcam = () => {
    const landmarker = poseLandmarkerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!landmarker || !video || !canvas || video.readyState < 2) return;

    if (video.currentTime === lastVideoTimeRef.current) return;
    lastVideoTimeRef.current = video.currentTime;

    const ctx = canvas.getContext("2d");
    if (!ctx || video.videoWidth === 0) return;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const now = performance.now();
    frameSkipCounter.current++;

    const shouldDetect = frameSkipCounter.current >= FRAME_SKIP && (now - lastDetectionTime.current) >= DETECTION_INTERVAL;

    if (shouldDetect) {
      frameSkipCounter.current = 0;
      lastDetectionTime.current = now;

      landmarker.detectForVideo(video, now, (result) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (result.landmarks && result.landmarks[0]) {
          const landmarks = result.landmarks[0];
          setCurrentLandmarks(landmarks);
          drawStickFigure(ctx, landmarks, canvas.width, canvas.height);

          const isDetecting = (state === PlayerState.PLAYING || state === PlayerState.INSTRUCTION);
          if (currentActionRef.current && isDetecting) {
            const res = currentActionRef.current.Detector.detect(landmarks, previousLandmarksRef.current);

            if (state === PlayerState.PLAYING) setActionAccuracy(res.accuracy);

            if (res.isCompleted) {
              if (state === PlayerState.PLAYING) {
                handleActionComplete(res.accuracy);
              } else if (state === PlayerState.INSTRUCTION) {
                instructionSuccessCount.current++;
                getAudioEngine().playGood();
                if (instructionSuccessCount.current >= 1) startCountdown(); // Reduced to 1 for faster mobile testing/onboarding
              }
            }
            previousLandmarksRef.current = landmarks;
          }
        }
      });
    }
  };

  const drawStickFigure = (ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) => {
    ctx.save();
    const connect = (i1: number, i2: number) => {
      const s = landmarks[i1], e = landmarks[i2];
      if (s && e) {
        ctx.beginPath();
        ctx.moveTo(s.x * w, s.y * h);
        ctx.lineTo(e.x * w, e.y * h);
        ctx.strokeStyle = "#2dd4bf"; ctx.lineWidth = 10; ctx.shadowBlur = 20; ctx.shadowColor = "#2dd4bf";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s.x * w, s.y * h);
        ctx.lineTo(e.x * w, e.y * h);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.shadowBlur = 0;
        ctx.stroke();
      }
    };
    [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]].forEach(pair => connect(pair[0], pair[1]));
    if (landmarks[0]) {
      ctx.beginPath();
      ctx.arc(landmarks[0].x * w, landmarks[0].y * h, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 25; ctx.fill();
    }
    ctx.restore();
  };

  const handleActionComplete = useCallback((acc: number) => {
    if (state !== PlayerState.PLAYING) return;
    const now = Date.now();
    const offset = lastBeatTimeRef.current > 0 ? Math.abs(now - lastBeatTimeRef.current) : 0;
    const score = calculateScore(acc, offset, beatStep);
    setCurrentScore(score);

    // XP & Floating Score
    const xpGain = score === ActionScore.EXCELLENT ? 10 : score === ActionScore.GOOD ? 5 : 2;
    setXp(v => v + xpGain);

    const id = Date.now();
    setFloatingScores(prev => [...prev, { id, x: 20 + Math.random() * 60, y: 30 + Math.random() * 20, value: score.toUpperCase() }]);
    setTimeout(() => setFloatingScores(prev => prev.filter(p => p.id !== id)), 1000);

    // Auto-clear the score display after a short while
    setTimeout(() => setCurrentScore(null), 1000);
  }, [state, beatStep]);

  const startCountdown = () => {
    getAudioEngine().initialize();
    setState(PlayerState.COUNTDOWN);
    setCountdownValue(3);
  };

  useEffect(() => {
    if (state === PlayerState.COUNTDOWN) {
      getAudioEngine().playCountdown(countdownValue === 0);
      if (countdownValue > 0) {
        const id = setTimeout(() => setCountdownValue(v => v - 1), 1000);
        return () => clearTimeout(id);
      } else setState(PlayerState.PLAYING);
    }
  }, [state, countdownValue]);

  const handleExerciseComplete = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(beatIntervalRef.current);
    getAudioEngine().playGood();
    setXp(v => v + 50);

    // Trigger transition effect
    setCurrentScore(ActionScore.EXCELLENT);
    setState(PlayerState.CELEBRATION);
  }, []);

  const handleCompletionEffectComplete = useCallback(() => {
    setCurrentScore(null);
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setCurrentExerciseIndex(v => v + 1);
      setState(PlayerState.INSTRUCTION);
    } else setState(PlayerState.COMPLETED);
  }, [currentExerciseIndex]);

  const skipExercise = () => {
    clearInterval(timerRef.current);
    clearInterval(beatIntervalRef.current);
    if (currentExerciseIndex < plan.exercises.length - 1) {
      setCurrentExerciseIndex(v => v + 1);
      setState(PlayerState.INSTRUCTION);
    } else setState(PlayerState.COMPLETED);
  };

  useEffect(() => {
    if (state === PlayerState.PLAYING) {
      timerRef.current = setInterval(() => {
        setTimeLeft(v => {
          if (v <= 1) { clearInterval(timerRef.current); return 0; }
          return v - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [state]);

  useEffect(() => { if (state === PlayerState.PLAYING && timeLeft === 0) handleExerciseComplete(); }, [timeLeft, state]);

  // Rhythm Loop
  useEffect(() => {
    if (state === PlayerState.PLAYING || state === PlayerState.INSTRUCTION) {
      const engine = getAudioEngine();
      engine.initialize();
      const beat = currentActionRef.current?.Beat || { bpm: 120, pattern: [0, 1, 2, 3] };
      const interval = (60 / beat.bpm) * 1000 / beat.pattern.length;

      beatIntervalRef.current = setInterval(() => {
        setBeatStep(v => {
          const next = (v + 1) % beat.pattern.length;
          lastBeatTimeRef.current = Date.now();
          const step = beat.pattern[next];
          if (Array.isArray(step)) step.forEach(s => engine.playDrumStep(s));
          else engine.playDrumStep(step);
          return next;
        });
      }, interval);
    }
    return () => clearInterval(beatIntervalRef.current);
  }, [state]);

  const togglePause = () => {
    if (state === PlayerState.PLAYING) setState(PlayerState.PAUSED);
    else if (state === PlayerState.PAUSED) setState(PlayerState.PLAYING);
    else if (state === PlayerState.INSTRUCTION) startCountdown();
  };

  const progress = ((currentExercise.durationSeconds - timeLeft) / currentExercise.durationSeconds) * 100;

  // --- Render Helpers ---

  if (state === PlayerState.COMPLETED) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
        <CheckCircle className="w-20 h-20 text-teal-400 mb-6" />
        <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-widest">训练达成</h2>
        <div className="text-2xl font-bold text-yellow-400 mb-8">+{xp} XP</div>
        <button onClick={onExit} className="bg-white text-black font-black py-4 px-10 rounded-full text-sm uppercase">返回主页</button>
      </div>
    );
  }

  if (state === PlayerState.INSTRUCTION || state === PlayerState.PREPARING) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-between p-8 text-center overflow-hidden">
        <div className="w-full pt-8">
          <p className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-2">NEXT UP</p>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">{currentExercise.name}</h1>
        </div>
        <div className="flex-1 w-full flex items-center justify-center my-6">
          <div className="relative w-full max-w-sm aspect-square bg-slate-800/50 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
            {currentActionRef.current ? (
              <currentActionRef.current.Guide onReady={handleGuideReady} landmarks={currentLandmarks} />
            ) : frames.length > 0 ? (
              <img src={frames[currentFrameIndex]} className="w-full h-full object-contain p-8" alt="guide" />
            ) : <Loader2 className="w-12 h-12 animate-spin text-teal-500" />}
          </div>
        </div>
        <div className="w-full pb-10 flex justify-center">
          {cameraReady ? (
            <div className="text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 text-[10px] font-bold tracking-widest uppercase">CAMERA READY</div>
          ) : (
            <div className="text-red-300 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 text-[10px] font-bold tracking-widest uppercase animate-pulse">INITIALIZING...</div>
          )}
        </div>

        <div className="absolute bottom-6 right-6 w-32 h-24 md:w-48 md:h-36 bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-50">
          <video ref={videoRef} className="w-full h-full object-cover opacity-40" autoPlay playsInline muted></video>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain z-10 opactiy-90"></canvas>

          {/* User Skeleton Debug View Overlay */}
          {currentLandmarks && currentLandmarks.length > 0 ? (
            <div className="absolute inset-0 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {[[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]].map(([i1, i2], idx) => {
                  const s = currentLandmarks[i1];
                  const e = currentLandmarks[i2];
                  if (!s || !e) return null;
                  return (
                    <line
                      key={idx}
                      x1={s.x * 100} y1={s.y * 100}
                      x2={e.x * 100} y2={e.y * 100}
                      stroke="#2dd4bf"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[8px] text-white/30 font-bold tracking-widest uppercase">Waiting for Pose...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state === PlayerState.COUNTDOWN) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <span className="text-9xl md:text-[15rem] font-black text-white italic animate-ping-short">
          {countdownValue === 0 ? "GO" : countdownValue}
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 overflow-hidden select-none">
      <div className={`absolute inset-0 transition-opacity duration-150 ${beatStep === 0 ? 'bg-teal-500/10' : 'bg-transparent'}`}></div>

      {/* Action Specific Display Layer */}
      {currentActionRef.current?.Display && (
        <div className="absolute inset-0 z-0">
          <currentActionRef.current.Display
            landmarks={currentLandmarks}
            accuracy={actionAccuracy}
            beatStep={beatStep}
          />
        </div>
      )}

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain z-10 opactiy-90"></canvas>

      <div className="absolute inset-0 z-20 pointer-events-none">
        {floatingScores.map(s => (
          <div key={s.id} className="absolute text-3xl font-black text-yellow-400 score-float italic" style={{ left: `${s.x}%`, top: `${s.y}%` }}>{s.value}</div>
        ))}
      </div>

      <div className="absolute top-12 left-0 right-0 z-30 flex flex-col items-center px-6">
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter text-center" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
          {currentExercise.name}
        </h1>
      </div>

      <div className="absolute top-4 right-4 z-40 flex items-center gap-4">
        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white text-sm font-black italic">{xp} XP</div>
        <button onClick={onExit} className="text-white/60 p-2"><X className="w-5 h-5" /></button>
      </div>

      <div className="absolute inset-0 z-20" onClick={togglePause}>
        {state === PlayerState.PAUSED && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"><Play className="w-16 h-16 text-white fill-white" /></div>}
      </div>

      {currentScore && (
        <CompletionEffect
          score={currentScore}
          onComplete={() => {
            if (state === PlayerState.CELEBRATION) {
              handleCompletionEffectComplete();
            } else {
              setCurrentScore(null);
            }
          }}
        />
      )}

      <div className="absolute bottom-36 right-4 z-40 w-24 md:w-32 aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl">
        <video ref={videoRef} className="w-full h-full object-cover opacity-70" autoPlay playsInline muted></video>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-10 flex flex-col gap-4 bg-gradient-to-t from-slate-900 to-transparent pt-20">
        <div className="flex justify-center gap-2">
          {['DONG', 'CI', 'DA', 'CI'].map((l, i) => (
            <div key={i} className={`h-8 px-4 flex items-center justify-center rounded-xl font-black text-xs transition-all ${beatStep === i ? 'bg-teal-500 text-white scale-110 shadow-lg shadow-teal-500/40' : 'bg-white/5 text-white/20'}`}>{l}</div>
          ))}
        </div>
        <div className="text-center font-black italic text-6xl text-white drop-shadow-lg">{timeLeft}</div>
        <div className="flex items-center gap-3">
          <button onClick={togglePause} className="text-white">{state === PlayerState.PLAYING ? <Pause /> : <Play />}</button>
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
          <button onClick={skipExercise} className="text-white/40"><SkipForward /></button>
        </div>
      </div>
      <style>{`.mirror { transform: scaleX(-1); } .score-float { animation: score-up 1s ease-out forwards; } @keyframes score-up { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-50px); } }`}</style>
    </div>
  );
};

export default Player;
