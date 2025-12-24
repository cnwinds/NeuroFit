import React, { useEffect, useState } from 'react';
import { GuideProps } from '../base/ActionBase';

export const SayHiGuide: React.FC<GuideProps> = ({ onReady }) => {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        onReady();
        const interval = setInterval(() => {
            setFrame(prev => (prev + 1) % 2);
        }, 600); // Slightly faster wave
        return () => clearInterval(interval);
    }, [onReady]);

    // --- Stick Figure Geometry Definition ---

    // Static Body Parts
    const head = { cx: 50, cy: 15, r: 6 };
    const body = { x1: 50, y1: 21, x2: 50, y2: 55 };
    const hips = { x: 50, y: 55 };

    // Legs (Standing Still)
    // Left Leg
    const lLeg1 = { x1: 50, y1: 55, x2: 42, y2: 75 }; // Thigh
    const lLeg2 = { x1: 42, y1: 75, x2: 40, y2: 95 }; // Calf
    // Right Leg
    const rLeg1 = { x1: 50, y1: 55, x2: 58, y2: 75 }; // Thigh
    const rLeg2 = { x1: 58, y1: 75, x2: 60, y2: 95 }; // Calf

    // Left Arm (Idle/Relaxed)
    const lArm1 = { x1: 50, y1: 28, x2: 40, y2: 38 }; // Upper
    const lArm2 = { x1: 40, y1: 38, x2: 38, y2: 55 }; // Forearm

    // Right Arm (Waving Animation)
    // Pivot at Shoulder (50, 28)

    // Frame 0: Wave Out (Arm extended up/right)
    const rArm1_f0 = { x1: 50, y1: 28, x2: 65, y2: 20 }; // Upper arm raised
    const rArm2_f0 = { x1: 65, y1: 20, x2: 75, y2: 5 };  // Forearm extending up

    // Frame 1: Wave In (Arm bent towards head)
    const rArm1_f1 = { x1: 50, y1: 28, x2: 62, y2: 22 }; // Upper arm slightly adjusted
    const rArm2_f1 = { x1: 62, y1: 22, x2: 50, y2: 10 }; // Forearm bent in towards head

    // Interpolation helpers could be added here for smoother anim, but toggle is fine for stick figure style
    const rArm1 = frame === 0 ? rArm1_f0 : rArm1_f1;
    const rArm2 = frame === 0 ? rArm2_f0 : rArm2_f1;

    // Common Style
    const strokeColor = "#2dd4bf"; // Teal-400
    const strokeWidth = 3;
    const lineProps = { stroke: strokeColor, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "transition-all duration-500 ease-in-out" };


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

                {/* Right Arm (Animated) */}
                <line x1={rArm1.x1} y1={rArm1.y1} x2={rArm1.x2} y2={rArm1.y2} {...lineProps} />
                <line x1={rArm2.x1} y1={rArm2.y1} x2={rArm2.x2} y2={rArm2.y2} {...lineProps} />

            </svg>
        </div>
    );
};
