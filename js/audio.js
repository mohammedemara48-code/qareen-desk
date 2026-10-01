/** Web Audio synth — ambient, UI, phone, radio dispatch */

let ctx = null;
let master = null;
let ambientNodes = [];
let muted = false;
let volume = 0.35;
let tickTimer = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(ctx.destination);
  return ctx;
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = muted ? 0 : volume;
  try { localStorage.setItem("qareen-audio-muted", muted ? "1" : "0"); } catch {}
}

export function isMuted() { return muted; }

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master && !muted) master.gain.value = volume;
  try { localStorage.setItem("qareen-audio-vol", String(volume)); } catch {}
}

export function getVolume() { return volume; }

export function loadAudioPrefs() {
  try {
    muted = localStorage.getItem("qareen-audio-muted") === "1";
    const v = parseFloat(localStorage.getItem("qareen-audio-vol"));
    if (!Number.isNaN(v)) volume = v;
  } catch {}
}

export async function resume() {
  const c = ensure();
  if (c && c.state === "suspended") await c.resume();
}

function beep(freq, dur, type = "sine", gain = 0.08, delay = 0) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain = 0.04, filterFreq = 800) {
  const c = ensure();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = filterFreq;
  const g = c.createGain();
  const t0 = c.currentTime;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start();
  src.stop(t0 + dur + 0.02);
}

export function click() {
  beep(420, 0.04, "square", 0.04);
  beep(280, 0.05, "triangle", 0.03, 0.01);
}

export function stamp() {
  noiseBurst(0.12, 0.09, 120);
  beep(90, 0.15, "sine", 0.12);
  beep(55, 0.2, "triangle", 0.08, 0.02);
}

export function ring() {
  for (let i = 0; i < 4; i++) {
    beep(680, 0.14, "sine", 0.07, i * 0.4);
    beep(880, 0.14, "sine", 0.055, i * 0.4 + 0.14);
  }
}

/** Incoming hotline — longer insistent ring */
export function incomingRing() {
  for (let i = 0; i < 6; i++) {
    beep(720, 0.16, "sine", 0.08, i * 0.45);
    beep(960, 0.16, "sine", 0.06, i * 0.45 + 0.16);
  }
  noiseBurst(0.08, 0.025, 2400);
}

export function alertBeep() {
  beep(920, 0.08, "square", 0.05);
  beep(720, 0.1, "square", 0.045, 0.1);
}

export function tick() {
  beep(1100, 0.025, "square", 0.03);
}

export function phoneStatic() {
  noiseBurst(0.45, 0.055, 1800);
  beep(340, 0.28, "sawtooth", 0.022);
}

/** Soft voice bed under typed transcript */
export function voiceBed(seconds = 2.2) {
  const c = ensure();
  if (!c || !master) return;
  const t0 = c.currentTime;
  const o = c.createOscillator();
  const o2 = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  o.type = "sawtooth";
  o2.type = "triangle";
  o.frequency.value = 160;
  o2.frequency.value = 180;
  f.type = "bandpass";
  f.frequency.value = 900;
  f.Q.value = 2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.15);
  g.gain.setValueAtTime(0.03, t0 + seconds * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  o.connect(f);
  o2.connect(f);
  f.connect(g);
  g.connect(master);
  noiseBurst(seconds * 0.9, 0.025, 2200);
  o.start(t0);
  o2.start(t0);
  o.stop(t0 + seconds + 0.05);
  o2.stop(t0 + seconds + 0.05);
}

/** Police radio squelch + short voice bed */
export function radioOpen() {
  noiseBurst(0.08, 0.07, 3000);
  beep(400, 0.06, "square", 0.04);
  noiseBurst(0.2, 0.04, 1500);
}

export function radioCallback(seconds = 2.5) {
  radioOpen();
  const c = ensure();
  if (!c || !master) return;
  setTimeout(() => {
    voiceBed(seconds);
    beep(380, 0.05, "square", 0.03, 0);
    beep(380, 0.05, "square", 0.03, seconds + 0.1);
    noiseBurst(0.06, 0.05, 2800);
  }, 200);
}

export function dispatchBlip() {
  beep(520, 0.08, "square", 0.05);
  beep(390, 0.1, "square", 0.04, 0.1);
  noiseBurst(0.15, 0.04, 1200);
}

export function startLowTick(active) {
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  if (!active) return;
  tickTimer = setInterval(() => { if (!muted) tick(); }, 1000);
}

export function startAmbient() {
  const c = ensure();
  if (!c || !master || ambientNodes.length) return;
  const makeDrone = (freq, type, gainVal, lfoRate) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gainVal;
    lfo.frequency.value = lfoRate;
    lg.gain.value = gainVal * 0.35;
    lfo.connect(lg);
    lg.connect(g.gain);
    o.connect(g);
    g.connect(master);
    o.start();
    lfo.start();
    ambientNodes.push(o, lfo, g);
  };
  makeDrone(55, "sine", 0.028, 0.08);
  makeDrone(82.5, "triangle", 0.012, 0.05);
  makeDrone(110, "sine", 0.008, 0.12);
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 2000;
  const g = c.createGain();
  g.gain.value = 0.012;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
  ambientNodes.push(src, g);
}

export function stopAmbient() {
  ambientNodes.forEach((n) => {
    try { if (n.stop) n.stop(); if (n.disconnect) n.disconnect(); } catch {}
  });
  ambientNodes = [];
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
}
