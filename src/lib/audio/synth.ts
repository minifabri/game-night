import type { BuiltinSoundId } from "@/lib/audio/catalog";

/**
 * Game-show effects built from oscillators and filtered noise. Each function
 * schedules its nodes on `ctx` into `dest` and returns how long it lasts (ms),
 * so the engine can duck the music for that long.
 */

interface ToneOpts {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  start?: number;
  dur: number;
  gain?: number;
  attack?: number;
  filter?: number;
}

function tone(ctx: AudioContext, dest: AudioNode, o: ToneOpts) {
  const t0 = ctx.currentTime + (o.start ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.dur);
  const peak = o.gain ?? 0.3;
  const attack = o.attack ?? 0.01;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  let out: AudioNode = g;
  if (o.filter) {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = o.filter;
    g.connect(lp);
    out = lp;
  }
  osc.connect(g);
  out.connect(dest);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

let noiseBuffer: AudioBuffer | null = null;
function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

interface NoiseOpts {
  start?: number;
  dur: number;
  gain?: number;
  filterType?: BiquadFilterType;
  freq?: number;
  q?: number;
  attack?: number;
}

function noise(ctx: AudioContext, dest: AudioNode, o: NoiseOpts) {
  const t0 = ctx.currentTime + (o.start ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filterType ?? "bandpass";
  filter.frequency.value = o.freq ?? 1000;
  filter.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const peak = o.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  src.connect(filter).connect(g).connect(dest);
  src.start(t0, Math.random());
  src.stop(t0 + o.dur + 0.05);
}

const NOTE = {
  C4: 261.63,
  E4: 329.63,
  G4: 392,
  Bb4: 466.16,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
};

function brass(ctx: AudioContext, dest: AudioNode, freq: number, start: number, dur: number, gain = 0.12) {
  tone(ctx, dest, { freq, type: "sawtooth", start, dur, gain, attack: 0.04, filter: 2400 });
  tone(ctx, dest, { freq: freq * 1.003, type: "sawtooth", start, dur, gain: gain * 0.7, attack: 0.05, filter: 1800 });
}

function applause(ctx: AudioContext, dest: AudioNode, start: number, durS: number) {
  const claps = Math.round(durS * 60);
  for (let i = 0; i < claps; i++) {
    const t = start + Math.random() * durS;
    // fade the crowd out over the last third
    const fade = Math.min(1, (start + durS - t) / (durS / 3));
    noise(ctx, dest, {
      start: t,
      dur: 0.04 + Math.random() * 0.05,
      gain: (0.15 + Math.random() * 0.3) * fade,
      freq: 900 + Math.random() * 1800,
      q: 1.2,
    });
  }
}

function drumroll(ctx: AudioContext, dest: AudioNode, durS: number) {
  const hit = 0.045;
  const hits = Math.floor(durS / hit);
  for (let i = 0; i < hits; i++) {
    const progress = i / hits;
    noise(ctx, dest, {
      start: i * hit + Math.random() * 0.006,
      dur: 0.07,
      gain: 0.35 + progress * 0.8,
      freq: 240 + Math.random() * 60,
      q: 0.8,
    });
  }
}

export function playBuiltin(
  ctx: AudioContext,
  dest: AudioNode,
  id: BuiltinSoundId,
  opts: { durationMs?: number } = {}
): number {
  switch (id) {
    case "beep":
      tone(ctx, dest, { freq: 660, type: "triangle", dur: 0.22, gain: 0.45 });
      return 250;
    case "go":
      tone(ctx, dest, { freq: 1320, type: "triangle", dur: 0.7, gain: 0.45 });
      tone(ctx, dest, { freq: 660, type: "square", dur: 0.5, gain: 0.08, filter: 2000 });
      return 750;
    case "tick":
      noise(ctx, dest, { dur: 0.03, gain: 0.35, filterType: "highpass", freq: 3000 });
      tone(ctx, dest, { freq: 1900, dur: 0.05, gain: 0.15 });
      return 80;
    case "buzzer":
      tone(ctx, dest, { freq: 110, type: "sawtooth", dur: 1.2, gain: 0.3, filter: 1400, attack: 0.02 });
      tone(ctx, dest, { freq: 116.5, type: "sawtooth", dur: 1.2, gain: 0.25, filter: 1400, attack: 0.02 });
      tone(ctx, dest, { freq: 55, type: "square", dur: 1.2, gain: 0.1, filter: 600 });
      return 1250;
    case "drumroll": {
      const durS = (opts.durationMs ?? 2600) / 1000;
      drumroll(ctx, dest, durS);
      return durS * 1000 + 100;
    }
    case "stinger":
      noise(ctx, dest, { dur: 1.6, gain: 0.3, filterType: "highpass", freq: 5000, attack: 0.002 });
      noise(ctx, dest, { dur: 0.25, gain: 0.5, freq: 90, q: 0.7 });
      for (const f of [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5]) brass(ctx, dest, f, 0, 1.1, 0.09);
      return 1600;
    case "ding":
      tone(ctx, dest, { freq: NOTE.C6, dur: 0.6, gain: 0.3 });
      tone(ctx, dest, { freq: NOTE.G5 * 2, start: 0.12, dur: 0.9, gain: 0.25 });
      tone(ctx, dest, { freq: NOTE.C6 * 2.01, start: 0.12, dur: 0.5, gain: 0.05 });
      return 1000;
    case "fanfare":
      fanfare(ctx, dest);
      return 2300;
    case "victory":
      fanfare(ctx, dest);
      noise(ctx, dest, { start: 1.1, dur: 2, gain: 0.25, filterType: "highpass", freq: 5000, attack: 0.002 });
      applause(ctx, dest, 1.2, 4);
      return 5200;
    case "applause":
      applause(ctx, dest, 0, 4);
      return 4000;
    case "trombone": {
      const notes = [NOTE.E4, NOTE.E4 * 0.944, NOTE.E4 * 0.891];
      notes.forEach((f, i) => brass(ctx, dest, f / 2, i * 0.45, 0.42, 0.14));
      tone(ctx, dest, { freq: (NOTE.E4 * 0.841) / 2, freqEnd: (NOTE.E4 * 0.79) / 2, type: "sawtooth", start: 1.35, dur: 1.2, gain: 0.14, attack: 0.04, filter: 1200 });
      return 2600;
    }
    case "correct":
      tone(ctx, dest, { freq: NOTE.E5, type: "triangle", dur: 0.18, gain: 0.35 });
      tone(ctx, dest, { freq: NOTE.C6, type: "triangle", start: 0.15, dur: 0.45, gain: 0.35 });
      return 650;
    case "wrong":
      tone(ctx, dest, { freq: 180, type: "square", dur: 0.25, gain: 0.2, filter: 900 });
      tone(ctx, dest, { freq: 140, type: "square", start: 0.3, dur: 0.5, gain: 0.2, filter: 900 });
      return 850;
    case "airhorn":
      for (let i = 0; i < 3; i++) {
        const start = i * 0.28;
        const dur = i === 2 ? 0.9 : 0.22;
        for (const f of [440, 554, 659]) {
          tone(ctx, dest, { freq: f, type: "sawtooth", start, dur, gain: 0.1, attack: 0.01, filter: 3000 });
        }
      }
      return 1500;
    case "boing":
      tone(ctx, dest, { freq: 120, freqEnd: 520, type: "sine", dur: 0.15, gain: 0.4 });
      tone(ctx, dest, { freq: 520, freqEnd: 180, type: "sine", start: 0.15, dur: 0.45, gain: 0.35 });
      return 650;
    case "whoosh": {
      const t0 = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = getNoise(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 2;
      bp.frequency.setValueAtTime(300, t0);
      bp.frequency.exponentialRampToValueAtTime(4000, t0 + 0.35);
      bp.frequency.exponentialRampToValueAtTime(800, t0 + 0.7);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      src.connect(bp).connect(g).connect(dest);
      src.start(t0);
      src.stop(t0 + 0.75);
      return 750;
    }
    case "pause":
      tone(ctx, dest, { freq: NOTE.G5, type: "triangle", dur: 0.3, gain: 0.3 });
      tone(ctx, dest, { freq: NOTE.C5, type: "triangle", start: 0.22, dur: 0.6, gain: 0.3 });
      return 850;
    case "resume":
      tone(ctx, dest, { freq: NOTE.C5, type: "triangle", dur: 0.3, gain: 0.3 });
      tone(ctx, dest, { freq: NOTE.G5, type: "triangle", start: 0.22, dur: 0.6, gain: 0.3 });
      return 850;
  }
}

function fanfare(ctx: AudioContext, dest: AudioNode) {
  const seq: [number, number, number][] = [
    [NOTE.G4, 0, 0.16],
    [NOTE.C5, 0.18, 0.16],
    [NOTE.E5, 0.36, 0.16],
    [NOTE.G5, 0.54, 0.4],
    [NOTE.E5, 0.98, 0.14],
    [NOTE.G5, 1.14, 1.1],
  ];
  for (const [f, start, dur] of seq) brass(ctx, dest, f, start, dur, 0.13);
  for (const f of [NOTE.C4, NOTE.E4, NOTE.G4]) brass(ctx, dest, f, 1.14, 1.1, 0.07);
  tone(ctx, dest, { freq: NOTE.Bb4 / 4, type: "triangle", start: 1.14, dur: 1.1, gain: 0.2 });
}
