// Decodes Base64 string to raw bytes
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM data to an AudioBuffer
export async function decodeAudioData(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const bytes = decode(base64Data);
  const numChannels = 1;
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function playTone(ctx: AudioContext, freq: number = 440, duration: number = 0.1, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playCountdownBeep(ctx: AudioContext, isFinal: boolean = false) {
    const freq = isFinal ? 880 : 440; 
    playTone(ctx, freq, 0.15, 'square');
}

export function playSuccessSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    
    const startTime = now + i * 0.05;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

// --- ADVANCED DRUM SYNTHESIS ---

// Cache noise buffer to avoid performance hit
let noiseBuffer: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
    return noiseBuffer;
  }
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

// High Energy "DONG-CI-DA-CI" Synthesizer
// Optimized for 8Hz (125ms intervals).
// DONG and DA are tightened to allow CI to be heard.
// Performance optimized for mobile devices
export function playDrumStep(ctx: AudioContext, step: number) {
    // 优化：检查音频上下文状态，避免在暂停状态下创建节点
    if (ctx.state !== 'running') {
        return;
    }
    
    const t = ctx.currentTime;
    
    // Master Gain for this hit (prevents clipping)
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.8; // 稍微降低音量以减少CPU负担
    masterGain.connect(ctx.destination);

    // --- DONG (Kick) - Step 0 ---
    // Deep, punchy sine sweep with click transient
    // DECAY: STRICTLY < 100ms
    if (step === 0) {
        // 1. Body (Sub Freq Sweep)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(150, t); // Start high for "thwack"
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08); // Drop deep fast

        gain.gain.setValueAtTime(1.2, t); 
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08); // Cutoff at 80ms
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        osc.start(t);
        osc.stop(t + 0.08);

        // 2. Click (Transient Attack)
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'square';
        click.frequency.setValueAtTime(1000, t);
        clickGain.gain.setValueAtTime(0.3, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
        
        click.connect(clickGain);
        clickGain.connect(masterGain);
        click.start(t);
        click.stop(t + 0.01);
    } 
    
    // --- DA (Snare) - Step 2 ---
    // Punchy Tone + White Noise Burst
    // DECAY: STRICTLY < 100ms
    else if (step === 2) {
        // 1. Tone (Body)
        const toneOsc = ctx.createOscillator();
        const toneGain = ctx.createGain();
        toneOsc.type = 'triangle';
        toneOsc.frequency.setValueAtTime(200, t); // Slightly lower for more body
        toneGain.gain.setValueAtTime(0.8, t);
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08); // Cutoff at 80ms
        toneOsc.connect(toneGain);
        toneGain.connect(masterGain);
        toneOsc.start(t);
        toneOsc.stop(t + 0.08);

        // 2. Noise (Snap)
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000; 
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t); 
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09); 
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.09);
    } 
    
    // --- CI (Hi-Hat) - Step 1 & 3 ---
    // Ultra-short High Frequency Noise
    // BOOSTED VOLUME significantly to be heard between beats
    else {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        // Increased frequency for sharper "Tss"
        noiseFilter.frequency.value = 7000; 
        
        const noiseGain = ctx.createGain();
        // BOOSTED from 0.25 to 0.6
        noiseGain.gain.setValueAtTime(0.6, t); 
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04); // 40ms decay
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        noise.start(t);
        noise.stop(t + 0.04);
    }
}