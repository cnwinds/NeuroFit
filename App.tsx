
import React, { useState } from 'react';
import WorkoutGenerator from './components/WorkoutGenerator';
import Player from './components/Player';
import { WorkoutPlan } from './types';

const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-teal-500 selection:text-white overflow-x-hidden relative">
      
      {/* Background ambient mesh */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 -right-[10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        {!currentPlan ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <WorkoutGenerator onPlanGenerated={setCurrentPlan} />
          </div>
        ) : (
          <div className="fixed inset-0 z-[100]">
            <Player 
              plan={currentPlan} 
              onExit={() => setCurrentPlan(null)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
