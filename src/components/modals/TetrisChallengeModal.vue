<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { X } from 'lucide-vue-next';
import type { TetrisRankingEntry } from '../../types/portfolio';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const COLS = 10;
const ROWS = 20;
const BLOCK = 24;
const MINI_D = 20;
const MINI_M = 16;
const STORAGE_KEY = 'tetris-rankings';
const MAX_RANK = 10;
const TUTORIAL_K = 'tetris-tutorial-seen';
const PLAYER = 'RECRUTA';

interface PieceDef {
  id: string;
  shape: number[][];
  block: string;
}

interface ActivePiece extends PieceDef {
  x: number;
  y: number;
}

const PIECES: PieceDef[] = [
  { id: 'I', shape: [[1, 1, 1, 1]], block: '🟦' },
  { id: 'O', shape: [[1, 1], [1, 1]], block: '🟨' },
  { id: 'T', shape: [[0, 1, 0], [1, 1, 1]], block: '🟪' },
  { id: 'J', shape: [[1, 0, 0], [1, 1, 1]], block: '🟧' },
  { id: 'L', shape: [[0, 0, 1], [1, 1, 1]], block: '🟫' },
  { id: 'S', shape: [[0, 1, 1], [1, 1, 0]], block: '🟩' },
  { id: 'Z', shape: [[1, 1, 0], [0, 1, 1]], block: '🟥' },
];

const LINE_PTS = [0, 100, 300, 500, 800];
const COMBO_BONUS = 50;
const SOFT_PTS = 1;
const HARD_PTS = 2;
const MEDALS = ['🥇', '🥈', '🥉'];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const holdCanvasDRef = ref<HTMLCanvasElement | null>(null);
const nextCanvasDRef = ref<HTMLCanvasElement | null>(null);
const holdCanvasMRef = ref<HTMLCanvasElement | null>(null);
const nextCanvasMRef = ref<HTMLCanvasElement | null>(null);

const score = ref(0);
const lines = ref(0);
const level = ref(1);
const combo = ref(0);
const bestScore = ref(0);
const isHoldLocked = ref(false);
const isPaused = ref(false);
const isOver = ref(true);
const hasStartedOnce = ref(false);
const lastRankPos = ref<number | null>(null);
const feedbackMessage = ref('');
const rankings = ref<TetrisRankingEntry[]>([]);
const showTutorial = ref(false);
const canvasScale = ref(1);
const pressedBtn = ref<string | null>(null);

const musicOn = ref<boolean>(
  typeof window !== 'undefined' ? localStorage.getItem('tetris-music') !== 'false' : true
);

let board: (string | null)[][] = [];
let current: ActivePiece | null = null;
let nextPiece: ActivePiece | null = null;
let holdPiece: PieceDef | null = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let rafId: number | null = null;
let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
let repeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
let repeatIntervalId: ReturnType<typeof setInterval> | null = null;
let resizeTimerId: ReturnType<typeof setTimeout> | null = null;
let savedHeaderDisplay: string | null = null;

const speedPct = computed(() => {
  const interval = getDropInterval(level.value);
  const pct = Math.min(100, Math.round((1 - (interval - 80) / 920) * 100));
  return Math.max(5, pct);
});

const mobileRankings = computed(() => rankings.value.slice(0, 3));

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 1024;
}

function calcCanvasScale(): number {
  if (!isMobileViewport()) return 1;
  const TOPBAR = 36;
  const STATS = 58;
  const DPAD = isOver.value ? 0 : 80;
  const MOD_HDR = 44;
  const MOD_FTR = 32;
  const PADDING = 12;
  const availH = window.innerHeight - MOD_HDR - TOPBAR - STATS - DPAD - MOD_FTR - PADDING;
  const availW = window.innerWidth - 8;
  const scH = availH / 480;
  const scW = availW / 240;
  return Math.max(0.4, Math.min(scH, scW, 1.2));
}

function applyCanvasScale() {
  canvasScale.value = calcCanvasScale();
}

/* ════════════════════════════════════════════════════════
   TETRIS MUSIC PLAYER — "VOID_PROTOCOL"
   Chiptune / Arcane sequencer | Web Audio API | Am key | 150 BPM
════════════════════════════════════════════════════════ */
const TetrisMusic = (() => {
  const R = 0;
  const E3 = 164.81,
    F3 = 174.61,
    A3 = 220.0;
  const G4 = 392.0,
    A4 = 440.0,
    B4 = 493.88;
  const C5 = 523.25,
    D5 = 587.33,
    E5 = 659.25;
  const F5 = 698.46,
    G5 = 783.99,
    A5 = 880.0;

  const BPM = 150;
  const T16 = 60 / BPM / 4;
  const T8 = T16 * 2;

  const MELODY: [number, number, number][] = [
    [E5, 2, 0.85],
    [D5, 2, 0.85],
    [C5, 4, 0.8],
    [B4, 4, 0.8],
    [A4, 4, 0.7],
    [G4, 4, 0.8],
    [A4, 4, 0.8],
    [B4, 4, 0.8],
    [C5, 4, 0.7],
    [D5, 2, 0.85],
    [E5, 2, 0.85],
    [F5, 4, 0.8],
    [E5, 4, 0.8],
    [D5, 4, 0.75],
    [C5, 4, 0.8],
    [B4, 4, 0.8],
    [A4, 8, 0.6],
    [C5, 2, 0.85],
    [D5, 2, 0.85],
    [E5, 4, 0.85],
    [A5, 4, 0.8],
    [G5, 4, 0.75],
    [F5, 4, 0.8],
    [E5, 4, 0.8],
    [D5, 4, 0.8],
    [C5, 4, 0.7],
    [B4, 4, 0.8],
    [C5, 4, 0.8],
    [D5, 4, 0.8],
    [E5, 4, 0.75],
    [A4, 12, 0.6],
    [R, 4, 0],
  ];

  const BASS: [number, number, number][] = [
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [F3, 4, 0.5],
    [R, 4, 0],
    [F3, 4, 0.5],
    [R, 4, 0],
    [F3, 4, 0.5],
    [R, 4, 0],
    [F3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [A3, 4, 0.5],
    [R, 4, 0],
    [E3, 4, 0.5],
    [R, 4, 0],
    [E3, 4, 0.5],
    [R, 4, 0],
    [E3, 4, 0.5],
    [R, 4, 0],
    [E3, 4, 0.5],
    [R, 4, 0],
  ];

  const BEAT = [
    { k: 1, h: 0, s: 0 },
    { k: 0, h: 1, s: 0 },
    { k: 0, h: 0, s: 1 },
    { k: 0, h: 1, s: 0 },
    { k: 1, h: 0, s: 0 },
    { k: 0, h: 1, s: 0 },
    { k: 0, h: 0, s: 1 },
    { k: 0, h: 1, s: 0 },
  ];

  let ac: AudioContext | null = null;
  let masterG: GainNode | null = null;
  let playing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let mt = 0,
    bt = 0,
    dt = 0;
  let mi = 0,
    bi = 0,
    di = 0;
  const LA = 0.12;
  const SI = 50;

  function ensureCtx() {
    if (ac && masterG) return;
    ac = sfx.getCtx();
    if (!ac) return;
    masterG = ac.createGain();
    masterG.gain.value = sfx.muted.value ? 0 : 0.2;
    masterG.connect(ac.destination);
  }

  function noiseBuf(dur: number): AudioBuffer | null {
    if (!ac) return null;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
    }
    return buf;
  }

  function schedMel(freq: number, dur: number, gate: number, t: number) {
    if (!ac || !masterG) return;
    const n = ac.createOscillator();
    const g = ac.createGain();
    // Adapt timbre to active realm: Elden Ring uses warm triangle, Cyber uses classic square
    n.type = isEldenMode.value ? 'triangle' : 'square';
    n.frequency.value = freq;
    n.detune.value = isEldenMode.value ? -4 : -8;
    const d = dur * T16;
    const gd = Math.max(d * gate, 0.01);
    const peak = isEldenMode.value ? 0.14 : 0.1;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.004);
    if (gd > 0.02) g.gain.setValueAtTime(peak, t + gd - 0.015);
    g.gain.linearRampToValueAtTime(0, t + gd);
    n.connect(g);
    g.connect(masterG);
    n.start(t);
    n.stop(t + d + 0.01);
  }

  function schedBas(freq: number, dur: number, gate: number, t: number) {
    if (!ac || !masterG) return;
    const n = ac.createOscillator();
    const lpf = ac.createBiquadFilter();
    const g = ac.createGain();
    n.type = 'triangle';
    n.frequency.value = freq;
    lpf.type = 'lowpass';
    lpf.frequency.value = 500;
    const d = dur * T16;
    const gd = Math.max(d * gate, 0.01);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.008);
    if (gd > 0.025) g.gain.setValueAtTime(0.16, t + gd - 0.02);
    g.gain.linearRampToValueAtTime(0, t + gd);
    n.connect(lpf);
    lpf.connect(g);
    g.connect(masterG);
    n.start(t);
    n.stop(t + d + 0.01);
  }

  function schedKick(t: number) {
    if (!ac || !masterG) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.09);
    g.gain.setValueAtTime(0.38, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(g);
    g.connect(masterG);
    o.start(t);
    o.stop(t + 0.13);
  }

  function schedHat(t: number) {
    if (!ac || !masterG) return;
    const buf = noiseBuf(0.04);
    if (!buf) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hpf = ac.createBiquadFilter();
    const g = ac.createGain();
    hpf.type = 'highpass';
    hpf.frequency.value = 9000;
    g.gain.setValueAtTime(0.055, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    src.connect(hpf);
    hpf.connect(g);
    g.connect(masterG);
    src.start(t);
  }

  function schedSnare(t: number) {
    if (!ac || !masterG) return;
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.06);
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(og);
    og.connect(masterG);
    o.start(t);
    o.stop(t + 0.08);
    const buf = noiseBuf(0.12);
    if (!buf) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bpf = ac.createBiquadFilter();
    const ng = ac.createGain();
    bpf.type = 'bandpass';
    bpf.frequency.value = 3000;
    bpf.Q.value = 0.8;
    ng.gain.setValueAtTime(0.09, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    src.connect(bpf);
    bpf.connect(ng);
    ng.connect(masterG);
    src.start(t);
  }

  function schedule() {
    if (!playing || !ac || !masterG) return;
    masterG.gain.value = sfx.muted.value ? 0 : 0.2;
    const lk = ac.currentTime + LA;
    while (mt < lk) {
      const [f, dur, gate] = MELODY[mi % MELODY.length];
      if (f) schedMel(f, dur, gate, mt);
      mt += dur * T16;
      mi = (mi + 1) % MELODY.length;
    }
    while (bt < lk) {
      const [f, dur, gate] = BASS[bi % BASS.length];
      if (f) schedBas(f, dur, gate, bt);
      bt += dur * T16;
      bi = (bi + 1) % BASS.length;
    }
    while (dt < lk) {
      const beat = BEAT[di % BEAT.length];
      if (beat.k) schedKick(dt);
      if (beat.h) schedHat(dt);
      if (beat.s) schedSnare(dt);
      dt += T8;
      di++;
    }
  }

  return {
    start() {
      if (playing) return;
      ensureCtx();
      if (!ac || !masterG) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      playing = true;
      sfx.musicPlaying.value = true;
      mi = bi = di = 0;
      const now = ac.currentTime + 0.05;
      mt = bt = dt = now;
      masterG.gain.setValueAtTime(sfx.muted.value ? 0 : 0.2, ac.currentTime);
      const tick = () => {
        if (!playing) return;
        schedule();
        timer = setTimeout(tick, SI);
      };
      tick();
    },
    stop() {
      playing = false;
      sfx.musicPlaying.value = false;
      if (timer) clearTimeout(timer);
      if (masterG && ac) {
        try {
          masterG.gain.cancelScheduledValues(ac.currentTime);
          masterG.gain.setTargetAtTime(0, ac.currentTime, 0.08);
        } catch {
          // ignore
        }
      }
    },
    isPlaying() {
      return playing;
    },
  };
})();

function toggleMusicBtn() {
  musicOn.value = !musicOn.value;
  try {
    localStorage.setItem('tetris-music', String(musicOn.value));
  } catch {
    // ignore
  }
  if (musicOn.value && !isOver.value && !isPaused.value) {
    TetrisMusic.start();
  } else {
    TetrisMusic.stop();
  }
  sfx.play('toggle');
}

function openTutorialOverlay() {
  showTutorial.value = true;
  sfx.play('click');
}

function closeTutorialOverlay() {
  showTutorial.value = false;
  try {
    localStorage.setItem(TUTORIAL_K, '1');
  } catch {
    // ignore
  }
  sfx.play('select');
}

function createBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function clonePiece(p: PieceDef): PieceDef {
  return { ...p, shape: p.shape.map((r) => [...r]) };
}

function randomPiece(): ActivePiece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    ...clonePiece(p),
    x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2),
    y: 0,
  };
}

function getDropInterval(lvl: number): number {
  return Math.max(80, Math.round(1000 * Math.pow(0.82, lvl - 1)));
}

function loadRanking(): TetrisRankingEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRanking(list: TetrisRankingEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function refreshRankingState() {
  rankings.value = loadRanking();
  const rec = rankings.value.find((e) => e.name === PLAYER);
  bestScore.value = Math.max(rec?.score ?? 0, score.value);
}

function submitScore(name: string, pts: number, lvl: number): number {
  let list = loadRanking();
  const idx = list.findIndex((e) => e.name === name);
  const d = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  if (idx >= 0) {
    if (pts > list[idx].score) list[idx] = { name, score: pts, level: lvl, date: d };
  } else {
    list.push({ name, score: pts, level: lvl, date: d });
  }
  list.sort((a, b) => b.score - a.score);
  list = list.slice(0, MAX_RANK);
  saveRanking(list);
  refreshRankingState();
  return list.findIndex((e) => e.name === name) + 1;
}

function clearRanking() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  bestScore.value = 0;
  refreshRankingState();
  sfx.play('close');
}

function showFeedback(text: string) {
  feedbackMessage.value = text;
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    feedbackMessage.value = '';
  }, 900);
}

function drawBlock(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  emoji: string,
  size: number,
  ox = 0,
  oy = 0,
  alpha = 1
) {
  c.save();
  c.globalAlpha = alpha;
  c.font = `${size * 0.85}px sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(emoji, ox + x * size + size / 2, oy + y * size + size / 2);
  c.restore();
}

function drawMini(
  canvasEl: HTMLCanvasElement | null,
  piece: PieceDef | null,
  cw: number,
  ch: number,
  size: number
) {
  if (!canvasEl) return;
  const c = canvasEl.getContext('2d');
  if (!c) return;
  c.clearRect(0, 0, cw, ch);
  if (!piece) return;
  const s = piece.shape;
  const ox = (cw - s[0].length * size) / 2;
  const oy = (ch - s.length * size) / 2;
  s.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v) drawBlock(c, x, y, piece.block, size, ox, oy);
    })
  );
}

function drawAllMinis() {
  drawMini(holdCanvasDRef.value, holdPiece, 80, 80, MINI_D);
  drawMini(nextCanvasDRef.value, nextPiece, 80, 80, MINI_D);
  drawMini(holdCanvasMRef.value, holdPiece, 40, 40, MINI_M);
  drawMini(nextCanvasMRef.value, nextPiece, 40, 40, MINI_M);
}

function collides(piece: ActivePiece): boolean {
  return piece.shape.some((row, dy) =>
    row.some((v, dx) => {
      if (!v) return false;
      const nx = piece.x + dx;
      const ny = piece.y + dy;
      return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && Boolean(board[ny]?.[nx]));
    })
  );
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = isEldenMode.value ? '#090414' : '#070714';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = isEldenMode.value
    ? 'rgba(201, 168, 76, 0.065)'
    : 'rgba(8, 196, 202, 0.045)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK, 0);
    ctx.lineTo(x * BLOCK, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK);
    ctx.lineTo(canvas.width, y * BLOCK);
    ctx.stroke();
  }

  board.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) drawBlock(ctx, x, y, cell, BLOCK);
    })
  );

  if (current) {
    let gy = current.y;
    while (!collides({ ...current, y: gy + 1 })) gy++;
    if (gy !== current.y) {
      current.shape.forEach((row, dy) =>
        row.forEach((v, dx) => {
          if (v) drawBlock(ctx, current!.x + dx, gy + dy, current!.block, BLOCK, 0, 0, 0.13);
        })
      );
    }
    current.shape.forEach((row, dy) =>
      row.forEach((v, dx) => {
        if (v) drawBlock(ctx, current!.x + dx, current!.y + dy, current!.block, BLOCK);
      })
    );
  }

  drawAllMinis();
}

function solidify() {
  if (!current) return;
  current.shape.forEach((row, dy) =>
    row.forEach((v, dx) => {
      if (v && board[current!.y + dy]) {
        board[current!.y + dy][current!.x + dx] = current!.block;
      }
    })
  );
  sfx.play('tetris_lock');
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      y++;
      cleared++;
    }
  }
  if (!cleared) {
    combo.value = 0;
    return;
  }

  combo.value++;
  lines.value += cleared;

  const newLvl = Math.floor(lines.value / 10) + 1;
  if (newLvl > level.value) {
    level.value = newLvl;
    dropInterval = getDropInterval(level.value);
    showFeedback(`${t('tetris_fb_level')} ${level.value}`);
    sfx.play('tetris_levelup');
  }

  const base = (LINE_PTS[cleared] ?? 800) * level.value;
  const comboB = combo.value > 1 ? COMBO_BONUS * (combo.value - 1) * level.value : 0;
  score.value += base + comboB;
  if (score.value > bestScore.value) bestScore.value = score.value;

  const labels = [
    '',
    t('tetris_fb_single'),
    t('tetris_fb_double'),
    t('tetris_fb_triple'),
    t('tetris_fb_tetris'),
  ];
  const baseMsg = cleared === 4 ? t('tetris_fb_tetris') : labels[cleared];
  const comboLbl = t('tetris_fb_combo');
  const msg = combo.value > 1 ? `${baseMsg} ${combo.value}x ${comboLbl}` : baseMsg;
  showFeedback(msg);
  sfx.play(cleared === 4 ? 'tetris_4lines' : 'tetris_clear');
}

function spawnNext() {
  current = nextPiece ?? randomPiece();
  nextPiece = randomPiece();
  isHoldLocked.value = false;
  dropCounter = 0;
  if (collides(current)) {
    gameOver();
  }
}

function gameOver() {
  isOver.value = true;
  dpadRepeatStop();
  if (rafId) cancelAnimationFrame(rafId);
  const pos = submitScore(PLAYER, score.value, level.value);
  lastRankPos.value = pos;
  TetrisMusic.stop();
  nextTick(applyCanvasScale);
}

function drop(soft = false) {
  if (!current || isOver.value || isPaused.value) return;
  current.y++;
  if (collides(current)) {
    current.y--;
    solidify();
    clearLines();
    spawnNext();
  } else {
    if (soft) {
      score.value += SOFT_PTS;
      if (score.value > bestScore.value) bestScore.value = score.value;
    }
    dropCounter = 0;
  }
  draw();
}

function hardDrop() {
  if (!current || isOver.value || isPaused.value) return;
  let d = 0;
  while (!collides({ ...current, y: current.y + 1 })) {
    current.y++;
    d++;
  }
  score.value += d * HARD_PTS;
  if (score.value > bestScore.value) bestScore.value = score.value;
  sfx.play('tetris_drop');
  drop(false);
}

function rotate(dir = 1) {
  if (!current || isOver.value || isPaused.value) return;
  const orig = current.shape;
  const R = orig.length;
  const C = orig[0].length;
  const next =
    dir > 0
      ? Array.from({ length: C }, (_, c) =>
          Array.from({ length: R }, (__, r) => orig[R - 1 - r][c])
        )
      : Array.from({ length: C }, (_, c) =>
          Array.from({ length: R }, (__, r) => orig[r][C - 1 - c])
        );
  current.shape = next;
  for (const off of [0, -1, 1, -2, 2]) {
    current.x += off;
    if (!collides(current)) {
      sfx.play('tetris_rotate');
      draw();
      return;
    }
    current.x -= off;
  }
  current.shape = orig;
}

function moveHorizontal(dir: -1 | 1) {
  if (!current || isOver.value || isPaused.value) return;
  current.x += dir;
  if (collides(current)) {
    current.x -= dir;
  } else {
    sfx.play('tetris_move');
    draw();
  }
}

function holdAction() {
  if (!current || isHoldLocked.value || isOver.value || isPaused.value) return;
  const base = PIECES.find((p) => p.id === current!.id);
  if (!base) return;
  if (!holdPiece) {
    holdPiece = clonePiece(base);
    spawnNext();
  } else {
    const prevBase = PIECES.find((p) => p.id === holdPiece!.id) ?? holdPiece;
    const prev = clonePiece(prevBase);
    holdPiece = clonePiece(base);
    current = {
      ...prev,
      x: Math.floor(COLS / 2) - Math.floor(prev.shape[0].length / 2),
      y: 0,
    };
  }
  isHoldLocked.value = true;
  dropCounter = 0;
  sfx.play('click');
  draw();
}

function loop(time = 0) {
  if (isOver.value || isPaused.value) return;
  const dt = lastTime ? time - lastTime : 0;
  lastTime = time;
  dropCounter += dt;
  if (dropCounter > dropInterval) {
    drop(false);
  } else {
    draw();
  }
  rafId = requestAnimationFrame(loop);
}

function startGame() {
  if (rafId) cancelAnimationFrame(rafId);
  dpadRepeatStop();
  board = createBoard();
  score.value = 0;
  lines.value = 0;
  combo.value = 0;
  level.value = 1;
  isPaused.value = false;
  isOver.value = false;
  hasStartedOnce.value = true;
  isHoldLocked.value = false;
  lastRankPos.value = null;
  holdPiece = null;
  dropInterval = getDropInterval(1);
  dropCounter = 0;
  lastTime = 0;

  nextPiece = randomPiece();
  spawnNext();
  nextTick(applyCanvasScale);
  sfx.play('select');
  if (musicOn.value && !TetrisMusic.isPlaying()) {
    TetrisMusic.start();
  }
  draw();
  rafId = requestAnimationFrame(loop);
}

function togglePause() {
  if (isOver.value) return;
  isPaused.value = !isPaused.value;
  sfx.play('click');
  if (isPaused.value) {
    dpadRepeatStop();
    TetrisMusic.stop();
  } else {
    if (musicOn.value) TetrisMusic.start();
    lastTime = 0;
    rafId = requestAnimationFrame(loop);
  }
}

/* ── D-pad hold-to-repeat ───────────────────────────────── */
function doDir(dir: 'left' | 'right' | 'down') {
  if (isOver.value || isPaused.value || !current) return;
  if (dir === 'left') moveHorizontal(-1);
  if (dir === 'right') moveHorizontal(1);
  if (dir === 'down') drop(true);
}

function dpadRepeatStart(dir: 'left' | 'right' | 'down', btnId: string) {
  pressedBtn.value = btnId;
  dpadRepeatStop(false);
  if (isOver.value || isPaused.value || !current) return;
  doDir(dir);
  repeatTimeoutId = setTimeout(() => {
    repeatIntervalId = setInterval(() => doDir(dir), 80);
  }, 170);
}

function dpadRepeatStop(clearPressed = true) {
  if (clearPressed) pressedBtn.value = null;
  if (repeatTimeoutId) clearTimeout(repeatTimeoutId);
  if (repeatIntervalId) clearInterval(repeatIntervalId);
  repeatTimeoutId = null;
  repeatIntervalId = null;
}

/* ── Canvas touch / swipe gestures ──────────────────────── */
let swX = 0;
let swY = 0;
let swT = 0;
let lastTap = 0;

function onCanvasTouchStart(e: TouchEvent) {
  e.preventDefault();
  const touch = e.touches[0];
  if (!touch) return;
  swX = touch.clientX;
  swY = touch.clientY;
  swT = Date.now();
}

function onCanvasTouchEnd(e: TouchEvent) {
  e.preventDefault();
  if (isOver.value || isPaused.value || !current) return;
  const touch = e.changedTouches[0];
  if (!touch) return;

  const dx = touch.clientX - swX;
  const dy = touch.clientY - swY;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const dt = Date.now() - swT;

  if (Math.max(ax, ay) < 12 && dt < 220) {
    const now = Date.now();
    if (now - lastTap < 280) {
      rotate(-1);
    } else {
      rotate(1);
    }
    lastTap = now;
    return;
  }
  if (ax > ay && ax > 18) {
    const steps = Math.max(1, Math.round(ax / (28 * canvasScale.value)));
    for (let i = 0; i < steps; i++) {
      if (dx > 0) {
        current.x++;
        if (collides(current)) {
          current.x--;
          break;
        } else {
          sfx.play('tetris_move');
        }
      } else {
        current.x--;
        if (collides(current)) {
          current.x++;
          break;
        } else {
          sfx.play('tetris_move');
        }
      }
    }
    draw();
    return;
  }
  if (dy < -32 && ay > ax) {
    holdAction();
    return;
  }
  if (dy > 32 && ay > ax && dt < 160) {
    hardDrop();
    return;
  }
  if (dy > 22 && ay > ax) {
    drop(true);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (showTutorial.value) {
      closeTutorialOverlay();
      return;
    }
    emit('close');
    return;
  }
  if (showTutorial.value || isOver.value) return;
  if (isPaused.value && !['p', 'P'].includes(e.key)) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      moveHorizontal(-1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveHorizontal(1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      drop(true);
      break;
    case 'ArrowUp':
    case 'z':
    case 'Z':
      e.preventDefault();
      rotate(1);
      break;
    case 'x':
    case 'X':
      e.preventDefault();
      rotate(-1);
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      break;
    case 'c':
    case 'C':
      e.preventDefault();
      holdAction();
      break;
    case 'p':
    case 'P':
      e.preventDefault();
      togglePause();
      break;
  }
}

function onWindowResize() {
  if (resizeTimerId) clearTimeout(resizeTimerId);
  resizeTimerId = setTimeout(applyCanvasScale, 100);
}

watch(isEldenMode, () => {
  draw();
});

onMounted(() => {
  const headerEl = document.getElementById('main-header');
  if (headerEl) {
    savedHeaderDisplay = headerEl.style.display;
    headerEl.style.display = 'none';
  }

  board = createBoard();
  nextPiece = randomPiece();
  refreshRankingState();
  applyCanvasScale();
  draw();

  try {
    if (isMobileViewport() && !localStorage.getItem(TUTORIAL_K)) {
      setTimeout(() => {
        showTutorial.value = true;
      }, 500);
    }
  } catch {
    // ignore
  }

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  const headerEl = document.getElementById('main-header');
  if (headerEl) {
    headerEl.style.display = savedHeaderDisplay ?? '';
  }

  dpadRepeatStop();
  TetrisMusic.stop();
  if (rafId) cancelAnimationFrame(rafId);
  if (feedbackTimer) clearTimeout(feedbackTimer);
  if (resizeTimerId) clearTimeout(resizeTimerId);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', onWindowResize);
});
</script>

<template>
  <Teleport to="body">
    <div
      data-interactive
      class="fixed inset-0 z-[10000] bg-black/95 flex items-stretch p-0 lg:p-4"
      style="backdrop-filter: blur(4px)"
      role="dialog"
      aria-modal="true"
      aria-label="Tetris Challenge"
    >
      <div
        class="relative w-full flex flex-col border-primary shadow-[0_0_60px_rgba(var(--color-primary-rgb),0.2)] lg:m-auto lg:max-w-4xl lg:border lg:max-h-[96vh]"
        :class="
          isEldenMode
            ? 'rpg-card bg-[#0b0516]/98 border-[#c9a84c]/50'
            : 'bg-black'
        "
        :style="
          isEldenMode
            ? ''
            : 'clip-path: polygon(0 0, 100% 0, 100% 99%, 98.5% 100%, 0 100%)'
        "
      >
        <!-- MODAL HEADER -->
        <div
          class="flex-shrink-0 flex justify-between items-center px-4 border-b"
          :class="
            isEldenMode
              ? 'border-[#c9a84c]/40 bg-gradient-to-r from-[#b366ff]/15 via-[#180a2e]/80 to-transparent'
              : 'border-primary bg-primary/5'
          "
          style="height: 44px; min-height: 44px"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-2 h-2 rotate-45 animate-pulse shadow-[0_0_8px_var(--color-primary)]"
              :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
            ></div>
            <span
              class="text-sm font-black uppercase tracking-[0.1em]"
              :class="isEldenMode ? 'font-elden text-[#e2c777]' : 'text-primary'"
            >
              {{ t('challenge_modal_title') }}
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="flex gap-1">
              <div class="w-1 h-2 bg-primary/20"></div>
              <div class="w-1 h-2 bg-primary/50"></div>
              <div class="w-1 h-2 bg-primary animate-pulse"></div>
            </div>
            <button
              type="button"
              aria-label="Close Tetris Modal"
              @click="emit('close')"
              class="text-primary/60 hover:text-primary transition-colors p-1 cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════
          #tetris-root — IDENTICAL TO ORIGINAL tetris.html
        ═══════════════════════════════════════════════════════ -->
        <div
          id="tetris-root"
          class="select-none flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <!-- ══════════════════════════════════════════════════
            TUTORIAL OVERLAY (#tetris-tutorial)
          ═══════════════════════════════════════════════════════ -->
          <div
            v-if="showTutorial"
            id="tetris-tutorial"
            class="fixed inset-0 z-[11000] bg-black/97 flex flex-col items-center justify-center p-5 overflow-y-auto"
            style="backdrop-filter: blur(6px)"
          >
            <div
              class="w-full max-w-xs p-4"
              :class="isEldenMode ? 'rpg-card bg-[#0d051a]/95' : ''"
            >
              <div class="flex items-center gap-2 mb-5">
                <div
                  class="w-2 h-2 rotate-45 shadow-[0_0_8px_var(--color-primary)]"
                  :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
                ></div>
                <h3
                  class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary"
                  :class="isEldenMode ? 'font-elden text-[#e2c777]' : ''"
                >
                  {{ t('tetris_tutorial_title') }}
                </h3>
              </div>

              <div class="space-y-2 mb-5">
                <!-- ← → -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-lg text-primary">
                    ◀▶
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      {{ t('tetris_ctrl_move') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_move_desc') }}
                    </p>
                  </div>
                </div>

                <!-- ↻ ↺ -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-lg text-primary">
                    ↻↺
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      {{ t('tetris_ctrl_rotate') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_rotate_desc') }}
                    </p>
                  </div>
                </div>

                <!-- ▼ -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-base text-primary">
                    ▼
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      ▼
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_soft_desc') }}
                    </p>
                  </div>
                </div>

                <!-- SPC -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-sm font-black text-primary">
                    SPC
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      SPC
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_hard_desc') }}
                    </p>
                  </div>
                </div>

                <!-- HOLD -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-primary/20 bg-primary/5"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/40 bg-primary/10 shrink-0 text-base font-black text-primary">
                    H
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-primary font-black uppercase tracking-widest leading-tight">
                      HOLD
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_hold_desc') }}
                    </p>
                  </div>
                </div>

                <!-- TAP canvas -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-lg">
                    👆
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      {{ t('tetris_ctrl_tap') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_tap_desc') }}
                    </p>
                  </div>
                </div>

                <!-- Swipe canvas -->
                <div
                  class="flex items-center gap-3 p-2.5 border border-white/5 bg-black/40"
                  :class="isEldenMode ? 'er-slot' : ''"
                >
                  <div class="w-10 h-10 flex items-center justify-center border border-primary/30 bg-primary/5 shrink-0 text-lg">
                    📱
                  </div>
                  <div>
                    <p class="text-[length:var(--text-sm)] text-white font-black uppercase tracking-widest leading-tight">
                      {{ t('tetris_ctrl_swipe') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_swipe_up') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_swipe_lr') }}
                    </p>
                    <p class="text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest">
                      {{ t('tetris_ctrl_swipe_dn') }}
                    </p>
                  </div>
                </div>
              </div>

              <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest text-center mb-4">
                <span>{{ t('tetris_tutorial_hint') }}</span>
                <span class="text-primary"> ?</span>
              </p>

              <button
                id="tetris-tutorial-ok"
                type="button"
                @click="closeTutorialOverlay"
                class="w-full py-2.5 border border-primary/60 bg-primary/10 hover:bg-primary/20 hover:border-primary text-primary font-black uppercase tracking-widest text-[length:var(--text-sm)] transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>{{ t('tetris_tutorial_ok') }}</span>
                <span class="animate-pulse">▶</span>
              </button>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════
            TOPBAR MOBILE (.tetris-topbar)
          ═══════════════════════════════════════════════════════ -->
          <div
            class="tetris-topbar flex-shrink-0 lg:hidden flex items-center justify-between px-2 border-b border-primary/10 bg-black/40"
            style="height: 36px; min-height: 36px"
          >
            <!-- Score -->
            <div class="flex items-center gap-1.5">
              <span class="text-[length:var(--text-xs)] text-primary/40 uppercase tracking-widest">sc</span>
              <span
                id="tetris-score-mobile"
                class="font-black text-primary tracking-widest drop-shadow-[0_0_5px_rgba(var(--color-primary-rgb),0.7)]"
                style="font-size: 13px"
              >
                {{ score.toLocaleString() }}
              </span>
            </div>

            <!-- Level / Lines / Best -->
            <div class="flex items-center gap-2.5">
              <div class="flex items-center gap-1">
                <span class="text-[length:var(--text-xs)] text-gray-500 uppercase">lv</span>
                <span id="tetris-level-mob" class="text-xs font-black text-primary">{{ level }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[length:var(--text-xs)] text-gray-500 uppercase">li</span>
                <span id="tetris-lines-mob" class="text-xs font-black text-white/70">{{ lines }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-[length:var(--text-xs)] text-gray-500 uppercase">
                  {{ t('tetris_label_best_short') }}
                </span>
                <span id="tetris-best-mobile" class="text-xs font-black text-primary/60">
                  {{ bestScore.toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- Ações -->
            <div class="flex items-center gap-1">
              <button
                id="tetris-show-tutorial"
                type="button"
                @click="openTutorialOverlay"
                class="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/60 text-white/50 hover:text-primary hover:border-primary transition text-xs font-black touch-manipulation cursor-pointer"
              >
                ?
              </button>
              <button
                id="tetris-pause-btn-mobile"
                type="button"
                :disabled="isOver"
                @click="togglePause"
                class="px-1.5 h-6 border border-primary/25 bg-black/60 text-primary text-[length:var(--text-xs)] uppercase tracking-widest hover:border-primary transition-all disabled:opacity-25 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
              >
                {{ isPaused ? '▶' : '⏸' }}
              </button>
              <button
                id="tetris-restart-btn-mobile"
                type="button"
                :disabled="!hasStartedOnce"
                @click="startGame"
                class="px-1.5 h-6 border border-white/10 bg-black/60 text-gray-400 text-[length:var(--text-xs)] uppercase tracking-widest hover:border-white/30 hover:text-white transition-all disabled:opacity-25 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
              >
                ↺
              </button>
              <button
                id="tetris-music-btn"
                type="button"
                @click="toggleMusicBtn"
                class="w-6 h-6 flex items-center justify-center border border-primary/25 bg-black/60 text-primary hover:border-primary transition-all touch-manipulation cursor-pointer"
                style="font-size: 13px"
              >
                {{ musicOn ? '♫' : '♪' }}
              </button>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════
            ÁREA DE JOGO
            Mobile: coluna — canvas → stats → dpad
            Desktop: 3 colunas lado a lado
          ═══════════════════════════════════════════════════════ -->
          <div
            class="flex-1 min-h-0 flex flex-col lg:flex-row items-center lg:items-start justify-start lg:justify-center gap-0 lg:gap-4 lg:p-4 lg:overflow-visible"
          >
            <!-- ── Coluna esquerda (desktop only) ────────────── -->
            <div class="hidden lg:flex flex-col gap-3 w-36 shrink-0 pt-0">
              <!-- Hold -->
              <div
                class="border border-primary/30 bg-black/60 p-3 text-center"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <p class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-widest mb-2">
                  {{ t('tetris_label_hold') }}
                </p>
                <canvas
                  id="tetris-hold"
                  ref="holdCanvasDRef"
                  width="80"
                  height="80"
                  class="mx-auto block"
                  style="background: transparent"
                ></canvas>
                <p
                  v-show="isHoldLocked"
                  id="tetris-hold-lock"
                  class="text-[length:var(--text-micro)] text-red-500/70 uppercase tracking-widest mt-1"
                >
                  {{ t('tetris_label_locked') }}
                </p>
              </div>

              <!-- Stats -->
              <div
                class="border border-white/5 bg-black/40 p-3 space-y-3"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <div>
                  <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest">
                    {{ t('tetris_label_level') }}
                  </p>
                  <p id="tetris-level" class="text-lg font-black text-primary tracking-widest">
                    {{ level }}
                  </p>
                </div>
                <div>
                  <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest">
                    {{ t('tetris_label_lines') }}
                  </p>
                  <p id="tetris-lines" class="text-lg font-black text-white/85 tracking-widest">
                    {{ lines }}
                  </p>
                </div>
                <div>
                  <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest">
                    {{ t('tetris_label_combo') }}
                  </p>
                  <p id="tetris-combo" class="text-lg font-black text-accent tracking-widest">
                    {{ combo > 0 ? `${combo}x` : '0x' }}
                  </p>
                </div>
              </div>

              <!-- Speed bar -->
              <div
                class="border border-white/5 bg-black/40 p-3"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest mb-1">
                  {{ t('tetris_label_spd') }}
                </p>
                <div class="h-1 bg-black border border-white/5">
                  <div
                    id="tetris-speed-bar"
                    class="h-full bg-primary transition-all duration-500 shadow-[0_0_6px_var(--color-primary)]"
                    :style="{ width: `${speedPct}%` }"
                  ></div>
                </div>
              </div>

              <!-- Botões desktop -->
              <div class="flex flex-col gap-2">
                <button
                  id="tetris-pause-btn"
                  type="button"
                  :disabled="isOver"
                  @click="togglePause"
                  class="py-2 px-3 border border-primary/30 bg-black/60 text-primary text-[length:var(--text-micro)] uppercase tracking-widest hover:border-primary hover:bg-primary/10 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ isPaused ? t('tetris_btn_resume') : t('tetris_btn_pause') }}
                </button>
                <button
                  id="tetris-restart-btn"
                  type="button"
                  :disabled="!hasStartedOnce"
                  @click="startGame"
                  class="py-2 px-3 border border-white/10 bg-black/60 text-gray-400 text-[length:var(--text-micro)] uppercase tracking-widest hover:border-white/30 hover:text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {{ t('tetris_btn_restart') }}
                </button>
                <button
                  id="tetris-music-btn-d"
                  type="button"
                  @click="toggleMusicBtn"
                  class="py-2 px-3 border border-primary/20 bg-black/60 text-primary/80 text-[length:var(--text-micro)] uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                >
                  {{ musicOn ? '♫ MUSIC ON' : '♪ MUSIC OFF' }}
                </button>
              </div>
            </div>

            <!-- ── Canvas (centro) ───────────────────────────── -->
            <div
              id="tetris-canvas-area"
              class="flex items-center justify-center lg:pt-0 shrink-0"
            >
              <div
                id="tetris-canvas-wrap"
                class="relative shrink-0"
                :style="{ '--canvas-scale': canvasScale, touchAction: 'none' }"
              >
                <!-- Glow -->
                <div class="absolute -inset-2 bg-primary/5 blur-xl pointer-events-none"></div>

                <!-- Borda + canvas -->
                <div
                  class="relative border shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.12)]"
                  :class="
                    isEldenMode
                      ? 'border-[#c9a84c]/55 shadow-[0_0_28px_rgba(179,102,255,0.18)]'
                      : 'border-primary/40'
                  "
                >
                  <canvas
                    id="tetris-canvas"
                    ref="canvasRef"
                    width="240"
                    height="480"
                    class="block"
                    :style="{
                      background: isEldenMode ? '#090414' : '#070714',
                      display: 'block',
                    }"
                    @touchstart="onCanvasTouchStart"
                    @touchend="onCanvasTouchEnd"
                  ></canvas>
                  <div class="absolute inset-0 bg-scanlines opacity-5 pointer-events-none"></div>
                </div>

                <!-- Feedback flutuante -->
                <div
                  id="tetris-feedback"
                  class="absolute top-2 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-300"
                  :style="{ opacity: feedbackMessage ? 1 : 0 }"
                >
                  <span
                    id="tetris-feedback-text"
                    class="text-[length:var(--text-md)] font-black uppercase tracking-widest text-primary bg-black/70 px-2 py-0.5 drop-shadow-[0_0_10px_rgba(var(--color-primary-rgb),1)]"
                  >
                    {{ feedbackMessage }}
                  </span>
                </div>

                <!-- Start / Game Over overlay -->
                <div
                  v-if="isOver"
                  id="tetris-start-screen"
                  class="absolute inset-0 bg-black/93 flex flex-col items-center justify-center p-3 text-center"
                  style="backdrop-filter: blur(2px)"
                >
                  <div
                    class="w-2 h-2 rotate-45 shadow-[0_0_8px_var(--color-primary)] mb-2"
                    :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
                  ></div>
                  <h3
                    class="text-[length:var(--text-md)] lg:text-[length:var(--text-lg)] font-black uppercase tracking-[0.1em] text-primary mb-1"
                    :class="isEldenMode ? 'font-elden text-[#e2c777]' : ''"
                  >
                    TETRIS.exe
                  </h3>
                  <p class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-widest mb-3">
                    {{ t('tetris_module_sub') }}
                  </p>

                  <!-- Desktop: controles teclado -->
                  <div
                    class="hidden lg:block w-full bg-black/60 border border-white/5 p-3 mb-4 text-left text-[length:var(--text-micro)] text-gray-400 uppercase tracking-widest space-y-1"
                    :class="isEldenMode ? 'er-slot' : ''"
                  >
                    <p class="text-primary/70 mb-2">{{ t('tetris_ctrl_header') }}</p>
                    <p>
                      <span class="text-primary">← →</span>&nbsp;&nbsp;<span>{{ t('tetris_ctrl_key_move') }}</span>
                    </p>
                    <p>
                      <span class="text-primary">↑ / Z</span>&nbsp;<span>{{ t('tetris_ctrl_key_rcw') }}</span>
                    </p>
                    <p>
                      <span class="text-primary">X</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>{{ t('tetris_ctrl_key_rccw') }}</span>
                    </p>
                    <p>
                      <span class="text-primary">↓</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>{{ t('tetris_ctrl_key_soft') }}</span>
                    </p>
                    <p>
                      <span class="text-primary">SPC</span>&nbsp;&nbsp;<span>{{ t('tetris_ctrl_key_hard') }}</span>
                    </p>
                    <p>
                      <span class="text-primary">C / P</span>&nbsp;<span>{{ t('tetris_ctrl_key_hold') }}</span>
                    </p>
                  </div>

                  <!-- Mobile: hint compacto -->
                  <div
                    class="lg:hidden w-full bg-black/60 border border-white/5 p-2 mb-3 text-[length:var(--text-xs)] text-gray-400 uppercase tracking-widest"
                    :class="isEldenMode ? 'er-slot' : ''"
                  >
                    <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 mb-1.5">
                      <p>
                        <span class="text-primary">TAP</span> <span>{{ t('tetris_hint_tap') }}</span>
                      </p>
                      <p>
                        <span class="text-primary">SWIPE←→</span> <span>{{ t('tetris_hint_lr') }}</span>
                      </p>
                      <p>
                        <span class="text-primary">SWIPE↓</span> <span>{{ t('tetris_hint_dn') }}</span>
                      </p>
                      <p>
                        <span class="text-primary">SWIPE↑</span> <span>{{ t('tetris_hint_up') }}</span>
                      </p>
                    </div>
                    <button
                      id="tetris-open-tutorial-start"
                      type="button"
                      @click="openTutorialOverlay"
                      class="text-primary/60 hover:text-primary transition underline underline-offset-2 text-[length:var(--text-xs)] cursor-pointer"
                    >
                      {{ t('tetris_see_tutorial') }}
                    </button>
                  </div>

                  <button
                    id="tetris-start-btn"
                    type="button"
                    @click="startGame"
                    class="w-full py-2 lg:py-3 px-4 border border-primary/60 bg-primary/10 hover:bg-primary/20 hover:border-primary text-primary font-black uppercase tracking-widest text-[length:var(--text-sm)] transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span id="tetris-start-label">
                      {{ hasStartedOnce ? t('tetris_btn_restart') : t('tetris_btn_start') }}
                    </span>
                    <span class="animate-pulse">█</span>
                  </button>

                  <p
                    v-if="hasStartedOnce"
                    id="tetris-gameover-text"
                    class="text-red-500 text-[length:var(--text-md)] font-black uppercase tracking-widest mt-3"
                  >
                    {{
                      lastRankPos
                        ? `${t('tetris_gameover')} — rank #${lastRankPos}`
                        : t('tetris_gameover')
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ── Coluna direita (desktop only) ─────────────── -->
            <div class="hidden lg:flex flex-col gap-3 w-36 shrink-0">
              <!-- Score -->
              <div
                class="border border-primary/30 bg-black/60 p-3 text-center shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <p class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-widest mb-1">
                  {{ t('tetris_label_score') }}
                </p>
                <p
                  id="tetris-score"
                  class="text-2xl font-black text-primary tracking-widest drop-shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.8)]"
                >
                  {{ score.toLocaleString() }}
                </p>
                <p class="text-[length:var(--text-micro)] text-gray-500 uppercase tracking-widest mt-1">
                  {{ t('tetris_label_best') }}
                </p>
                <p id="tetris-best" class="text-sm font-black text-white/60 tracking-widest">
                  {{ bestScore.toLocaleString() }}
                </p>
              </div>

              <!-- Next -->
              <div
                class="border border-primary/30 bg-black/60 p-3 text-center"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <p class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-widest mb-2">
                  {{ t('tetris_label_next') }}
                </p>
                <canvas
                  id="tetris-next"
                  ref="nextCanvasDRef"
                  width="80"
                  height="80"
                  class="mx-auto block"
                  style="background: transparent"
                ></canvas>
              </div>

              <!-- Ranking -->
              <div
                class="border border-primary/20 bg-black/60 p-3"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <div class="flex items-center justify-between mb-2">
                  <p class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-widest">
                    {{ t('tetris_label_ranking') }}
                  </p>
                  <button
                    id="tetris-clear-rank"
                    type="button"
                    @click="clearRanking"
                    class="text-[length:var(--text-micro)] text-red-500/40 hover:text-red-500 transition uppercase tracking-widest cursor-pointer"
                  >
                    [clr]
                  </button>
                </div>
                <div id="tetris-ranking-list" class="space-y-1 max-h-48 overflow-y-auto">
                  <p
                    v-if="!rankings.length"
                    style="font-size: 8px; color: #4b5563; text-align: center; text-transform: uppercase"
                  >
                    —
                  </p>
                  <div
                    v-for="(entry, idx) in rankings"
                    :key="idx"
                    class="flex items-center justify-between py-0.5 border-b border-white/5 gap-1"
                  >
                    <div class="flex items-center gap-1 min-w-0 overflow-hidden">
                      <span class="text-[8px] shrink-0">{{ MEDALS[idx] ?? `${idx + 1}.` }}</span>
                      <span
                        class="text-[8px] uppercase tracking-wider truncate"
                        :class="idx === 0 ? 'text-primary font-black' : 'text-gray-400'"
                      >
                        {{ entry.name }}
                      </span>
                    </div>
                    <span
                      class="text-[8px] font-black shrink-0"
                      :class="idx === 0 ? 'text-primary' : 'text-white/50'"
                    >
                      {{ entry.score.toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Stats mobile (abaixo do canvas) ──────────── -->
            <div
              class="lg:hidden w-full flex-shrink-0 flex gap-1.5 px-2"
              style="height: 58px; min-height: 58px"
            >
              <!-- Hold mini -->
              <div
                class="border border-primary/25 bg-black/50 flex flex-col items-center justify-center"
                :class="isEldenMode ? 'er-slot' : ''"
                style="width: 54px; min-width: 54px"
              >
                <p class="text-[8px] text-primary/50 uppercase tracking-widest leading-none mb-0.5">
                  {{ t('tetris_mob_hold') }}
                </p>
                <canvas
                  id="tetris-hold-mob"
                  ref="holdCanvasMRef"
                  width="40"
                  height="40"
                  class="block"
                  style="background: transparent"
                ></canvas>
                <p
                  v-show="isHoldLocked"
                  class="text-[7px] text-red-500/70 uppercase leading-none"
                >
                  {{ t('tetris_label_locked_mob') }}
                </p>
              </div>

              <!-- Stats: lines + combo -->
              <div
                class="border border-white/5 bg-black/40 flex flex-col justify-center gap-1 px-2"
                :class="isEldenMode ? 'er-slot' : ''"
                style="min-width: 64px"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[8px] text-gray-500 uppercase">{{ t('tetris_mob_lines') }}</span>
                  <span class="text-xs font-black text-white/80">{{ lines }}</span>
                </div>
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[8px] text-gray-500 uppercase">{{ t('tetris_mob_combo') }}</span>
                  <span class="text-xs font-black text-accent">{{ combo > 0 ? `${combo}x` : '0x' }}</span>
                </div>
              </div>

              <!-- Next mini -->
              <div
                class="border border-primary/25 bg-black/50 flex flex-col items-center justify-center"
                :class="isEldenMode ? 'er-slot' : ''"
                style="width: 54px; min-width: 54px"
              >
                <p class="text-[8px] text-primary/50 uppercase tracking-widest leading-none mb-0.5">
                  {{ t('tetris_mob_next') }}
                </p>
                <canvas
                  id="tetris-next-mob"
                  ref="nextCanvasMRef"
                  width="40"
                  height="40"
                  class="block"
                  style="background: transparent"
                ></canvas>
              </div>

              <!-- Ranking mobile mini -->
              <div
                class="border border-primary/15 bg-black/40 flex-1 min-w-0 overflow-hidden p-1.5"
                :class="isEldenMode ? 'er-slot' : ''"
              >
                <div class="flex items-center justify-between mb-0.5">
                  <p class="text-[8px] text-primary/50 uppercase tracking-widest">
                    {{ t('tetris_mob_rank') }}
                  </p>
                  <button
                    id="tetris-clear-rank-mob"
                    type="button"
                    @click="clearRanking"
                    class="text-[8px] text-red-500/40 hover:text-red-500 transition uppercase cursor-pointer"
                  >
                    [x]
                  </button>
                </div>
                <div id="tetris-ranking-list-mob" class="overflow-hidden" style="max-height: 36px">
                  <p
                    v-if="!mobileRankings.length"
                    style="font-size: 8px; color: #4b5563; text-align: center; text-transform: uppercase"
                  >
                    —
                  </p>
                  <div
                    v-for="(entry, idx) in mobileRankings"
                    :key="idx"
                    class="flex items-center justify-between py-px border-b border-white/5 gap-1"
                  >
                    <div class="flex items-center gap-1 min-w-0 overflow-hidden">
                      <span class="text-[8px] shrink-0">{{ MEDALS[idx] ?? `${idx + 1}.` }}</span>
                      <span
                        class="text-[8px] uppercase tracking-wider truncate"
                        :class="idx === 0 ? 'text-primary font-black' : 'text-gray-400'"
                      >
                        {{ entry.name }}
                      </span>
                    </div>
                    <span
                      class="text-[8px] font-black shrink-0"
                      :class="idx === 0 ? 'text-primary' : 'text-white/50'"
                    >
                      {{ entry.score.toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ══════════════════════════════════════════════════
              D-PAD INLINE MOBILE — parte do fluxo normal
            ═══════════════════════════════════════════════════════ -->
            <div
              v-show="!isOver"
              id="tetris-dpad"
              class="lg:hidden w-full flex-shrink-0 border-t border-primary/20 bg-black/90"
              style="height: 80px; min-height: 80px; padding: 5px 8px 7px"
            >
              <div class="flex items-center justify-between gap-2 h-full max-w-sm mx-auto">
                <!-- ← → -->
                <div class="flex gap-1.5 items-center h-full">
                  <button
                    id="t-left"
                    type="button"
                    class="tdb touch-manipulation"
                    :class="pressedBtn === 't-left' ? 'tdb--pressed' : ''"
                    style="width: 54px; height: 56px; font-size: 1.15rem"
                    @mousedown="dpadRepeatStart('left', 't-left')"
                    @mouseup="dpadRepeatStop()"
                    @mouseleave="dpadRepeatStop()"
                    @touchstart.passive="dpadRepeatStart('left', 't-left')"
                    @touchend.passive="dpadRepeatStop()"
                    @touchcancel.passive="dpadRepeatStop()"
                  >
                    ◀
                  </button>
                  <button
                    id="t-right"
                    type="button"
                    class="tdb touch-manipulation"
                    :class="pressedBtn === 't-right' ? 'tdb--pressed' : ''"
                    style="width: 54px; height: 56px; font-size: 1.15rem"
                    @mousedown="dpadRepeatStart('right', 't-right')"
                    @mouseup="dpadRepeatStop()"
                    @mouseleave="dpadRepeatStop()"
                    @touchstart.passive="dpadRepeatStart('right', 't-right')"
                    @touchend.passive="dpadRepeatStop()"
                    @touchcancel.passive="dpadRepeatStop()"
                  >
                    ▶
                  </button>
                </div>

                <!-- Centro: ↻ ↺ + HOLD -->
                <div class="flex flex-col items-center h-full justify-between" style="padding: 2px 0">
                  <div class="flex gap-1.5">
                    <button
                      id="t-rot-cw"
                      type="button"
                      class="tdb touch-manipulation"
                      :class="pressedBtn === 't-rot-cw' ? 'tdb--pressed' : ''"
                      style="width: 40px; height: 32px; font-size: 0.95rem; font-weight: 900"
                      @click="rotate(1)"
                      @touchstart.passive="pressedBtn = 't-rot-cw'"
                      @touchend.passive="pressedBtn = null"
                    >
                      ↻
                    </button>
                    <button
                      id="t-rot-ccw"
                      type="button"
                      class="tdb touch-manipulation"
                      :class="pressedBtn === 't-rot-ccw' ? 'tdb--pressed' : ''"
                      style="width: 40px; height: 32px; font-size: 0.95rem; font-weight: 900; opacity: 0.65"
                      @click="rotate(-1)"
                      @touchstart.passive="pressedBtn = 't-rot-ccw'"
                      @touchend.passive="pressedBtn = null"
                    >
                      ↺
                    </button>
                  </div>
                  <button
                    id="t-hold"
                    type="button"
                    class="tdb-accent touch-manipulation"
                    :class="pressedBtn === 't-hold' ? 'tdb--pressed' : ''"
                    style="width: 84px; height: 26px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em"
                    @click="holdAction"
                    @touchstart.passive="pressedBtn = 't-hold'"
                    @touchend.passive="pressedBtn = null"
                  >
                    {{ t('tetris_dpad_hold') }}
                  </button>
                </div>

                <!-- ▼ + SPC -->
                <div class="flex flex-col items-center h-full justify-between" style="padding: 2px 0">
                  <button
                    id="t-soft-down"
                    type="button"
                    class="tdb touch-manipulation"
                    :class="pressedBtn === 't-soft-down' ? 'tdb--pressed' : ''"
                    style="width: 54px; height: 32px; font-size: 1.1rem"
                    @mousedown="dpadRepeatStart('down', 't-soft-down')"
                    @mouseup="dpadRepeatStop()"
                    @mouseleave="dpadRepeatStop()"
                    @touchstart.passive="dpadRepeatStart('down', 't-soft-down')"
                    @touchend.passive="dpadRepeatStop()"
                    @touchcancel.passive="dpadRepeatStop()"
                  >
                    ▼
                  </button>
                  <button
                    id="t-drop"
                    type="button"
                    class="tdb-drop touch-manipulation"
                    :class="pressedBtn === 't-drop' ? 'tdb--pressed' : ''"
                    style="width: 54px; height: 28px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em"
                    @click="hardDrop"
                    @touchstart.passive="pressedBtn = 't-drop'"
                    @touchend.passive="pressedBtn = null"
                  >
                    {{ t('tetris_dpad_spc') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL FOOTER -->
        <div
          class="flex-shrink-0 px-4 border-t flex justify-between items-center"
          :class="isEldenMode ? 'border-[#c9a84c]/40 bg-[#07030e]/90' : 'border-primary'"
          style="height: 32px; min-height: 32px"
        >
          <span class="text-[10px] animate-pulse text-primary/40 uppercase tracking-widest">
            {{ t('challenge_esc_hint') }}
          </span>
          <span class="text-[10px] animate-pulse text-primary/40 uppercase tracking-widest">
            {{ t('challenge_modal_sub') }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tdb {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(var(--color-primary-rgb), 0.32);
  background: rgba(0, 0, 0, 0.72);
  color: rgba(var(--color-primary-rgb), 0.92);
  border-radius: 3px;
  font-family: monospace;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition: all 0.07s;
  user-select: none;
}

.tdb:active,
.tdb.tdb--pressed {
  background: rgba(var(--color-primary-rgb), 0.2);
  border-color: rgba(var(--color-primary-rgb), 1);
  transform: scale(0.88);
}

.tdb-accent {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(var(--color-primary-rgb), 0.52);
  background: rgba(var(--color-primary-rgb), 0.09);
  color: rgba(var(--color-primary-rgb), 1);
  border-radius: 3px;
  font-family: monospace;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition: all 0.07s;
  user-select: none;
}

.tdb-accent:active,
.tdb-accent.tdb--pressed {
  background: rgba(var(--color-primary-rgb), 0.26);
  transform: scale(0.88);
}

.tdb-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.58);
  border-radius: 3px;
  font-family: monospace;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  transition: all 0.07s;
  user-select: none;
}

.tdb-drop:active,
.tdb-drop.tdb--pressed {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.42);
  color: white;
  transform: scale(0.88);
}

#tetris-ranking-list::-webkit-scrollbar,
#tetris-ranking-list-mob::-webkit-scrollbar {
  width: 2px;
}

#tetris-ranking-list::-webkit-scrollbar-track,
#tetris-ranking-list-mob::-webkit-scrollbar-track {
  background: transparent;
}

#tetris-ranking-list::-webkit-scrollbar-thumb,
#tetris-ranking-list-mob::-webkit-scrollbar-thumb {
  background: rgba(var(--color-primary-rgb), 0.3);
}

#tetris-canvas-wrap canvas {
  width: calc(240px * var(--canvas-scale, 1));
  height: calc(480px * var(--canvas-scale, 1));
  display: block;
}

#tetris-root {
  box-sizing: border-box;
}
</style>
