import React, { useEffect, useState, useRef } from 'react';
import { GuideProps } from '../base/ActionBase';

export const SayHiGuide: React.FC<GuideProps> = ({ onReady }) => {
    const [time, setTime] = useState(0);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        onReady();
        const animate = (t: number) => {
            setTime(t / 1000); // 转换为秒
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [onReady]);

    // --- Stick Figure Geometry Definition ---

    // 使用正弦波计算挥手角度 (在 -20 到 -80 度之间波动，0度是水平向右)
    const waveAngle = -50 + Math.sin(time * 6) * 30;
    const radian = (waveAngle * Math.PI) / 180;

    // Static Body Parts
    const head = { cx: 50, cy: 15, r: 6 };
    const body = { x1: 50, y1: 21, x2: 50, y2: 55 };

    // Legs (Standing Still)
    const lLeg1 = { x1: 50, y1: 55, x2: 42, y2: 75 };
    const lLeg2 = { x1: 42, y1: 75, x2: 40, y2: 95 };
    const rLeg1 = { x1: 50, y1: 55, x2: 58, y2: 75 };
    const rLeg2 = { x1: 58, y1: 75, x2: 60, y2: 95 };

    // Left Arm (Idle)
    const lArm1 = { x1: 50, y1: 28, x2: 40, y2: 38 };
    const lArm2 = { x1: 40, y1: 38, x2: 38, y2: 55 };

    // Right Arm (Smooth Animation)
    // Shoulder stays at (50, 28)
    const shoulder = { x: 50, y: 28 };
    const upperArmLength = 15;
    const forearmLength = 18;

    // 大臂：从肩部出发
    // 我们让大臂相对固定，小臂挥动比较大
    const upperArmAngle = -30 + Math.sin(time * 6) * 10;
    const upperArmRad = (upperArmAngle * Math.PI) / 180;
    const elbow = {
        x: shoulder.x + upperArmLength * Math.cos(upperArmRad),
        y: shoulder.y + upperArmLength * Math.sin(upperArmRad)
    };

    // 小臂：从小臂出发，波动更剧烈
    const forearmAngle = waveAngle; // 使用之前计算的 waveAngle
    const wrist = {
        x: elbow.x + forearmLength * Math.cos(radian),
        y: elbow.y + forearmLength * Math.sin(radian)
    };

    // Common Style
    const strokeColor = "#2dd4bf"; // Teal-400
    const strokeWidth = 3;
    const lineProps = {
        stroke: strokeColor,
        strokeWidth,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const
    };

    return (
        <div className="w-full h-full flex items-center justify-center rounded-3xl overflow-hidden">
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full p-2"
                style={{
                    filter: "drop-shadow(0 0 8px rgba(45, 212, 191, 0.5))"
                }}
            >
                {/* Head */}
                <circle cx={head.cx} cy={head.cy} r={head.r} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />

                {/* Body */}
                <line x1={body.x1} y1={body.y1} x2={body.x2} y2={body.y2} {...lineProps} />

                {/* Legs */}
                <line x1={lLeg1.x1} y1={lLeg1.y1} x2={lLeg1.x2} y2={lLeg1.y2} {...lineProps} />
                <line x1={lLeg2.x1} y1={lLeg2.y1} x2={lLeg2.x2} y2={lLeg2.y2} {...lineProps} />
                <line x1={rLeg1.x1} y1={rLeg1.y1} x2={rLeg1.x2} y2={rLeg1.y2} {...lineProps} />
                <line x1={rLeg2.x1} y1={rLeg2.y1} x2={rLeg2.x2} y2={rLeg2.y2} {...lineProps} />

                {/* Left Arm (Static) */}
                <line x1={lArm1.x1} y1={lArm1.y1} x2={lArm1.x2} y2={lArm1.y2} {...lineProps} />
                <line x1={lArm2.x1} y1={lArm2.y1} x2={lArm2.x2} y2={lArm2.y2} {...lineProps} />

                {/* Right Arm (Smooth Animated) */}
                {/* Upper Arm */}
                <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} {...lineProps} />
                {/* Forearm */}
                <line x1={elbow.x} y1={elbow.y} x2={wrist.x} y2={wrist.y} {...lineProps} />

            </svg>
        </div>
    );
};

