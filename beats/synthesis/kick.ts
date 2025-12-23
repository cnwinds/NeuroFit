/**
 * Kick 鼓合成器
 * 808 风格低音鼓：厚重、长余音，突出低频持续
 */

import { BaseDrumSynthesizer } from './base';
import { DrumSynthesisParams } from '../types';

export class KickSynthesizer extends BaseDrumSynthesizer {
  synthesize(params: DrumSynthesisParams): Float32Array {
    const { sampleRate, duration, velocity } = params;
    // Default to a punchy, heavy kick duration
    const actualDuration = duration || 0.4;

    const samples = Math.ceil(sampleRate * actualDuration);
    const data = new Float32Array(samples);

    // Velocity factor
    const velocityFactor = this.applyVelocity(1.0, velocity);

    // Generate noise for the "click" / attack
    const noise = this.generatePinkNoise(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;

      // 1. Frequency Envelope (Pitch Drop) - The "Punch"
      // Start high (~150Hz) and drop quickly to the fundamental (~45Hz)
      // This rapid drop creates the "thud" impact
      const freqDecay = Math.exp(-t * 25);
      const currentFreq = 45 + 105 * freqDecay;

      // 2. Amplitude Envelopes
      // Body envelope: fast attack, moderate decay
      const attack = t < 0.005 ? t / 0.005 : 1.0;
      const decay = Math.exp(-t * 6.0); // Controls the length of the "boom"
      const amplitude = attack * decay * velocityFactor;

      // 3. Main Oscillator (The Body)
      // Using a sine wave with the sweeping frequency
      // We integrate frequency to get phase: phase = 2 * pi * integral(f(t) dt)
      // Integral of (base + range * exp(-kt)) is (base*t - (range/k)*exp(-kt))
      // Simplified phase approximation for the sweep:
      const phase = 2 * Math.PI * (45 * t - (105 / 25) * Math.exp(-25 * t));

      // Main fundamental tone (Heavy low end)
      let signal = Math.sin(phase);

      // Add a bit of 2nd harmonic for "wood/beater" character, blending out quickly
      signal += 0.5 * Math.sin(phase * 2) * Math.exp(-t * 20);

      // Soft saturation/clipping to make it "heavy" and "thick"
      // This simulates overdriving a drum machine or recording to tape
      signal = Math.tanh(signal * 1.5);

      // 4. Transform Transient ("Click")
      // A burst of noise at the very beginning to simulate the beater hitting the skin
      if (t < 0.02) {
        const clickEnv = (1 - t / 0.02);
        // High-pass the noise slightly for clarity
        const clickNoise = noise[i] * clickEnv * 0.5 * (velocity / 127);
        signal += clickNoise;
      }

      // 5. Sub-bass reinforcement (The "Weight")
      // Adding a very low sine wave that sustains slightly longer for the "heavy" feeling
      const subEnv = attack * Math.exp(-t * 3.0);
      signal += 0.4 * Math.sin(2 * Math.PI * 40 * t) * subEnv;

      data[i] = signal * amplitude;
    }

    // Slight compression/limiting at the end
    this.normalize(data);

    return data;
  }
}

