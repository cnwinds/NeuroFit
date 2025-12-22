export enum Difficulty {
  BEGINNER = '初级',
  INTERMEDIATE = '中级',
  ADVANCED = '高级',
}

export interface Exercise {
  name: string;
  durationSeconds: number;
  description: string;
  scientificBenefit: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'balance';
  visualUrl?: string; // URL for the GIF/Video
}

export interface WorkoutPlan {
  title: string;
  overview: string;
  exercises: Exercise[];
  totalDurationMinutes: number;
  isDemo?: boolean; // New flag for offline mode
}

export interface AudioPart {
  text: string;
  audioBase64: string | null;
}

export enum PlayerState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  PREPARING = 'PREPARING', // Audio loading / buffering
  INSTRUCTION = 'INSTRUCTION', // "Get Ready" phase
  COUNTDOWN = 'COUNTDOWN', // "3, 2, 1" phase
  PLAYING = 'PLAYING', // Video & Timer active
  CELEBRATION = 'CELEBRATION', // "VERY GOOD" screen
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}