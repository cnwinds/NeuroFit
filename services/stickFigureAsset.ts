// This file acts as the repository for the static "Stick Man" asset and Pre-baked Animations.

// 1. THE STATIC STANDING POSE (SVG Source)
const STICK_MAN_SVG_SOURCE = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur"/>
            <feFlood flood-color="#2dd4bf" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur"/>
            <feFlood flood-color="#fbbf24" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Deep Black Background -->
    <rect width="512" height="512" fill="#000000"/>
    
    <!-- Body Layer 1: The Glow (Teal) -->
    <g stroke="#2dd4bf" stroke-width="12" stroke-linecap="round" filter="url(#glow-teal)" opacity="0.9">
        <line x1="256" y1="140" x2="256" y2="290" /> <!-- Torso -->
        <line x1="256" y1="140" x2="176" y2="230" /> <!-- Left Arm -->
        <line x1="256" y1="140" x2="336" y2="230" /> <!-- Right Arm -->
        <line x1="256" y1="290" x2="211" y2="460" /> <!-- Left Leg -->
        <line x1="256" y1="290" x2="301" y2="460" /> <!-- Right Leg -->
    </g>

    <!-- Body Layer 2: The Core (White) -->
    <g stroke="#ffffff" stroke-width="4" stroke-linecap="round">
        <line x1="256" y1="140" x2="256" y2="290" />
        <line x1="256" y1="140" x2="176" y2="230" />
        <line x1="256" y1="140" x2="336" y2="230" />
        <line x1="256" y1="290" x2="211" y2="460" />
        <line x1="256" y1="290" x2="301" y2="460" />
    </g>

    <!-- Head Layer -->
    <circle cx="256" cy="90" r="28" fill="white" filter="url(#glow-gold)"/>
    <circle cx="256" cy="90" r="34" stroke="#fbbf24" stroke-width="3" fill="none"/>
</svg>
`.trim();

// 2. PRE-BAKED ANIMATIONS LIBRARY
// Stored as strings to be converted to Base64 Data URIs on demand.
const ANIMATIONS: Record<string, string> = {
    // --- JUMPING JACKS (开合跳) ---
    "jumping jack": `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur"/><feFlood flood-color="#2dd4bf" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur"/><feFlood flood-color="#fbbf24" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    </defs>
    <rect width="512" height="512" fill="#000000"/>
    <g stroke-linecap="round">
        <!-- Body -->
        <line x1="256" y1="140" x2="256" y2="290" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9" />
        <line x1="256" y1="140" x2="256" y2="290" stroke="#ffffff" stroke-width="4" />
        <!-- Arms -->
        <line x1="256" y1="140" x2="176" y2="230" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="176;80;176" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="230;60;230" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="176" y2="230" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="176;80;176" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="230;60;230" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="336" y2="230" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="336;432;336" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="230;60;230" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="336" y2="230" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="336;432;336" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y2" values="230;60;230" dur="0.8s" repeatCount="indefinite" /></line>
        <!-- Legs -->
        <line x1="256" y1="290" x2="211" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="211;140;211" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="290" x2="211" y2="460" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="211;140;211" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="290" x2="301" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="301;372;301" dur="0.8s" repeatCount="indefinite" /></line>
        <line x1="256" y1="290" x2="301" y2="460" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="301;372;301" dur="0.8s" repeatCount="indefinite" /></line>
    </g>
    <!-- Head -->
    <g><circle cx="256" cy="90" r="28" fill="white" filter="url(#glow-gold)"/><circle cx="256" cy="90" r="34" stroke="#fbbf24" stroke-width="3" fill="none"/><animateTransform attributeName="transform" type="translate" values="0,0; 0,-10; 0,0" dur="0.8s" repeatCount="indefinite" /></g>
</svg>`,
    "开合跳": "jumping jack",

    // --- SQUATS (深蹲) ---
    "squat": `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur"/><feFlood flood-color="#2dd4bf" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur"/><feFlood flood-color="#fbbf24" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
    </defs>
    <rect width="512" height="512" fill="#000000"/>
    <g stroke-linecap="round">
        <!-- Animation Group: Translates whole body down and up -->
        <g>
            <!-- Torso -->
            <line x1="256" y1="140" x2="256" y2="290" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9" />
            <line x1="256" y1="140" x2="256" y2="290" stroke="#ffffff" stroke-width="4" />
            <!-- Head -->
            <circle cx="256" cy="90" r="28" fill="white" filter="url(#glow-gold)"/>
            <circle cx="256" cy="90" r="34" stroke="#fbbf24" stroke-width="3" fill="none"/>
            <!-- Arms (Reaching forward) -->
            <line x1="256" y1="150" x2="196" y2="240" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="196;160;196" dur="2s" repeatCount="indefinite" /><animate attributeName="y2" values="240;220;240" dur="2s" repeatCount="indefinite" /></line>
            <line x1="256" y1="150" x2="196" y2="240" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="196;160;196" dur="2s" repeatCount="indefinite" /><animate attributeName="y2" values="240;220;240" dur="2s" repeatCount="indefinite" /></line>
            <line x1="256" y1="150" x2="316" y2="240" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="x2" values="316;352;316" dur="2s" repeatCount="indefinite" /><animate attributeName="y2" values="240;220;240" dur="2s" repeatCount="indefinite" /></line>
            <line x1="256" y1="150" x2="316" y2="240" stroke="#ffffff" stroke-width="4"><animate attributeName="x2" values="316;352;316" dur="2s" repeatCount="indefinite" /><animate attributeName="y2" values="240;220;240" dur="2s" repeatCount="indefinite" /></line>
            
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,80; 0,0" dur="2s" repeatCount="indefinite" />
        </g>
        
        <!-- Legs (Stationary feet, knees bend) -->
        <!-- Left Leg -->
        <!-- Upper Leg (Thigh) -->
        <line x1="256" y1="290" x2="220" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="y1" values="290;370;290" dur="2s" repeatCount="indefinite" />
             <animate attributeName="x2" values="220;180;220" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="290" x2="220" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="y1" values="290;370;290" dur="2s" repeatCount="indefinite" />
             <animate attributeName="x2" values="220;180;220" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
         <!-- Lower Leg (Shin) - Connected visually by endpoint animation match -->
        <line x1="220" y1="460" x2="220" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="x1" values="220;180;220" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y1" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="220" y1="460" x2="220" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="x1" values="220;180;220" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y1" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>

        <!-- Right Leg -->
        <line x1="256" y1="290" x2="292" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="y1" values="290;370;290" dur="2s" repeatCount="indefinite" />
             <animate attributeName="x2" values="292;332;292" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="290" x2="292" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="y1" values="290;370;290" dur="2s" repeatCount="indefinite" />
             <animate attributeName="x2" values="292;332;292" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
        <!-- Shin right -->
         <line x1="292" y1="460" x2="292" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="x1" values="292;332;292" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y1" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="292" y1="460" x2="292" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="x1" values="292;332;292" dur="2s" repeatCount="indefinite" />
             <animate attributeName="y1" values="460;370;460" dur="2s" repeatCount="indefinite" />
        </line>
    </g>
</svg>`,
    "深蹲": "squat",

    // --- HIGH KNEES (高抬腿) ---
    "high knees": `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="blur"/><feFlood flood-color="#2dd4bf" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15" result="blur"/><feFlood flood-color="#fbbf24" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="512" height="512" fill="#000000"/>
    <g stroke-linecap="round">
        <line x1="256" y1="140" x2="256" y2="290" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9" />
        <line x1="256" y1="140" x2="256" y2="290" stroke="#ffffff" stroke-width="4" />
        
        <!-- Arms (Running motion) -->
        <line x1="256" y1="140" x2="200" y2="250" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="y2" values="250;200;250" dur="0.6s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="200" y2="250" stroke="#ffffff" stroke-width="4"><animate attributeName="y2" values="250;200;250" dur="0.6s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="310" y2="250" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9"><animate attributeName="y2" values="200;250;200" dur="0.6s" repeatCount="indefinite" /></line>
        <line x1="256" y1="140" x2="310" y2="250" stroke="#ffffff" stroke-width="4"><animate attributeName="y2" values="200;250;200" dur="0.6s" repeatCount="indefinite" /></line>

        <!-- Left Leg (Lifts then drops) -->
        <line x1="256" y1="290" x2="230" y2="380" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
            <animate attributeName="y2" values="380;460;380" dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="x2" values="230;230;230" dur="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="290" x2="230" y2="380" stroke="#ffffff" stroke-width="4">
            <animate attributeName="y2" values="380;460;380" dur="0.6s" repeatCount="indefinite" />
        </line>
        <!-- Left Shin -->
        <line x1="230" y1="380" x2="230" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="y1" values="380;460;380" dur="0.6s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;460;460" dur="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="230" y1="380" x2="230" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="y1" values="380;460;380" dur="0.6s" repeatCount="indefinite" />
             <animate attributeName="y2" values="460;460;460" dur="0.6s" repeatCount="indefinite" />
        </line>

        <!-- Right Leg (Drops then lifts - offset) -->
        <line x1="256" y1="290" x2="280" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
            <animate attributeName="y2" values="460;380;460" dur="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="290" x2="280" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="y2" values="460;380;460" dur="0.6s" repeatCount="indefinite" />
        </line>
        <!-- Right Shin -->
        <line x1="280" y1="460" x2="280" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="y1" values="460;380;460" dur="0.6s" repeatCount="indefinite" />
        </line>
        <line x1="280" y1="460" x2="280" y2="460" stroke="#ffffff" stroke-width="4">
             <animate attributeName="y1" values="460;380;460" dur="0.6s" repeatCount="indefinite" />
        </line>
    </g>
    <g><circle cx="256" cy="90" r="28" fill="white" filter="url(#glow-gold)"/><circle cx="256" cy="90" r="34" stroke="#fbbf24" stroke-width="3" fill="none"/></g>
</svg>`,
    "高抬腿": "high knees",

    // --- SIDE STRETCH (站立侧伸展) ---
    "side stretch": `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <filter id="glow-teal" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="blur"/><feFlood flood-color="#2dd4bf" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="15" result="blur"/><feFlood flood-color="#fbbf24" result="color"/><feComposite in="color" in2="blur" operator="in" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="512" height="512" fill="#000000"/>
    <g stroke-linecap="round">
        <!-- Legs (Stationary wide stance) -->
        <line x1="256" y1="290" x2="220" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9" />
        <line x1="256" y1="290" x2="220" y2="460" stroke="#ffffff" stroke-width="4" />
        <line x1="256" y1="290" x2="292" y2="460" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9" />
        <line x1="256" y1="290" x2="292" y2="460" stroke="#ffffff" stroke-width="4" />
        
        <!-- Torso (Leans left and right) -->
        <line x1="256" y1="290" x2="256" y2="140" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="x2" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="290" x2="256" y2="140" stroke="#ffffff" stroke-width="4">
             <animate attributeName="x2" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
        </line>

        <!-- Head (Follows Torso) -->
        <g>
            <circle cx="256" cy="90" r="28" fill="white" filter="url(#glow-gold)">
                <animate attributeName="cx" values="256;210;256;300;256" dur="4s" repeatCount="indefinite" />
                <animate attributeName="cy" values="90;100;90;100;90" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="256" cy="90" r="34" stroke="#fbbf24" stroke-width="3" fill="none">
                <animate attributeName="cx" values="256;210;256;300;256" dur="4s" repeatCount="indefinite" />
                 <animate attributeName="cy" values="90;100;90;100;90" dur="4s" repeatCount="indefinite" />
            </circle>
        </g>
        
        <!-- Right Arm (Reaches Over) -->
        <line x1="256" y1="140" x2="256" y2="50" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="x1" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
             <animate attributeName="x2" values="256;150;256;350;256" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="140" x2="256" y2="50" stroke="#ffffff" stroke-width="4">
             <animate attributeName="x1" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
             <animate attributeName="x2" values="256;150;256;350;256" dur="4s" repeatCount="indefinite" />
        </line>

        <!-- Left Arm (On Hip) -->
        <line x1="256" y1="140" x2="220" y2="250" stroke="#2dd4bf" stroke-width="12" filter="url(#glow-teal)" opacity="0.9">
             <animate attributeName="x1" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
             <animate attributeName="x2" values="220;180;220;320;220" dur="4s" repeatCount="indefinite" />
        </line>
        <line x1="256" y1="140" x2="220" y2="250" stroke="#ffffff" stroke-width="4">
             <animate attributeName="x1" values="256;220;256;290;256" dur="4s" repeatCount="indefinite" />
             <animate attributeName="x2" values="220;180;220;320;220" dur="4s" repeatCount="indefinite" />
        </line>
    </g>
</svg>`,
    "站立侧伸展": "side stretch",
};


// Cache the result so we only rasterize once per session
let cachedPngBase64: string | null = null;

// This function converts our Static SVG Asset into a PNG Base64 string
// that the Gemini Vision API can understand.
export const getStickFigureBase64 = async (): Promise<string> => {
    // Return cached version if available
    if (cachedPngBase64) return cachedPngBase64;
    
    // Safety check for Server Side Rendering
    if (typeof document === 'undefined' || typeof Image === 'undefined') return '';

    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            // Create a Blob from our SVG string
            const svgBlob = new Blob([STICK_MAN_SVG_SOURCE], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 512;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    resolve(''); 
                    return;
                }

                // Ensure background is black (matches SVG, but good for safety)
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, 512, 512);
                
                // Draw the SVG onto the Canvas (Rasterization)
                ctx.drawImage(img, 0, 0);
                
                // Extract PNG Data
                const dataUrl = canvas.toDataURL('image/png');
                const base64 = dataUrl.split(',')[1];
                
                cachedPngBase64 = base64;
                
                // Cleanup memory
                URL.revokeObjectURL(url);
                resolve(base64);
            };

            img.onerror = (e) => {
                console.error("Failed to load Stick Figure Asset", e);
                resolve('');
            };

            img.src = url;
        } catch (e) {
            console.error("Error in asset generation", e);
            resolve('');
        }
    });
};

// Helper to check if we have a pre-baked animation for a given exercise
export const getPredefinedAnimation = (exerciseName: string): string | null => {
    const normalized = exerciseName.toLowerCase();
    
    // Check keys
    for (const key in ANIMATIONS) {
        if (normalized.includes(key)) {
            // Handle mapping (alias)
            let content = ANIMATIONS[key];
            
            // Resolve alias if needed (simple recursive lookup for 1 level)
            if (ANIMATIONS[content]) {
                content = ANIMATIONS[content];
            }
            
            // Convert SVG string to Data URI safely
            // We use unescape(encodeURIComponent(str)) to handle Unicode characters (like Chinese comments) in btoa
            return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(content)))}`;
        }
    }
    return null;
}

// --- DOWNLOAD HELPER ---
// Allows you to save the generated file to your local disk as 'stick-man.png'.
export const downloadStickFigure = async () => {
    if (typeof document === 'undefined') return;
    
    console.log("Generating stick-man.png from SVG source...");
    const base64 = await getStickFigureBase64();
    if (!base64) return;
    
    const link = document.createElement('a');
    link.download = 'stick-man.png';
    link.href = `data:image/png;base64,${base64}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("SUCCESS: 'stick-man.png' has been saved to your downloads folder.");
};

if (typeof window !== 'undefined') {
    (window as any).saveStickFigure = downloadStickFigure;
    console.log("NeuroFit Asset Manager: Run `window.saveStickFigure()` to download the reference image.");
}