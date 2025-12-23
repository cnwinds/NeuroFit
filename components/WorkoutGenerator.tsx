
import React, { useState } from 'react';
import { Difficulty, WorkoutPlan } from '../types';
import { generateWorkoutPlan } from '../services/geminiService';
import { generateWorkoutPlanFromActions } from '../services/actionWorkoutGenerator';
import { Zap, Clock, Activity, BrainCircuit, Rocket, Music, Sparkles } from 'lucide-react';

interface Props {
  onPlanGenerated: (plan: WorkoutPlan) => void;
  onOpenBeatEditor?: () => void;
}

const WorkoutGenerator: React.FC<Props> = ({ onPlanGenerated, onOpenBeatEditor }) => {
  const [focus, setFocus] = useState('全身');
  const [duration, setDuration] = useState(7);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [userState, setUserState] = useState('');
  const [useActionSystem, setUseActionSystem] = useState(true); // 默认使用action系统
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("准备生成计划...");
  const [generatedChars, setGeneratedChars] = useState(0);

  const getStatusFromChars = (chars: number) => {
      if (chars < 100) return "连接 Gemini 神经中枢...";
      if (chars < 400) return "分析您的体能数据...";
      if (chars < 800) return "构建核心动作序列...";
      if (chars < 1400) return "优化心率节奏...";
      return "封装最终计划...";
  };

  const handleGenerate = async (isMock: boolean = false) => {
    setLoading(true);
    setProgress(0);
    setGeneratedChars(0);
    
    try {
      let plan: WorkoutPlan;
      
      // 使用Action系统生成计划
      if (useActionSystem && !isMock) {
        setStatusText("正在组织动作序列...");
        setProgress(20);
        
        // 模拟进度
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 10, 90));
        }, 100);
        
        await new Promise(resolve => setTimeout(resolve, 300)); // 短暂延迟以显示进度
        
        plan = generateWorkoutPlanFromActions(
          focus,
          duration,
          difficulty,
          userState || ''
        );
        
        clearInterval(progressInterval);
        setProgress(100);
        setStatusText("计划生成完成！");
      } else {
        // 使用AI生成计划（原有逻辑）
        setStatusText(isMock ? "加载离线演示数据..." : "正在连接 AI...");
        const ESTIMATED_SIZE = 2500;
        plan = await generateWorkoutPlan(
            focus, 
            duration, 
            difficulty, 
            userState || '正常',
            (chars) => {
                setGeneratedChars(chars);
                if (!isMock) {
                    setStatusText(getStatusFromChars(chars));
                    const pct = Math.min(Math.floor((chars / ESTIMATED_SIZE) * 100), 98);
                    setProgress(pct);
                } else {
                    setProgress(100);
                }
            },
            isMock
        );
        setProgress(100);
        setStatusText(isMock ? "演示加载完毕" : "生成完成！");
      }
      
      setTimeout(() => {
          onPlanGenerated(plan);
      }, 500);
    } catch (error) {
      console.error(error);
      alert('生成失败，请检查网络或 API Key。');
      setLoading(false);
    } 
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleGenerate(false);
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 glass-panel rounded-3xl shadow-2xl animate-fade-in relative overflow-hidden my-4">
      
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-1">
          NeuroFit 脉动
        </h1>
        <p className="text-slate-400 text-sm">AI 驱动的科学交互式训练</p>
      </div>

      {/* 生成模式选择 */}
      <div className="mb-5 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-slate-300">使用动作系统</span>
            <span className="text-xs text-slate-500">(基于已注册的动作组件)</span>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={useActionSystem}
              onChange={(e) => setUseActionSystem(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-14 h-7 rounded-full transition-colors ${
              useActionSystem ? 'bg-teal-500' : 'bg-slate-600'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-1 ${
                useActionSystem ? 'translate-x-8' : 'translate-x-1'
              }`}></div>
            </div>
          </div>
        </label>
        {!useActionSystem && (
          <p className="mt-2 text-xs text-slate-500">切换到AI模式将使用Gemini生成个性化计划</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`space-y-5 transition-all duration-500 ${loading ? 'opacity-10 blur-sm pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3 text-yellow-400" />
            训练重点
          </label>
          <select 
            value={focus} 
            onChange={(e) => setFocus(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
          >
            <option>全身</option>
            <option>核心与腹肌</option>
            <option>上肢力量</option>
            <option>下肢爆发力</option>
            <option>灵活性与体态</option>
            <option>高强度有氧 (HIIT)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-400" />
            时长: <span className="text-teal-400 font-mono">{duration} 分钟</span>
          </label>
          <input 
            type="range" 
            min="3" 
            max="30" 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-red-400" />
            难度系数
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  difficulty === d 
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            当前身体状态 (可选)
          </label>
          <input
            type="text"
            value={userState}
            onChange={(e) => setUserState(e.target.value)}
            placeholder="如：肩膀僵硬、久坐疲劳..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-white text-sm placeholder-slate-600 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
            <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
            开始生成
            </button>
            
            <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={loading}
            className="w-14 bg-slate-700 text-slate-300 py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center shadow-xl"
            title="离线模式"
            >
                <Rocket className="w-5 h-5" />
            </button>
        </div>
        
        {onOpenBeatEditor && (
          <button
            type="button"
            onClick={onOpenBeatEditor}
            className="w-full mt-4 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Music className="w-4 h-4" />
            设计节奏
          </button>
        )}
      </form>

      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-slate-900/90 backdrop-blur-md">
            <div className="mb-6">
                <BrainCircuit className="w-16 h-16 text-teal-400 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">正在规划</h3>
            <p className="text-teal-500 font-mono text-[10px] mb-6">{generatedChars} bits synched</p>

            <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 mb-4 overflow-hidden border border-slate-700 shadow-inner">
                <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-white text-sm animate-pulse">{statusText}</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutGenerator;
