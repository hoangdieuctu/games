// ── Âm thanh tự tổng hợp (Web Audio) + lời đọc ──
// Lời đọc: clip giọng nơ-ron sinh sẵn (art/gen-voice.mjs → public/assets/voice/); câu nào chưa có clip
// thì rơi về Speech Synthesis của máy.
// Không dùng file nhạc có bản quyền: mọi tiếng đều sinh bằng sóng âm, nhẹ nhàng, không gắt.
// Chỉ bật sau lần chạm đầu tiên của người chơi (trình duyệt chặn tự phát).
import { Store } from './Store.js';
import { ASSET_BASE } from './AssetLoader.js';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: any = null;
let musicStep = 0;
let viVoice: SpeechSynthesisVoice | null = null;
let voiceGain: GainNode | null = null;

// ── giọng đọc sinh sẵn ── (splitSpeech / speechKey phải giống hệt art/gen-voice.mjs)
const VOICE_DIR = ASSET_BASE + 'voice/';
const splitSpeech = (t: string) => t.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
const speechKey = (s: string) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
let clips: Record<string, string> | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let speakToken = 0;
let speaking: AudioBufferSourceNode[] = [];
fetch(VOICE_DIR + 'index.json').then((r) => r.ok ? r.json() : null).then((j) => { clips = j?.clips || null; }).catch(() => {});

function clipBuffer(file: string): Promise<AudioBuffer | null> {
  let p = buffers.get(file);
  if (!p) {
    p = fetch(VOICE_DIR + file).then((r) => r.arrayBuffer())
      .then((b) => new Promise<AudioBuffer>((ok, bad) => ctx!.decodeAudioData(b, ok, bad)))
      .catch(() => { buffers.delete(file); return null; });
    buffers.set(file, p);
  }
  return p;
}
function stopSpeaking() {
  speakToken++;
  for (const s of speaking) { try { s.stop(); } catch (e) { /* đã dừng */ } }
  speaking = [];
  try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch (e) { /* */ }
}

function ensure(): AudioContext | null {
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx!.createGain(); master.connect(ctx!.destination);
    musicGain = ctx!.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    voiceGain = ctx!.createGain(); voiceGain.gain.value = 1.15; voiceGain.connect(master);
    Audio.applySettings();
  }
  if (ctx!.state === 'suspended') ctx!.resume();
  return ctx;
}

function tone(freq: number, t0: number, dur: number, { type = 'sine', vol = 0.25, attack = 0.01, slide = 0, dest = null as any } = {}) {
  const c = ctx!; const o = c.createOscillator(); const g = c.createGain();
  o.type = type as OscillatorType;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || master!);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// giai điệu nền: ngũ cung Đô trưởng, chậm, như hộp nhạc
const MELODY = [72, 76, 79, 76, 74, 72, 69, 72, 74, 76, 74, 72, 67, 69, 72, -1];
const BASS = [48, 48, 45, 45, 43, 43, 45, 45];

function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    viVoice = vs.find((v) => /^vi/i.test(v.lang)) || null;
  } catch (e) { viVoice = null; }
}
if (typeof speechSynthesis !== 'undefined') { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

export const Audio = {
  unlock() { ensure(); if (Store.settings.music) this.startMusic(); },

  applySettings() {
    const s = Store.settings;
    if (master) master.gain.value = s.sound ? s.volume : 0;
    if (musicGain && ctx) musicGain.gain.setTargetAtTime(s.music && s.sound ? 0.32 : 0, ctx.currentTime, 0.3);
    if (s.music && s.sound) this.startMusic(); else this.stopMusic();
  },

  sfx(name: 'tap' | 'pop' | 'good' | 'soft' | 'reward' | 'flip' | 'snap' | 'place' | 'unlock' | 'whoosh' | 'plant' | 'bloop' | 'munch' | 'bubble' | 'splash' | 'yawn') {
    if (!Store.settings.sound) return;
    const c = ensure(); if (!c) return;
    const t = c.currentTime + 0.01;
    switch (name) {
      case 'tap': tone(660, t, 0.08, { type: 'triangle', vol: 0.15 }); break;
      case 'pop': tone(520, t, 0.12, { type: 'sine', vol: 0.25, slide: 1.8 }); break;
      case 'flip': tone(380, t, 0.09, { type: 'triangle', vol: 0.14, slide: 1.5 }); break;
      case 'snap': tone(880, t, 0.07, { type: 'square', vol: 0.06 }); tone(1320, t + 0.05, 0.12, { type: 'sine', vol: 0.18 }); break;
      case 'place': tone(300, t, 0.12, { type: 'sine', vol: 0.3, slide: 0.6 }); tone(600, t + 0.02, 0.08, { type: 'triangle', vol: 0.08 }); break;
      case 'good': [72, 76, 79].forEach((n, i) => tone(NOTE(n), t + i * 0.08, 0.25, { type: 'triangle', vol: 0.18 })); break;
      case 'soft': tone(330, t, 0.22, { type: 'sine', vol: 0.14, slide: 0.85 }); break;
      case 'bloop': tone(240, t, 0.25, { type: 'sine', vol: 0.22, slide: 2.2 }); break;
      case 'plant': tone(200, t, 0.15, { type: 'triangle', vol: 0.2, slide: 0.7 }); tone(NOTE(79), t + 0.15, 0.3, { type: 'sine', vol: 0.12 }); break;
      case 'munch': [0, 0.16, 0.32].forEach((d) => { tone(170, t + d, 0.09, { type: 'square', vol: 0.05, slide: 0.7 }); tone(260, t + d + 0.03, 0.06, { type: 'triangle', vol: 0.1 }); }); break;
      case 'bubble': for (let i = 0; i < 4; i++) tone(600 + Math.random() * 500, t + i * 0.06, 0.08, { type: 'sine', vol: 0.1, slide: 1.6 }); break;
      case 'splash': tone(900, t, 0.25, { type: 'sine', vol: 0.12, slide: 0.3 }); tone(300, t + 0.05, 0.3, { type: 'sine', vol: 0.15, slide: 2 }); break;
      case 'yawn': tone(420, t, 0.7, { type: 'sine', vol: 0.12, slide: 0.55, attack: 0.15 }); break;
      case 'whoosh': {
        const n = c.sampleRate * 0.35; const b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n) * 0.5;
        const src = c.createBufferSource(); src.buffer = b;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
        const g = c.createGain(); g.gain.value = 0.25;
        src.connect(f); f.connect(g); g.connect(master!); src.start(t);
        break;
      }
      case 'reward': [72, 76, 79, 84, 88].forEach((n, i) => tone(NOTE(n), t + i * 0.09, 0.5, { type: 'triangle', vol: 0.16 })); tone(NOTE(96), t + 0.5, 0.6, { type: 'sine', vol: 0.06 }); break;
      case 'unlock': [67, 72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), t + i * 0.12, 0.7, { type: 'sine', vol: 0.15 })); break;
    }
  },

  /** Một nốt đơn (Hz) — dùng cho trò có nhạc. */
  tone(freq: number, dur = 0.25, vol = 0.12) {
    if (!Store.settings.sound) return;
    const c = ensure(); if (!c) return;
    tone(freq, c.currentTime + 0.01, dur, { type: 'triangle', vol });
  },

  startMusic() {
    if (musicTimer || !ctx || !Store.settings.music || !Store.settings.sound) return;
    const beat = 0.42;
    let next = ctx.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!ctx) return;
      while (next < ctx.currentTime + 0.6) {
        const m = MELODY[musicStep % MELODY.length];
        if (m > 0) tone(NOTE(m), next, beat * 1.6, { type: 'sine', vol: 0.1, attack: 0.02, dest: musicGain });
        if (musicStep % 2 === 0) tone(NOTE(BASS[(musicStep / 2) % BASS.length]), next, beat * 2.2, { type: 'triangle', vol: 0.07, attack: 0.04, dest: musicGain });
        musicStep++; next += beat;
      }
    }, 150);
    if (musicGain) musicGain.gain.setTargetAtTime(0.32, ctx.currentTime, 0.5);
  },
  stopMusic() { clearInterval(musicTimer); musicTimer = null; },

  /** Đọc câu hướng dẫn bằng clip giọng nơ-ron; thiếu clip thì dùng Speech Synthesis của máy. */
  say(text: string) {
    if (!Store.settings.voice || !Store.settings.sound) return;
    stopSpeaking();
    // tên bé do người dùng nhập → clip đọc "bé"
    const name = Store.p?.name?.trim();
    const spoken = name ? text.split(name).join('bé') : text;
    const files = splitSpeech(spoken).map((s) => clips?.[speechKey(s)]);
    const c = ensure();
    if (c && files.length && files.every(Boolean)) { this.playClips(files as string[], text); return; }
    if (clips) console.warn('[voice] chưa có clip:', splitSpeech(spoken).filter((s) => !clips![speechKey(s)]));
    this.synth(text);
  },

  async playClips(files: string[], text: string) {
    const token = speakToken;
    const bufs = await Promise.all(files.map(clipBuffer));
    if (token !== speakToken || !ctx || !voiceGain) return;
    if (bufs.some((b) => !b)) { this.synth(text); return; }
    let t = ctx.currentTime + 0.03;
    // nhạc nền nhỏ lại trong lúc đọc
    const total = bufs.reduce((s, b) => s + b!.duration + 0.12, 0);
    if (musicGain && Store.settings.music) {
      musicGain.gain.setTargetAtTime(0.12, t, 0.08);
      musicGain.gain.setTargetAtTime(0.32, t + total, 0.4);
    }
    for (const b of bufs) {
      const src = ctx.createBufferSource(); src.buffer = b!;
      src.connect(voiceGain); src.start(t);
      speaking.push(src);
      t += b!.duration + 0.12;
    }
  },

  synth(text: string) {
    if (typeof speechSynthesis === 'undefined') return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[!?.]+/g, (m) => m[0]));
      u.lang = 'vi-VN'; if (viVoice) u.voice = viVoice;
      u.rate = 0.92; u.pitch = 1.15; u.volume = Math.min(1, Store.settings.volume + 0.2);
      speechSynthesis.speak(u);
    } catch (e) { /* không có giọng đọc: vẫn hiện chữ */ }
  },
  get hasVoice() { return !!viVoice || !!clips; },
  get hasVoice() { return !!viVoice; },
};
