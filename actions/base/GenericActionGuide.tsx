/**
 * 通用的动作引导组件
 * 自动根据动作英文名称加载 Gemini SVG 动画
 */

import React, { useEffect, useState } from 'react';
import { GuideProps } from './ActionBase';
import { generateStickFigureAnimation } from '../../services/geminiService';
import { Loader2 } from 'lucide-react';

interface GenericGuideProps extends GuideProps {
    actionName: string;
}

export const GenericActionGuide: React.FC<GenericGuideProps> = ({ actionName, onReady }) => {
    const [frames, setFrames] = useState<string[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadAnimation = async () => {
            try {
                // 使用英文名称加载动画
                const generatedFrames = await generateStickFigureAnimation(actionName, false);
                if (isMounted) {
                    if (generatedFrames.length > 0) {
                        setFrames(generatedFrames);
                    }
                    setLoading(false);
                    onReady();
                }
            } catch (error) {
                console.error(`Failed to load ${actionName} animation:`, error);
                if (isMounted) {
                    setLoading(false);
                    onReady();
                }
            }
        };

        loadAnimation();
        return () => { isMounted = false; };
    }, [actionName, onReady]);

    useEffect(() => {
        if (frames.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => (prev + 1) % frames.length);
        }, 800);

        return () => clearInterval(interval);
    }, [frames.length]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
        );
    }

    if (frames.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/40 text-xs">NO ANIMATION</p>
            </div>
        );
    }

    return (
        <img
            src={frames[currentFrameIndex]}
            className="w-full h-full object-contain p-4"
            alt={`${actionName} guide animation`}
        />
    );
};
