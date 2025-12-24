import React, { useEffect, useState, useRef } from 'react';
import { DisplayProps } from '../base/ActionBase';

interface Note {
    id: number;
    progress: number; // 0 to 1
    startTime: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export const SayHiBeatGame: React.FC<DisplayProps> = ({ landmarks, accuracy, beatStep }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [particles, setParticles] = useState<Particle[]>([]);
    const lastBeatStepRef = useRef<number>(-1);
    const requestRef = useRef<number | null>(null);
    const lastAccuracyRef = useRef<number>(0);

    // 目标位置：对应右手挥动的区域
    const targetPos = { x: 0.25, y: 0.3 };

    // 获取当前右手腕位置
    const rightWrist = landmarks && landmarks[16] ? landmarks[16] : null;
    const [combo, setCombo] = useState(0);

    useEffect(() => {
        // 当 beatStep 改变时，生成一个新音符
        if (beatStep !== lastBeatStepRef.current) {
            const newNote: Note = {
                id: Math.random(),
                progress: 0,
                startTime: Date.now()
            };
            setNotes(prev => [...prev, newNote]);
            lastBeatStepRef.current = beatStep;
        }
    }, [beatStep]);

    // 检测击中及其特效
    useEffect(() => {
        if (accuracy > 0.8 && lastAccuracyRef.current <= 0.8) {
            // 触发击中粒子效果
            spawnParticles(targetPos.x, targetPos.y, '#2dd4bf');
            setCombo(c => c + 1);
        } else if (accuracy < 0.2 && lastAccuracyRef.current >= 0.2) {
            // 误触或动作不到位不重置，但如果长时间没动作可以考虑重置
            // 这里暂不处理重置，保持积极反馈
        }
        lastAccuracyRef.current = accuracy;
    }, [accuracy]);

    const spawnParticles = (x: number, y: number, color: string) => {
        const newParticles: Particle[] = Array.from({ length: 15 }).map(() => ({
            id: Math.random(),
            x,
            y,
            vx: (Math.random() - 0.5) * 0.02,
            vy: (Math.random() - 0.5) * 0.02,
            life: 1.0,
            color
        }));
        setParticles(prev => [...prev, ...newParticles]);
    };

    const animate = () => {
        // 更新音符
        setNotes(prev => prev
            .map(note => ({
                ...note,
                progress: note.progress + 0.012 // 稍微慢一点，更有节奏感
            }))
            .filter(note => note.progress < 1.1)
        );

        // 更新粒子
        setParticles(prev => prev
            .map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 0.03
            }))
            .filter(p => p.life > 0)
        );

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden font-sans">
            {/* 动态背景光晕 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-transparent"></div>

            {/* COMBO 计数器 */}
            {combo > 0 && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
                    <div className="text-sm font-black text-teal-400 tracking-[0.3em] uppercase opacity-50">COMBO</div>
                    <div className="text-6xl font-black italic text-white tracking-tighter animate-bounce">{combo}</div>
                </div>
            )}

            {/* 判定目标 - 科技感圆环 */}
            <div
                className="absolute"
                style={{
                    left: `${targetPos.x * 100}%`,
                    top: `${targetPos.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                {/* 外环 */}
                <div className={`absolute w-32 h-32 rounded-full border-2 border-teal-500/20 animate-pulse`}></div>
                {/* 中环 */}
                <div className={`absolute w-24 h-24 rounded-full border border-white/10 transition-transform duration-150 ${beatStep % 2 === 0 ? 'scale-110 opacity-60' : 'scale-100 opacity-30'}`}></div>
                {/* 核心判定点 */}
                <div
                    className={`absolute w-16 h-16 rounded-full border-2 flex items-center justify-center backdrop-blur-md transition-all duration-200 ${accuracy > 0.8 ? 'border-teal-400 bg-teal-400/20 scale-110 shadow-[0_0_30px_rgba(45,212,191,0.6)]' : 'border-white/30 bg-white/5'}`}
                >
                    <div className={`text-[10px] font-black italic tracking-tighter ${accuracy > 0.8 ? 'text-white' : 'text-white/40'}`}>
                        {accuracy > 0.8 ? 'PERFECT' : 'BEAT'}
                    </div>
                </div>
            </div>

            {/* 粒子效果 */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x * 100}%`,
                        top: `${p.y * 100}%`,
                        width: '4px',
                        height: '4px',
                        backgroundColor: p.color,
                        opacity: p.life,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: `0 0 10px ${p.color}`
                    }}
                />
            ))}

            {/* 音符 - 能量球 */}
            {notes.map(note => {
                // 从右下角向上方目标点移动
                const startX = 0.8;
                const startY = 0.9;
                const curX = startX + (targetPos.x - startX) * note.progress;
                const curY = startY + (targetPos.y - startY) * note.progress;
                const scale = 0.5 + note.progress * 0.5;
                const opacity = note.progress < 0.1 ? note.progress * 10 : (note.progress > 0.9 ? 1 - (note.progress - 0.9) * 10 : 1);

                return (
                    <div
                        key={note.id}
                        className="absolute"
                        style={{
                            left: `${curX * 100}%`,
                            top: `${curY * 100}%`,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            opacity: opacity > 0 ? opacity : 0
                        }}
                    >
                        {/* 能量核心 */}
                        <div className="w-8 h-8 rounded-full bg-white shadow-[0_0_20px_#2dd4bf] relative">
                            {/* 环绕流光 */}
                            <div className="absolute inset-0 rounded-full border-2 border-teal-300 animate-spin transition-all" style={{ animationDuration: '1s' }}></div>
                            <div className="absolute -inset-2 rounded-full border border-white/20 animate-reverse-spin" style={{ animationDuration: '2s' }}></div>
                        </div>
                    </div>
                );
            })}

            {/* 手部指示器 - 十字准星风格 */}
            {rightWrist && (
                <div
                    className="absolute z-50 transition-all duration-75"
                    style={{
                        left: `${rightWrist.x * 100}%`,
                        top: `${rightWrist.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="relative w-10 h-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-yellow-400 shadow-[0_0_10px_#fbbf24]"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-yellow-400 shadow-[0_0_10px_#fbbf24]"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-yellow-400 shadow-[0_0_10px_#fbbf24]"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-3 bg-yellow-400 shadow-[0_0_10px_#fbbf24]"></div>
                        <div className="absolute inset-2 rounded-full border border-yellow-400/50 animate-ping"></div>
                    </div>
                </div>
            )}

            {/* 连击/评价特效 */}
            {accuracy > 0.9 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-teal-400 animate-message-pop tracking-tighter filter drop-shadow-[0_0_30px_rgba(45,212,191,0.5)]">
                        EXCELLENT
                    </div>
                </div>
            )}

            <style>{`
                @keyframes reverse-spin { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-reverse-spin { animation: reverse-spin linear infinite; }
                @keyframes message-pop {
                    0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
                    20% { transform: scale(1.1); opacity: 1; filter: blur(0px); }
                    80% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; filter: blur(20px); }
                }
                .animate-message-pop { animation: message-pop 0.8s ease-out forwards; }
            `}</style>
        </div>
    );
};
