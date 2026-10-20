/**
 * Web Audio API procedural sound engine for CREDITVERSE.
 * Generates crisp anime, magic, arcade, and coin sounds directly in the browser.
 */

let audioCtx: AudioContext | null = null;
let isMuted = false;

// Check localStorage for mute preference
try {
  const savedMute = localStorage.getItem('creditverse_sound_muted');
  if (savedMute !== null) {
    isMuted = savedMute === 'true';
  }
} catch {
  // Ignore localStorage errors
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  try {
    localStorage.setItem('creditverse_sound_muted', String(isMuted));
  } catch {
    // Ignore
  }
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

/**
 * Procedural coin / credit earned ping.
 */
export function playCoinSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  // Pitch-varied high dual chime
  const baseFreq = 987.77; // B5
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

  osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
  osc2.frequency.exponentialRampToValueAtTime(1975.53, now + 0.08); // B6

  gainNode.gain.setValueAtTime(0.12, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.28);
  osc2.stop(now + 0.28);
}

/**
 * Level-up grand fanfare.
 */
export function playLevelUpSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major arpeggio

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0.15, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.45);
  });
}

/**
 * Shadow blade slash effect.
 */
export function playSlashSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(620, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.14);
}

/**
 * Hit impact crunch.
 */
export function playHitSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * Magical chime for potion/spell success.
 */
export function playMagicChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.06);

    gain.gain.setValueAtTime(0.12, now + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.06);
    osc.stop(now + i * 0.06 + 0.36);
  });
}

/**
 * Companion happy chirp.
 */
export function playCompanionChirp() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.linearRampToValueAtTime(1400, now + 0.07);
  osc.frequency.linearRampToValueAtTime(1100, now + 0.14);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * Defeat tone.
 */
export function playDefeatSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(85, now + 0.4);

  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.42);
}

/**
 * UI tap.
 */
export function playClickSound() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}
