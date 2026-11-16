import { ref } from 'vue';
import { useTheme } from './useTheme';

export type SoundName =
  | 'hover'
  | 'click'
  | 'loading'
  | 'select'
  | 'close'
  | 'toggle'
  | 'nav'
  | 'decrypt'
  | 'unlock'
  | 'download'
  | 'lang'
  | 'theme'
  | 'gamepad'
  | 'decline'
  | 'cert'
  | 'timeline'
  | 'search'
  | 'link'
  | 'carousel'
  | 'expand'
  | 'page'
  | 'zoom'
  | 'tetris_move'
  | 'tetris_rotate'
  | 'tetris_lock'
  | 'tetris_drop'
  | 'tetris_clear'
  | 'tetris_4lines'
  | 'tetris_levelup';

const isMuted = ref<boolean>(
  typeof window !== 'undefined' ? localStorage.getItem('sfx-muted') === 'true' : false
);
const isMusicPlaying = ref<boolean>(false);

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!CtxClass) return null;
    audioCtx = new CtxClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.38;
    masterGain.connect(audioCtx.destination);

    const resume = () => {
      if (audioCtx?.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    };
    ['click', 'keydown', 'pointerdown'].forEach((evt) =>
      document.addEventListener(evt, resume, { once: true, capture: true })
    );
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function createNoise(c: AudioContext, duration: number, decay = 0.3): AudioBuffer {
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decay));
  }
  return buf;
}

function createDistort(c: AudioContext, amount = 180): WaveShaperNode {
  const ws = c.createWaveShaper();
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  ws.curve = curve;
  ws.oversample = '4x';
  return ws;
}

function connectChain(master: AudioNode, ...nodes: AudioNode[]) {
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].connect(nodes[i + 1]);
  }
  nodes[nodes.length - 1].connect(master);
}

type SoundGen = (
  c: AudioContext,
  ch: (...nodes: AudioNode[]) => void,
  ns: (c: AudioContext, dur: number, dec?: number) => AudioBuffer,
  ds: (c: AudioContext, amt?: number) => WaveShaperNode
) => void;

/**
 * TURQUOISE MODE ('core') — Modern Sci-Fi / Cyber Telemetry Audio Bank
 */
const cyberSounds: Record<string, SoundGen> = {
  hover(c, ch, ns) {
    const t = c.currentTime;
    const s1 = c.createBufferSource();
    s1.buffer = ns(c, 0.012, 0.08);
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 4000;
    const g1 = c.createGain();
    g1.gain.setValueAtTime(0.18, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    ch(s1, hpf, g1);
    s1.start(t);

    const osc = c.createOscillator();
    const g2 = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t + 0.005);
    osc.frequency.linearRampToValueAtTime(1000, t + 0.055);
    g2.gain.setValueAtTime(0.045, t + 0.005);
    g2.gain.linearRampToValueAtTime(0, t + 0.07);
    ch(osc, g2);
    osc.start(t + 0.005);
    osc.stop(t + 0.08);
  },
  click(c, ch, ns) {
    const t = c.currentTime;
    const sub = c.createOscillator();
    const gs = c.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.055);
    gs.gain.setValueAtTime(0.32, t);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    ch(sub, gs);
    sub.start(t);
    sub.stop(t + 0.065);

    const s1 = c.createBufferSource();
    s1.buffer = ns(c, 0.03, 0.1);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 2800;
    bpf.Q.value = 1.2;
    const g1 = c.createGain();
    g1.gain.setValueAtTime(0.45, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    ch(s1, bpf, g1);
    s1.start(t);
  },
  select(c, ch) {
    const t = c.currentTime;
    [
      [880, 0],
      [1320, 0.08],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0, t + delay);
      g.gain.linearRampToValueAtTime(0.14, t + delay + 0.004);
      g.gain.setValueAtTime(0.14, t + delay + 0.035);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.055);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.065);
    });
  },
  close(c, ch) {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const lpf = c.createBiquadFilter();
    const g1 = c.createGain();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(1800, t);
    lpf.frequency.exponentialRampToValueAtTime(200, t + 0.18);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    g1.gain.setValueAtTime(0.12, t);
    g1.gain.linearRampToValueAtTime(0, t + 0.2);
    ch(osc, lpf, g1);
    osc.start(t);
    osc.stop(t + 0.22);
  },
  toggle(c, ch, ns, ds) {
    const t = c.currentTime;
    const s1 = c.createBufferSource();
    s1.buffer = ns(c, 0.018, 0.1);
    const d1 = ds(c, 120);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1600;
    bpf.Q.value = 1.5;
    const g1 = c.createGain();
    g1.gain.setValueAtTime(0.3, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
    ch(s1, d1, bpf, g1);
    s1.start(t);
  },
  nav(c, ch, ns) {
    const t = c.currentTime;
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.14, 0.35);
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(300, t);
    lpf.frequency.exponentialRampToValueAtTime(80, t + 0.14);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.22, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    ch(sn, lpf, gn);
    sn.start(t);
  },
  decrypt(c, ch, ns, ds) {
    const t = c.currentTime;
    const o1 = c.createOscillator();
    const d1 = ds(c, 250);
    const g1 = c.createGain();
    o1.type = 'square';
    o1.frequency.setValueAtTime(110, t);
    o1.frequency.linearRampToValueAtTime(440, t + 0.09);
    g1.gain.setValueAtTime(0.12, t);
    g1.gain.linearRampToValueAtTime(0, t + 0.1);
    ch(o1, d1, g1);
    o1.start(t);
    o1.stop(t + 0.11);

    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.28, 0.5);
    const bpf2 = c.createBiquadFilter();
    bpf2.type = 'bandpass';
    bpf2.frequency.value = 2000;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.16, t);
    gn.gain.linearRampToValueAtTime(0, t + 0.28);
    ch(sn, bpf2, gn);
    sn.start(t);
  },
  unlock(c, ch) {
    const t = c.currentTime;
    [
      [440, 0],
      [554, 0.075],
      [659, 0.15],
      [880, 0.225],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0, t + delay);
      g.gain.linearRampToValueAtTime(0.12, t + delay + 0.006);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.09);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.1);
    });
  },
  download(c, ch) {
    const t = c.currentTime;
    [
      [440, 0],
      [660, 0.12],
      [880, 0.24],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.07, t + delay);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.048);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.055);
    });
  },
  lang(c, ch) {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1100;
    g.gain.setValueAtTime(0.1, t);
    g.gain.linearRampToValueAtTime(0.0, t + 0.12);
    ch(osc, g);
    osc.start(t);
    osc.stop(t + 0.13);
  },
  theme(c, ch) {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g1 = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.28);
    g1.gain.setValueAtTime(0.11, t);
    g1.gain.linearRampToValueAtTime(0.0, t + 0.3);
    ch(osc, g1);
    osc.start(t);
    osc.stop(t + 0.32);
  },
  gamepad(c, ch) {
    const t = c.currentTime;
    [
      [523, 0],
      [659, 0.07],
      [784, 0.14],
      [1047, 0.21],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.1, t + delay);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.065);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.075);
    });
  },
  decline(c, ch) {
    const t = c.currentTime;
    [
      [440, 0],
      [330, 0.08],
      [220, 0.16],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.09, t + delay);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.07);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
  },
  search(c, ch) {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g1 = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.09);
    g1.gain.setValueAtTime(0.08, t);
    g1.gain.linearRampToValueAtTime(0.0, t + 0.1);
    ch(osc, g1);
    osc.start(t);
    osc.stop(t + 0.11);
  },
  tetris_move(c, ch, ns) {
    const t = c.currentTime;
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.006, 0.04);
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 5500;
    const g = c.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.007);
    ch(sn, hpf, g);
    sn.start(t);
  },
  tetris_rotate(c, ch) {
    const t = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.045);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.065, t + 0.006);
    g.gain.linearRampToValueAtTime(0.0, t + 0.052);
    ch(osc, g);
    osc.start(t);
    osc.stop(t + 0.06);
  },
  tetris_lock(c, ch, ns) {
    const t = c.currentTime;
    const sub = c.createOscillator();
    const gs = c.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(42, t + 0.07);
    gs.gain.setValueAtTime(0.28, t);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ch(sub, gs);
    sub.start(t);
    sub.stop(t + 0.09);
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.03, 0.12);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 2000;
    bpf.Q.value = 1.5;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.18, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    ch(sn, bpf, gn);
    sn.start(t);
  },
  tetris_drop(c, ch, ns) {
    const t = c.currentTime;
    const sub = c.createOscillator();
    const gs = c.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(200, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.09);
    gs.gain.setValueAtTime(0.38, t);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    ch(sub, gs);
    sub.start(t);
    sub.stop(t + 0.11);
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.08, 0.2);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 700;
    bpf.Q.value = 1.0;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.25, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    ch(sn, bpf, gn);
    sn.start(t);
  },
  tetris_clear(c, ch, ns) {
    const t = c.currentTime;
    [
      [349, 0],
      [440, 0.055],
      [523, 0.11],
      [659, 0.165],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0, t + delay);
      g.gain.linearRampToValueAtTime(0.085, t + delay + 0.006);
      g.gain.setValueAtTime(0.085, t + delay + 0.04);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.068);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.22, 0.45);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 2800;
    bpf.Q.value = 2;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.09, t);
    gn.gain.linearRampToValueAtTime(0.0, t + 0.22);
    ch(sn, bpf, gn);
    sn.start(t);
  },
  tetris_4lines(c, ch, ns) {
    const t = c.currentTime;
    [
      [440, 0],
      [554, 0.05],
      [659, 0.1],
      [880, 0.15],
      [1100, 0.22],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0, t + delay);
      g.gain.linearRampToValueAtTime(0.13, t + delay + 0.007);
      g.gain.setValueAtTime(0.13, t + delay + 0.1);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.25);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.27);
    });
    const sub = c.createOscillator();
    const gs = c.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(75, t + 0.18);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.42);
    gs.gain.setValueAtTime(0.38, t + 0.18);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
    ch(sub, gs);
    sub.start(t + 0.18);
    sub.stop(t + 0.48);
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.5, 0.38);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1800;
    bpf.Q.value = 1;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.14, t);
    gn.gain.linearRampToValueAtTime(0.0, t + 0.5);
    ch(sn, bpf, gn);
    sn.start(t);
  },
  tetris_levelup(c, ch) {
    const t = c.currentTime;
    [
      [523, 0],
      [659, 0.065],
      [784, 0.13],
      [1047, 0.195],
      [1319, 0.27],
    ].forEach(([freq, delay]) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0, t + delay);
      g.gain.linearRampToValueAtTime(0.1, t + delay + 0.005);
      g.gain.setValueAtTime(0.1, t + delay + 0.046);
      g.gain.linearRampToValueAtTime(0.0, t + delay + 0.068);
      ch(osc, g);
      osc.start(t + delay);
      osc.stop(t + delay + 0.08);
    });
  },
};

/**
 * PURPLE ELDEN RING MODE ('void') — Resonant Arcane / Classical RPG Menu Audio Bank
 * Warm, organic, metallic & parchment chimes inspired by Elden Ring menu navigation.
 */
function playEldenChime(
  c: AudioContext,
  ch: (...nodes: AudioNode[]) => void,
  frequencies: number[],
  duration = 0.35,
  peakGain = 0.08,
  stagger = 0.03
) {
  const t = c.currentTime;
  frequencies.forEach((freq, idx) => {
    const start = t + idx * stagger;
    const osc = c.createOscillator();
    const lpf = c.createBiquadFilter();
    const g = c.createGain();

    osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, start);

    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(freq * 2.5, start);
    lpf.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 0.8), start + duration);

    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peakGain / (1 + idx * 0.35), start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    ch(osc, lpf, g);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  });
}

const eldenSounds: Record<string, SoundGen> = {
  hover(c, ch) {
    // Subtle parchment/silver cursor tick (A3 + E4 soft fifth)
    playEldenChime(c, ch, [220, 329.63], 0.12, 0.04, 0.01);
  },
  click(c, ch, ns) {
    // Deep stone & bronze menu select (D3 + A3 + F#4)
    const t = c.currentTime;
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.04, 0.15);
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 650;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.14, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    ch(sn, lpf, gn);
    sn.start(t);

    playEldenChime(c, ch, [146.83, 220, 369.99], 0.32, 0.09, 0.015);
  },
  select(c, ch) {
    playEldenChime(c, ch, [293.66, 440, 587.33], 0.38, 0.09, 0.025);
  },
  close(c, ch) {
    // Descending warm resolution (E4 -> B3 -> E3)
    playEldenChime(c, ch, [329.63, 246.94, 164.81], 0.34, 0.08, 0.04);
  },
  toggle(c, ch) {
    // Inventory tab / drawer resonance (E3 + B3 + E4)
    playEldenChime(c, ch, [164.81, 246.94, 329.63], 0.26, 0.075, 0.02);
  },
  nav(c, ch, ns) {
    // Page turn / parchment slide + low chime
    const t = c.currentTime;
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.12, 0.25);
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 520;
    bpf.Q.value = 1.4;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.12, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    ch(sn, bpf, gn);
    sn.start(t);

    playEldenChime(c, ch, [196, 293.66], 0.24, 0.06, 0.02);
  },
  decrypt(c, ch) {
    playEldenChime(c, ch, [146.83, 220, 293.66, 440], 0.55, 0.09, 0.05);
  },
  unlock(c, ch) {
    // Site of Grace / Rune discovered harmonic chord
    playEldenChime(c, ch, [220, 277.18, 329.63, 440, 659.25], 0.75, 0.1, 0.055);
  },
  download(c, ch) {
    playEldenChime(c, ch, [261.63, 329.63, 392.0, 523.25], 0.5, 0.085, 0.04);
  },
  lang(c, ch) {
    playEldenChime(c, ch, [329.63, 493.88], 0.25, 0.07, 0.03);
  },
  theme(c, ch) {
    // Majestic Elden Ring Realm Shift chord (D minor / Dorian fifths resonance)
    playEldenChime(c, ch, [110, 164.81, 220, 329.63, 493.88, 659.25], 0.85, 0.11, 0.045);
  },
  gamepad(c, ch) {
    playEldenChime(c, ch, [220, 329.63, 440, 659.25], 0.48, 0.09, 0.04);
  },
  decline(c, ch) {
    playEldenChime(c, ch, [246.94, 196.0, 146.83], 0.36, 0.075, 0.045);
  },
  search(c, ch) {
    playEldenChime(c, ch, [392.0, 587.33], 0.14, 0.04, 0.015);
  },
  cert(c, ch) {
    playEldenChime(c, ch, [246.94, 369.99, 493.88], 0.45, 0.085, 0.035);
  },
  timeline(c, ch) {
    playEldenChime(c, ch, [196.0, 293.66, 392.0], 0.35, 0.08, 0.03);
  },
  carousel(c, ch) {
    playEldenChime(c, ch, [220, 329.63], 0.2, 0.06, 0.02);
  },
  expand(c, ch) {
    playEldenChime(c, ch, [174.61, 261.63, 349.23], 0.28, 0.07, 0.025);
  },
  page(c, ch) {
    playEldenChime(c, ch, [261.63, 392.0], 0.22, 0.065, 0.02);
  },
  zoom(c, ch) {
    playEldenChime(c, ch, [293.66, 440], 0.18, 0.055, 0.015);
  },
  tetris_move(c, ch) {
    playEldenChime(c, ch, [261.63], 0.06, 0.035, 0.01);
  },
  tetris_rotate(c, ch) {
    playEldenChime(c, ch, [329.63, 493.88], 0.1, 0.045, 0.015);
  },
  tetris_lock(c, ch, ns) {
    const t = c.currentTime;
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.035, 0.12);
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 500;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.14, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    ch(sn, lpf, gn);
    sn.start(t);
    playEldenChime(c, ch, [146.83, 220], 0.16, 0.06, 0.015);
  },
  tetris_drop(c, ch, ns) {
    const t = c.currentTime;
    const sub = c.createOscillator();
    const gs = c.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(32, t + 0.11);
    gs.gain.setValueAtTime(0.28, t);
    gs.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    ch(sub, gs);
    sub.start(t);
    sub.stop(t + 0.13);
    const sn = c.createBufferSource();
    sn.buffer = ns(c, 0.07, 0.18);
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 600;
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.18, t);
    gn.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ch(sn, lpf, gn);
    sn.start(t);
    playEldenChime(c, ch, [110, 164.81, 220], 0.24, 0.065, 0.015);
  },
  tetris_clear(c, ch) {
    playEldenChime(c, ch, [293.66, 369.99, 440, 587.33], 0.36, 0.085, 0.045);
  },
  tetris_4lines(c, ch) {
    playEldenChime(c, ch, [146.83, 220, 293.66, 369.99, 440, 587.33, 880], 0.75, 0.11, 0.045);
  },
  tetris_levelup(c, ch) {
    playEldenChime(c, ch, [261.63, 329.63, 392.0, 523.25, 659.25], 0.55, 0.095, 0.05);
  },
};

export function useSfx() {
  const { realm } = useTheme();

  function play(name: SoundName) {
    if (isMuted.value) return;
    try {
      const c = getCtx();
      if (!c || !masterGain) return;
      const ch = (...nodes: AudioNode[]) => connectChain(masterGain!, ...nodes);
      const activeBank = realm.value === 'void' ? eldenSounds : cyberSounds;
      const fn = activeBank[name] ?? cyberSounds[name] ?? activeBank.click ?? cyberSounds.click;
      fn(c, ch, createNoise, createDistort);
    } catch {
      // Ignore autoplay errors
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sfx-muted', String(isMuted.value));
    }
    if (!isMuted.value) {
      play('select');
    }
  }

  return {
    muted: isMuted,
    musicPlaying: isMusicPlaying,
    play,
    toggleMute,
    getCtx,
  };
}
