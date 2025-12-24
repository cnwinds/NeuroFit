import { getStickFigureBase64, getPredefinedAnimation } from "./stickFigureAsset";

// Generates 4 frames to simulate a smooth loop
// OR returns the static asset if useStaticOnly is true
export const generateStickFigureAnimation = async (exerciseName: string, useStaticOnly: boolean = false): Promise<string[]> => {

    // 1. Check for Predefined Animated SVG (High Priority, Best Quality)
    // If we have a hand-crafted SVG animation for this exercise, use it!
    const predefined = getPredefinedAnimation(exerciseName);
    if (predefined) {
        // Return as a single frame. The SVG itself contains SMIL animations (<animate>),
        // so the browser will handle the looping automatically.
        return [predefined];
    }

    // 2. Fallback to static "Stick Man" reference image.
    const refImageBase64 = await getStickFigureBase64();
    return [`data:image/png;base64,${refImageBase64}`];
}
