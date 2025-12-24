import React, { useState, useEffect, useRef } from 'react';
import { DisplayProps } from '../base/ActionBase';

interface Note {
  id: number;
  x: number;
  y: number;
  type: 'kick' | 'hihat';
  hit: boolean;
  missed: boolean;
}

interface HitResult {
  show: boolean;
  text: string;
  color: string;
}

export const SayHiDisplay: React.FC<DisplayProps> = ({ accuracy, beatStep }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hitResult, setHitResult] = useState<HitResult>({ show: false, text: '', color: '' });
  const [lastBeatStep, setLastBeatStep] = useState(-1);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const noteIdRef = useRef(0);

  const JUDGE_LINE_Y = 70;
  const PERFECT_WINDOW = 15;
  const GOOD_WINDOW = 30;
  const NOTE_SPEED = 2;
  const SPAWN_Y = 110;

  useEffect(() => {
    const animate = () => {
      setNotes(prevNotes => {
        const updatedNotes = prevNotes.map(note => ({
          ...note,
          y: note.y - NOTE_SPEED,
        }));

        const hitNotes = updatedNotes.filter(note => note.hit);
        const activeNotes = updatedNotes.filter(note => !note.hit && !note.missed && note.y > -20);

        return [...activeNotes, ...hitNotes];
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (beatStep !== lastBeatStep) {
      const isEven = beatStep % 2 === 0;
      const newNote: Note = {
        id: noteIdRef.current++,
        x: 30 + Math.random() * 40,
        y: SPAWN_Y,
        type: isEven ? 'kick' : 'hihat',
        hit: false,
        missed: false,
      };
      setNotes(prev => [...prev, newNote]);
      setLastBeatStep(beatStep);
    }
  }, [beatStep, lastBeatStep]);

  useEffect(() => {
    if (accuracy > 0.8) {
      checkHit();
    }
  }, [accuracy]);

  const checkHit = () => {
    setNotes(prevNotes => {
      const activeNotes = prevNotes.filter(note => !note.hit && !note.missed);
      let bestMatch: Note | null = null;
      let bestDiff = Infinity;

      activeNotes.forEach(note => {
        const diff = Math.abs(note.y - JUDGE_LINE_Y);
        if (diff < GOOD_WINDOW && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = note;
        }
      });

      if (bestMatch) {
        const updatedNotes = prevNotes.map(note => {
          if (note.id === bestMatch!.id) {
            return { ...note, hit: true };
          }
          return note;
        });

        let resultText = '';
        let resultColor = '';

        if (bestDiff < PERFECT_WINDOW) {
          resultText = 'PERFECT!';
          resultColor = '#FFD700';
          setScore(s => s + 100);
          setCombo(c => c + 1);
        } else {
          resultText = 'GOOD!';
          resultColor = '#00FF00';
          setScore(s => s + 50);
          setCombo(c => c + 1);
        }

        setHitResult({ show: true, text: resultText, color: resultColor });
        setTimeout(() => setHitResult({ show: false, text: '', color: '' }), 500);

        return updatedNotes;
      }

      return prevNotes;
    });
  };

  const getNoteColor = (type: 'kick' | 'hihat') => {
    return type === 'kick' ? '#FF6B6B' : '#4ECDC4';
  };

  const getNoteSize = (type: 'kick' | 'hihat') => {
    return type === 'kick' ? '50px' : '35px';
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${JUDGE_LINE_Y}%`,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
          boxShadow: '0 0 20px #FFD700',
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${JUDGE_LINE_Y}%`,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#FFD700',
          textShadow: '0 0 10px #FFD700',
          marginTop: '-25px',
        }}
      >
        JUDGE LINE
      </div>

      {notes.map(note => (
        <div
          key={note.id}
          style={{
            position: 'absolute',
            left: `${note.x}%`,
            top: `${note.y}%`,
            width: getNoteSize(note.type),
            height: getNoteSize(note.type),
            borderRadius: '50%',
            background: note.hit ? 'transparent' : getNoteColor(note.type),
            boxShadow: note.hit ? 'none' : `0 0 20px ${getNoteColor(note.type)}`,
            transform: 'translate(-50%, -50%)',
            opacity: note.hit ? 0 : 1,
            transition: note.hit ? 'opacity 0.2s, transform 0.2s' : 'none',
            transform: note.hit ? 'translate(-50%, -50%) scale(2)' : 'translate(-50%, -50%)',
          }}
        >
          {!note.hit && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '10px',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              {note.type === 'kick' ? '★' : '♪'}
            </div>
          )}
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          textAlign: 'right',
          color: '#fff',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          SCORE: {score}
        </div>
        <div style={{ fontSize: '18px', color: '#FFD700' }}>
          COMBO: {combo}
        </div>
      </div>

      {hitResult.show && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48px',
            fontWeight: 'bold',
            color: hitResult.color,
            textShadow: `0 0 30px ${hitResult.color}, 0 0 60px ${hitResult.color}`,
            animation: 'pulse 0.5s ease-out',
          }}
        >
          {hitResult.text}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};
