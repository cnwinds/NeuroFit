/**
 * Audio Utilities Module
 * 
 * 提供反馈音效的缓存与播放功能
 * 核心节拍功能已迁移到 beats/audioEngine.ts
 */

// ============================================================================
// 音效缓存系统
// ============================================================================

const feedbackBufferCache: Map<string, AudioBuffer> = new Map();

/**
 * 预生成所有反馈音效的缓存
 */
export async function pregenerateFeedbackBuffers(ctx: AudioContext): Promise<void> {
  const sounds = ['excellent', 'good', 'bad', 'miss', 'beep_low', 'beep_high'];

  for (const sound of sounds) {
    if (feedbackBufferCache.has(sound)) continue;

    // 使用 OfflineAudioContext 进行离线渲染，提高性能
    const offlineCtx = new OfflineAudioContext(1, ctx.sampleRate * 0.5, ctx.sampleRate);

    switch (sound) {
      case 'excellent': renderExcellent(offlineCtx); break;
      case 'good': renderGood(offlineCtx); break;
      case 'bad': renderBad(offlineCtx); break;
      case 'miss': renderMiss(offlineCtx); break;
      case 'beep_low': renderTone(offlineCtx, 440, 0.1, 'square'); break;
      case 'beep_high': renderTone(offlineCtx, 880, 0.1, 'square'); break;
    }

    const renderedBuffer = await offlineCtx.startRendering();
    feedbackBufferCache.set(sound, renderedBuffer);
  }
}

/**
 * 离线渲染通用的单音调
 */
function renderTone(ctx: OfflineAudioContext, freq: number, duration: number, type: OscillatorType): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, 0);
  gain.gain.setValueAtTime(0.1, 0);
  gain.gain.exponentialRampToValueAtTime(0.001, duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(duration);
}

/**
 * 离线渲染 Excellent 音效
 */
function renderExcellent(ctx: OfflineAudioContext): void {
  const frequencies = [659.25, 783.99, 987.77, 1318.51];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = i * 0.03;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.15, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

/**
 * 离线渲染 Good 音效
 */
function renderGood(ctx: OfflineAudioContext): void {
  const frequencies = [523.25, 659.25, 783.99];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = i * 0.04;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

/**
 * 离线渲染 Bad 音效
 */
function renderBad(ctx: OfflineAudioContext): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, 0);
  osc.frequency.exponentialRampToValueAtTime(180, 0.2);
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(0.08, 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.35);
}

/**
 * 离线渲染 Miss 音效
 */
function renderMiss(ctx: OfflineAudioContext): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(110, 0);
  osc.frequency.exponentialRampToValueAtTime(80, 0.15);
  gain.gain.setValueAtTime(0, 0);
  gain.gain.linearRampToValueAtTime(0.06, 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, 0.25);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(0.3);
}

/**
 * 播放缓存的音效
 */
function playCachedEffect(ctx: AudioContext, name: string): void {
  const buffer = feedbackBufferCache.get(name);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

/**
 * 播放倒计时提示音
 */
export function playCountdownBeep(ctx: AudioContext, isFinal: boolean = false): void {
  if (ctx.state !== 'running') return;
  const name = isFinal ? 'beep_high' : 'beep_low';
  if (feedbackBufferCache.has(name)) {
    playCachedEffect(ctx, name);
  }
}

/**
 * 播放成功音效
 */
export function playSuccessSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  if (feedbackBufferCache.has('good')) {
    playCachedEffect(ctx, 'good');
  }
}

/**
 * 播放EXCELLENT评分音效
 */
export function playExcellentSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  if (feedbackBufferCache.has('excellent')) {
    playCachedEffect(ctx, 'excellent');
  }
}

/**
 * 播放GOOD评分音效
 */
export function playGoodSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  if (feedbackBufferCache.has('good')) {
    playCachedEffect(ctx, 'good');
  }
}

/**
 * 播放BAD评分音效
 */
export function playBadSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  if (feedbackBufferCache.has('bad')) {
    playCachedEffect(ctx, 'bad');
  }
}

/**
 * 播放MISS评分音效
 */
export function playMissSound(ctx: AudioContext): void {
  if (ctx.state !== 'running') return;
  if (feedbackBufferCache.has('miss')) {
    playCachedEffect(ctx, 'miss');
  }
}
