
import React, { useState, lazy, Suspense } from 'react';
import WorkoutGenerator from './components/WorkoutGenerator';
import Player from './components/Player';
import BeatEditor from './components/BeatEditor';
import { WorkoutPlan } from './types';
import { type SavedBeatPattern } from './beats';
import { Wand2 } from 'lucide-react';

type Page = 'home' | 'beat-editor' | 'player' | 'mocap';

const IS_DEV = import.meta.env.DEV;

const MocapEditor = IS_DEV ? lazy(() => import('./components/MocapEditor')) : null;

const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('home');

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-teal-500 selection:text-white overflow-x-hidden relative">

      {/* Background ambient mesh */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 -right-[10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        {currentPage === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <WorkoutGenerator
              onPlanGenerated={(plan) => {
                setCurrentPlan(plan);
                setCurrentPage('player');
              }}
              onOpenBeatEditor={() => setCurrentPage('beat-editor')}
            />

            {IS_DEV && (
              <div className="mt-8">
                <button
                  onClick={() => setCurrentPage('mocap')}
                  className="group relative flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 px-10 py-5 rounded-[2rem] transition-all duration-300 shadow-xl"
                >
                  <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black italic uppercase tracking-tighter">AI 动作工坊</div>
                    <div className="text-xs text-white/40 font-medium">录制并自动生成新动作代码</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {currentPage === 'beat-editor' && (
          <BeatEditor
            onClose={() => setCurrentPage('home')}
            onSave={(pattern: SavedBeatPattern) => {
              console.log('节拍模式已保存:', pattern);
              // 可以在这里添加将节拍应用到健身计划的逻辑
            }}
          />
        )}

        {IS_DEV && currentPage === 'mocap' && MocapEditor && (
          <Suspense fallback={<div>Loading...</div>}>
            <MocapEditor
              onClose={() => setCurrentPage('home')}
            />
          </Suspense>
        )}

        {currentPage === 'player' && currentPlan && (
          <div className="fixed inset-0 z-[100]">
            <Player
              plan={currentPlan}
              onExit={() => {
                setCurrentPlan(null);
                setCurrentPage('home');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
