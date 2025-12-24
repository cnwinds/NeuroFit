import React, { useEffect, useState } from 'react';
import { GuideProps } from '../base/ActionBase';

export const SquatGuide: React.FC<GuideProps> = ({ onReady }) => {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        onReady();
        const interval = setInterval(() => {
            setFrame(prev => (prev + 1) % 2);
        }, 1200); // Slower, deliberate squat movement
        return () => clearInterval(interval);
    }, [onReady]);

    // --- Stick Figure Geometry Definition ---
    const strokeColor = "#2dd4bf"; // Teal-400
    const strokeWidth = 3;
    const lineProps = { stroke: strokeColor, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "transition-all duration-1000 ease-in-out" };

    // Y-Offset based on frame (0 = Standing, 1 = Squatting)
    const yShift = frame === 0 ? 0 : 20;

    // Head & Body
    const head = { cx: 50, cy: 15 + yShift, r: 6 };
    const bodyTop = { x: 50, y: 21 + yShift };
    const bodyBottom = { x: 50, y: 55 + yShift };

    // Legs - 2 sections (Thigh and Calf)
    // Frame 0: Standing straight
    // Frame 1: Knees bent out

    const hipY = 55 + yShift;
    const kneeY = frame === 0 ? 75 : 85;
    const footY = 95;

    const kneeXOut = frame === 0 ? 42 : 30; // Left knee
    const kneeXIn = frame === 0 ? 58 : 70;  // Right knee

    const lLeg1 = { x1: 50, y1: hipY, x2: kneeXOut, y2: kneeY };
    const lLeg2 = { x1: kneeXOut, y1: kneeY, x2: 40, y2: footY };

    const rLeg1 = { x1: 50, y1: hipY, x2: kneeXIn, y2: kneeY };
    const rLeg2 = { x1: kneeXIn, y1: kneeY, x2: 60, y2: footY };

    // Arms - Keeping them out for balance in squat
    const lArm1 = { x1: 50, y1: 28 + yShift, x2: 35, y2: 30 + yShift };
    const lArm2 = { x1: 35, y1: 30 + yShift, x2: 20, y2: 30 + yShift };

    const rArm1 = { x1: 50, y1: 28 + yShift, x2: 65, y2: 30 + yShift };
    const rArm2 = { x1: 65, y1: 30 + yShift, x2: 80, y2: 30 + yShift };

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
                <line x1={bodyTop.x} y1={bodyTop.y} x2={bodyBottom.x} y2={bodyBottom.y} {...lineProps} />

                {/* Legs */}
                <line x1={lLeg1.x1} y1={lLeg1.y1} x2={lLeg1.x2} y2={lLeg1.y2} {...lineProps} />
                <line x1={lLeg2.x1} y1={lLeg2.y1} x2={lLeg2.x2} y2={lLeg2.y2} {...lineProps} />
                <line x1={rLeg1.x1} y1={rLeg1.y1} x2={rLeg1.x2} y2={rLeg1.y2} {...lineProps} />
                <line x1={rLeg2.x1} y1={rLeg2.y1} x2={rLeg2.x2} y2={rLeg2.y2} {...lineProps} />

                {/* Arms */}
                <line x1={lArm1.x1} y1={lArm1.y1} x2={lArm1.x2} y2={lArm1.y2} {...lineProps} />
                <line x1={lArm2.x1} y1={lArm2.y1} x2={lArm2.x2} y2={lArm2.y2} {...lineProps} />
                <line x1={rArm1.x1} y1={rArm1.y1} x2={rArm1.x2} y2={rArm1.y2} {...lineProps} />
                <line x1={rArm2.x1} y1={rArm2.y1} x2={rArm2.x2} y2={rArm2.y2} {...lineProps} />
            </svg>
        </div>
    );
};
