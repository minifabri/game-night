"use client";

import { parseBuiltin } from "@/lib/audio/catalog";
import { playBuiltin } from "@/lib/audio/synth";

const DUCK_FACTOR = 0.3;
/** Effects at least this long pause music that can't be ducked (Spotify). */
const LONG_EFFECT_MS = 2000;
/** Keeps the music paused across back-to-back long effects instead of flickering. */
const HOLD_RELEASE_MS = 300;

/**
 * Browser-side audio output shared by the whole page: one looping music
 * element plus fire-and-forget effects (synthesized or from a URL). Music is
 * ducked while an effect plays so announcements stay audible. Long effects
 * also raise a "hold" that players without a volume control (Spotify) obey by
 * pausing.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private musicUrl: string | null = null;
  private musicVolume = 0.6;
  private sfxVolume = 0.9;
  private muted = false;
  private ducks = 0;
  private activeClips = new Set<HTMLAudioElement>();
  private holds = new Set<symbol>();
  private listeners = new Set<() => void>();

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.ctx.onstatechange = () => this.emit();
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.ctx.destination);
      this.applyVolumes();
    }
    return this.ctx;
  }

  /** Must run inside a user gesture the first time (browser autoplay policy). */
  async unlock(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx && ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        // still locked — the unlock prompt stays up
      }
    }
    // a paused-but-wanted track couldn't start before the gesture
    if (this.music && this.music.paused && this.music.dataset.wanted === "1") {
      this.music.play().catch(() => {});
    }
    this.emit();
  }

  /** True while a long effect plays: music that can't be ducked should pause. */
  isHoldingMusic(): boolean {
    return this.holds.size > 0;
  }

  private hold(): () => void {
    const token = Symbol();
    this.holds.add(token);
    if (this.holds.size === 1) this.emit();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setTimeout(() => {
        if (this.holds.delete(token) && this.holds.size === 0) this.emit();
      }, HOLD_RELEASE_MS);
    };
  }

  isUnlocked(): boolean {
    return this.ctx?.state === "running";
  }

  /** Try to start without a gesture (works on kiosk/autoplay-enabled browsers). */
  probe(): void {
    const ctx = this.ensureContext();
    ctx?.resume().then(() => this.emit(), () => {});
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  setVolumes(v: { music?: number; sfx?: number; muted?: boolean }) {
    if (v.music !== undefined) this.musicVolume = v.music;
    if (v.sfx !== undefined) this.sfxVolume = v.sfx;
    if (v.muted !== undefined) this.muted = v.muted;
    this.applyVolumes();
  }

  private applyVolumes() {
    const sfx = this.muted ? 0 : this.sfxVolume;
    if (this.sfxBus && this.ctx) this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.02);
    this.activeClips.forEach((clip) => (clip.volume = sfx));
    if (this.music) {
      const duck = this.ducks > 0 ? DUCK_FACTOR : 1;
      this.music.volume = this.muted ? 0 : clamp01(this.musicVolume * duck);
    }
  }

  private duckFor(ms: number) {
    this.ducks++;
    this.applyVolumes();
    setTimeout(() => {
      this.ducks = Math.max(0, this.ducks - 1);
      this.applyVolumes();
    }, ms);
  }

  /**
   * Plays a `builtin:<id>` effect, or an audio file when `url` is given.
   * `holdMusic` pauses un-duckable music for this effect whatever its length.
   */
  playEffect(target: { ref: string; url?: string | null }, opts: { durationMs?: number; holdMusic?: boolean } = {}) {
    const builtin = parseBuiltin(target.ref);
    if (builtin) {
      const ctx = this.ensureContext();
      if (!ctx || !this.sfxBus || ctx.state !== "running") return;
      const ms = playBuiltin(ctx, this.sfxBus, builtin, opts);
      this.duckFor(ms);
      if (opts.holdMusic || ms >= LONG_EFFECT_MS) setTimeout(this.hold(), ms);
      return;
    }
    if (!target.url) return;
    const clip = new Audio(target.url);
    clip.volume = this.muted ? 0 : this.sfxVolume;
    this.activeClips.add(clip);
    this.ducks++;
    this.applyVolumes();
    let release: (() => void) | null = opts.holdMusic ? this.hold() : null;
    clip.addEventListener("loadedmetadata", () => {
      // Infinity (a stream) counts as long; NaN (unknown) doesn't
      if (!release && this.activeClips.has(clip) && clip.duration * 1000 >= LONG_EFFECT_MS) release = this.hold();
    });
    const done = () => {
      release?.();
      if (!this.activeClips.delete(clip)) return;
      this.ducks = Math.max(0, this.ducks - 1);
      this.applyVolumes();
    };
    clip.addEventListener("ended", done);
    clip.addEventListener("error", done);
    clip.play().catch(done);
  }

  stopEffects() {
    this.activeClips.forEach((clip) => {
      clip.pause();
      clip.dispatchEvent(new Event("ended"));
    });
    // synthesized effects are already scheduled; cut them by rebuilding the bus
    if (this.ctx && this.sfxBus) {
      this.sfxBus.disconnect();
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.connect(this.ctx.destination);
    }
    this.ducks = 0;
    this.applyVolumes();
    if (this.holds.size > 0) {
      this.holds.clear();
      this.emit();
    }
  }

  /** Syncs the music player to the desired state; `restart` rewinds to the start. */
  setMusic(desired: { url: string | null; status: "playing" | "paused" | "stopped"; loop: boolean; restart: boolean }) {
    if (typeof window === "undefined") return;
    if (!desired.url || desired.status === "stopped") {
      if (this.music) {
        this.music.pause();
        this.music.currentTime = 0;
        this.music.dataset.wanted = "0";
      }
      return;
    }
    if (!this.music) this.music = new Audio();
    const music = this.music;
    if (this.musicUrl !== desired.url) {
      music.src = desired.url;
      this.musicUrl = desired.url;
    } else if (desired.restart) {
      music.currentTime = 0;
    }
    music.loop = desired.loop;
    this.applyVolumes();
    if (desired.status === "playing") {
      music.dataset.wanted = "1";
      if (music.paused) music.play().catch(() => {});
    } else {
      music.dataset.wanted = "0";
      music.pause();
    }
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
