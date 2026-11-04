import { LOOP, TAU, hash, T } from './config.js';

/**
 * 8-bit sound: pulse + triangle + noise through the WebAudio API, no samples.
 * Everything is triggered by the visual clock crossing a time, so seeking or freezing (?t=) is silent
 * and the soundtrack always matches what is on screen.
 */
const MIDI = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CHORD_ROOT = [45, 41, 48, 43];            // Am F C G, one bar = 2 s
const CHORD_IV = [[0, 3, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12], [0, 4, 7, 12]];
const PENTA = [0, 3, 5, 7, 10];                // minor pentatonic for the melody
const STEP = 0.25;                              // eighth note at 60 bpm; one chord = 8 steps = 4 s

export function createAudio() {
  let ctx = null, master = null, sfxBus = null, musicMode = false, noiseBuf = null, enabled = true, last = 0, unlocked = false;
  const waves = {};
  const pulseWave = (d) => {
    if (waves[d]) return waves[d];
    const N = 24, re = new Float32Array(N + 1), im = new Float32Array(N + 1);
    for (let n = 1; n <= N; n++) im[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * d); // sine series of a pulse with duty d
    return (waves[d] = ctx.createPeriodicWave(re, im));
  };
  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination); sfxBus = ctx.createGain(); sfxBus.gain.value = 0.38; sfxBus.connect(master); // sound effects mix well below the music
    const len = ctx.sampleRate * 1.5; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = noiseBuf.getChannelData(0);
    let v = 0; for (let i = 0; i < len; i++) { if (i % 3 === 0) v = Math.random() * 2 - 1; d[i] = Math.round(v * 8) / 8; } // sample-and-hold, 3-bit crush
  }
  const tone = (freq, dur, { type = 'pulse', duty = 0.5, vol = 0.5, slide = 0, attack = 0.005, rel = 0.05, vib = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
    if (type === 'pulse') o.setPeriodicWave(pulseWave(duty)); else o.type = type;
    o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * Math.pow(2, slide)), t0 + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = freq * vib; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + rel); }
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack); g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + rel);
    o.connect(g); g.connect(musicMode ? master : sfxBus); o.start(t0); o.stop(t0 + dur + rel + 0.02);
  };
  const noise = (dur, { vol = 0.4, hp = 2000, lp = 9000, slide = 0, at = 0 } = {}) => {
    if (!ctx || !enabled) return; const t0 = ctx.currentTime + at, s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    s.buffer = noiseBuf; s.loop = true; f.type = 'highpass'; f.frequency.value = hp; f2.type = 'lowpass'; f2.frequency.setValueAtTime(lp, t0); if (slide) f2.frequency.exponentialRampToValueAtTime(Math.max(80, lp * Math.pow(2, slide)), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); s.connect(f); f.connect(f2); f2.connect(g); g.connect(musicMode ? master : sfxBus); s.start(t0); s.stop(t0 + dur + 0.02);
  };
  // ---------------------------------------------------------------- sound effects
  const sfx = {
    vanish: () => { for (let k = 0; k < 8; k++) tone(MIDI(96 - k * 3), 0.14, { duty: 0.125, vol: 0.2, at: k * 0.07, rel: 0.1 }); noise(0.8, { vol: 0.18, hp: 3000, lp: 9000, slide: -2 }); },
    appear: () => { for (let k = 0; k < 8; k++) tone(MIDI(72 + k * 3), 0.2, { duty: 0.125, vol: 0.2, at: k * 0.09, rel: 0.15 }); [60, 67, 72, 76].forEach((m) => tone(MIDI(m), 1.6, { type: 'triangle', vol: 0.3, rel: 0.5, at: 0.5 })); },
    click: () => { noise(0.012, { vol: 0.35, hp: 2500 }); tone(1800, 0.015, { duty: 0.5, vol: 0.12, rel: 0.005 }); },
    sounder: () => { noise(0.02, { vol: 0.3, hp: 1200, lp: 4000 }); tone(MIDI(55), 0.04, { type: 'triangle', vol: 0.3 }); },
    clink: () => { tone(MIDI(96), 0.08, { duty: 0.125, vol: 0.1, rel: 0.05 }); tone(MIDI(100), 0.1, { duty: 0.125, vol: 0.08, at: 0.05, rel: 0.06 }); },
    tick: () => noise(0.01, { vol: 0.08, hp: 4000 }),
    gasp: () => { tone(MIDI(70), 0.12, { duty: 0.25, vol: 0.2, slide: 0.6 }); },
    page: () => { noise(0.25, { vol: 0.12, hp: 2500, lp: 8000, slide: -1 }); },
    bell: () => { [72, 79].forEach((m, i) => tone(MIDI(m), 1.4, { duty: 0.125, vol: 0.18, rel: 0.7, at: i * 0.02 })); },
    cluck: () => { tone(MIDI(79), 0.05, { duty: 0.25, vol: 0.12, slide: 0.5 }); tone(MIDI(83), 0.07, { duty: 0.25, vol: 0.1, at: 0.07, slide: -0.4 }); },
    clang: () => { tone(MIDI(88), 0.12, { duty: 0.125, vol: 0.1, rel: 0.1 }); noise(0.05, { vol: 0.12, hp: 3000 }); },
    type: () => { noise(0.012, { vol: 0.22, hp: 1500, lp: 5000 }); tone(900, 0.01, { duty: 0.5, vol: 0.05, rel: 0.004 }); },
    scratch: () => noise(0.06, { vol: 0.05, hp: 3500, lp: 7000 }),
    whoosh: () => { for (let k = 0; k < 10; k++) tone(MIDI(72 + k * 2), 0.12, { duty: 0.125, vol: 0.1, at: k * 0.08, rel: 0.1 }); noise(0.9, { vol: 0.08, hp: 2500, lp: 8000, slide: 1 }); },
    chime: () => { [84, 88, 91].forEach((m, i) => tone(MIDI(m), 0.5, { duty: 0.125, vol: 0.1, at: i * 0.1, rel: 0.3 })); },
    laugh: () => { for (let k = 0; k < 4; k++) tone(MIDI(40 + (k % 2) * 3), 0.1, { duty: 0.25, vol: 0.2, at: k * 0.16, slide: -0.3 }); },
    roar: () => { noise(1.6, { vol: 0.3, hp: 200, lp: 3000, slide: -1.5 }); tone(MIDI(33), 1.5, { type: 'triangle', vol: 0.4, rel: 0.6, slide: -0.5 }); },
    dust: () => { noise(2.6, { vol: 0.1, hp: 1500, lp: 6000, slide: 0.8 }); [72, 79, 84, 88].forEach((m, i) => tone(MIDI(m), 1.2, { type: 'triangle', vol: 0.12, at: i * 0.5, rel: 0.5 })); },
    chirp: () => { const f = 1800 + 900 * Math.random(); tone(f, 0.05, { duty: 0.25, vol: 0.06, slide: 0.5 }); tone(f * 1.3, 0.06, { duty: 0.25, vol: 0.05, at: 0.08, slide: -0.4 }); },
    screech: () => { tone(MIDI(88), 0.4, { duty: 0.25, vol: 0.12, slide: -0.8, vib: 0.02 }); noise(0.3, { vol: 0.08, hp: 2500, lp: 7000, slide: -1 }); },
    caw: () => { tone(MIDI(76), 0.12, { duty: 0.125, vol: 0.1, slide: 0.4 }); tone(MIDI(72), 0.15, { duty: 0.125, vol: 0.1, at: 0.14, slide: -0.5 }); },
    snap: () => { noise(0.04, { vol: 0.25, hp: 1500, lp: 6000 }); tone(MIDI(52), 0.06, { duty: 0.25, vol: 0.2, slide: -0.6 }); },
    creak: () => { tone(MIDI(40), 1.2, { duty: 0.125, vol: 0.12, slide: 0.35, vib: 0.03 }); noise(0.6, { vol: 0.06, hp: 400, lp: 1800 }); },
    crack: () => { noise(0.18, { vol: 0.4, hp: 500, lp: 5000, slide: -1 }); tone(MIDI(36), 0.2, { duty: 0.25, vol: 0.3, slide: -0.5 }); },
    thud: () => { noise(0.25, { vol: 0.35, hp: 60, lp: 700, slide: -1 }); tone(MIDI(30), 0.3, { type: 'triangle', vol: 0.4, slide: -0.5 }); },
    hit: () => { noise(0.2, { vol: 0.3, hp: 300, lp: 3000, slide: -1 }); tone(MIDI(45), 0.3, { duty: 0.25, vol: 0.25, slide: -0.7 }); },
    oracle: () => { [76, 83, 88, 95].forEach((m, i) => tone(MIDI(m), 0.9, { type: 'triangle', vol: 0.12, at: i * 0.12, rel: 0.5 })); },
    shush: () => noise(0.5, { vol: 0.07, hp: 2500, lp: 8000, slide: -1 }),
    howl: () => { tone(MIDI(40), 1.4, { duty: 0.25, vol: 0.14, slide: 0.3, vib: 0.02 }); noise(1.2, { vol: 0.05, hp: 200, lp: 900 }); },
  };
  // ---------------------------------------------------------------- music: marimba-like pulses over a droning pad, thinner during the dive
  const ROOT = [45, 43, 40, 43], MEL = [[69, 0, 72, 0, 76, 0, 72, 0], [67, 0, 71, 0, 74, 0, 71, 0], [64, 0, 67, 0, 71, 0, 67, 0], [67, 0, 64, 0, 62, 0, 0, 0]];
  const stepNote = (s) => {
    const t = s * STEP, bar = Math.floor(s / 8), pos = s % 8, bi = bar % 4, root = ROOT[bi];
    const dive = t >= 51 && t < 60, calm = !dive;
    if (pos === 0) { tone(MIDI(root), 1.9, { type: 'triangle', vol: 0.3, rel: 0.6 }); tone(MIDI(root + 7), 1.9, { type: 'triangle', vol: 0.12, rel: 0.6 }); }
    if (calm) { const m = MEL[bi][pos]; if (m) tone(MIDI(m + 12), 0.28, { duty: 0.125, vol: 0.1, rel: 0.15 }); if (pos % 4 === 2) tone(MIDI(root + 12), 0.2, { type: 'triangle', vol: 0.12, rel: 0.1 }); }
    else { if (pos % 2 === 0) tone(MIDI(root + 24 + (s % 3) * 2), 0.12, { duty: 0.25, vol: 0.09, rel: 0.06 }); if (pos === 0 || pos === 4) tone(MIDI(root - 12), 0.4, { type: 'triangle', vol: 0.35, rel: 0.1 }); }
  };
  const crossed = (a, b, x) => x > a && x <= b;
  function fire(a, b) {
    musicMode = true; for (let s = Math.floor(a / STEP) + 1; s <= Math.floor(b / STEP); s++) stepNote(s); musicMode = false;
    const ev = [[T.ghostBeetle0, 'oracle'], [T.land, 'tick'], [T.snap, 'snap'], [T.ghostHit0, 'oracle'], [T.takeoff, 'screech'], [T.crack - 0.4, 'creak'], [T.crack, 'crack'], [T.hit, 'hit'], [T.impact, 'thud'], [T.eagleUp, 'caw'], [T.rotDust0, 'shush'], [T.regrow0, 'oracle'], [T.approach0, 'howl']];
    for (const [x, n] of ev) if (crossed(a, b, x)) sfx[n]();
    for (let q = 0.7; q < 90; q += 1.3 + 2.2 * hash(q * 5)) if (crossed(a, b, q) && !(q > T.takeoff - 1 && q < T.impact + 1)) sfx.chirp();
    for (const q of [12, 31, 49, 72, 83]) if (crossed(a, b, q)) sfx.caw();
    for (let q = 0.5; q < 90; q += 3.1) if (crossed(a, b, q)) sfx.tick();
  }
  function update(t) {
    if (!ctx || !enabled || ctx.state !== 'running') { last = t; return; }
    if (t < last - 1) { last = t; return; }
    if (t - last > 0.5 || t === last) { last = t; return; }
    fire(last, t); last = t;
  }
  function unlock() { init(); if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); unlocked = true; }
  return { update, unlock, setLamps() {}, setEnabled(v) { enabled = v; if (ctx) { if (v && ctx.state === 'suspended') ctx.resume(); master.gain.value = v ? 0.22 : 0; } }, get enabled() { return enabled; }, get running() { return !!ctx && ctx.state === 'running'; } };
}
