
import React, { useState } from 'react';
import WorkoutGenerator from './components/WorkoutGenerator';
import Player from './components/Player';
import BeatEditor from './components/BeatEditor';
import { WorkoutPlan } from './types';
import { type SavedBeatPattern } from './beats';

type Page = 'home' | 'beat-editor' | 'player';

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
