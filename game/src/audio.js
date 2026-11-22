// Synthesised sound — no audio files. Everything is a few oscillators
// through one gain node, built lazily on the player's first gesture so a
// browser never complains about autoplay. M mutes it all.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

export const sfx = {
  click() {
    tone(660, 0.06, 'square', 0.06);
  },
  loot() {
    tone(880, 0.09, 'sine', 0.1);
    tone(1318, 0.12, 'sine', 0.1, 0.08);
  },
  vault() {
    tone(220, 0.12, 'triangle', 0.14);
    tone(330, 0.12, 'triangle', 0.14, 0.1);
    tone(440, 0.2, 'triangle', 0.14, 0.2);
    tone(660, 0.3, 'sine', 0.12, 0.3);
  },
  spotted() {
    tone(520, 0.16, 'sawtooth', 0.12, 0, 780);
    tone(780, 0.2, 'sawtooth', 0.1, 0.12, 1040);
  },
  alarm() {
    tone(440, 0.14, 'square', 0.07);
    tone(440, 0.14, 'square', 0.07, 0.18);
  },
  coin() {
    tone(1568, 0.07, 'sine', 0.09);
    tone(2093, 0.1, 'sine', 0.07, 0.05);
  },
  smoke() {
    tone(300, 0.4, 'sine', 0.06, 0, 120);
  },
  cut() {
    tone(1800, 0.05, 'square', 0.06);
    tone(900, 0.08, 'square', 0.06, 0.06);
  },
  lockdown() {
    tone(196, 0.3, 'sawtooth', 0.14);
    tone(196, 0.3, 'sawtooth', 0.14, 0.35);
    tone(147, 0.5, 'sawtooth', 0.14, 0.7);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.13));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.16));
  },
};
