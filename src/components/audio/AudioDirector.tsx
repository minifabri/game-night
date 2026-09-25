"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useTick, msUntil } from "@/hooks/useTick";
import { getAudioEngine } from "@/lib/audio/engine";
import { parseBuiltin, resolveAutoRef, type AutoEventId } from "@/lib/audio/catalog";
import { parseSpotify, spotifyUri } from "@/lib/audio/spotify";
import { SpotifyPlayer } from "@/components/audio/SpotifyPlayer";
import { DRAW_SHUFFLE_MS, FINAL_SUSPENSE_MS } from "@/lib/constants";
import type { AudioState, GameState, Sound, SoundRef, TeamTotals } from "@/lib/types";

interface AudioDirectorProps {
  gameState: GameState;
  totals: TeamTotals;
  /** null when the audio migration isn't applied: auto effects still run on defaults. */
  audioState: AudioState | null;
  sounds: Sound[];
  /** Show the "tap to enable audio" prompt while the browser blocks playback. */
  showUnlock?: boolean;
  /** Spotify's player floats in a corner (the TV) instead of sitting inline. */
  floatingPlayer?: boolean;
}

/**
 * Turns shared state into sound on this device: the console's commands
 * (music, pad effects, stop) and the automatic effects tied to game events.
 * Events are derived from timestamps like the scenes are, so they fire in
 * sync with what's on screen — and never for a state that was already in
 * progress when the page loaded.
 */
export function AudioDirector({ gameState, totals, audioState, sounds, showUnlock, floatingPlayer }: AudioDirectorProps) {
  const engine = getAudioEngine();
  const now = useTick(100);
  const unlocked = useSyncExternalStore(
    (fn) => engine.subscribe(fn),
    () => engine.isUnlocked(),
    () => false
  );

  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  const play = useCallback(
    (ref: SoundRef, opts?: { durationMs?: number }) => {
      const url = parseBuiltin(ref) ? null : soundsRef.current.find((s) => s.id === ref)?.url;
      engine.playEffect({ ref, url }, opts);
    },
    [engine]
  );

  // Unlock on the first interaction anywhere on the page.
  useEffect(() => {
    engine.probe();
    const unlock = () => engine.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      engine.setMusic({ url: null, status: "stopped", loop: false, restart: false });
      engine.stopEffects();
    };
  }, [engine]);

  useEffect(() => {
    engine.setVolumes({
      music: audioState?.music_volume ?? 0.6,
      sfx: audioState?.sfx_volume ?? 0.9,
      muted: audioState?.muted ?? false,
    });
  }, [engine, audioState?.music_volume, audioState?.sfx_volume, audioState?.muted]);

  // --- Music ---------------------------------------------------------------
  const trackUrl = audioState?.music_sound_id
    ? sounds.find((s) => s.id === audioState.music_sound_id)?.url ?? null
    : null;
  // Spotify links play in Spotify's own embed; the engine only handles audio files.
  const spotify = trackUrl ? parseSpotify(trackUrl) : null;
  const musicUrl = spotify ? null : trackUrl;
  const lastMusicNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!audioState) return;
    const restart = lastMusicNonce.current !== null && lastMusicNonce.current !== audioState.music_nonce;
    lastMusicNonce.current = audioState.music_nonce;
    engine.setMusic({ url: musicUrl, status: audioState.music_status, loop: audioState.music_loop, restart });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, musicUrl, audioState?.music_status, audioState?.music_loop, audioState?.music_nonce]);

  // --- One-shot commands from the console ---------------------------------
  const lastSfxNonce = useRef<number | null>(null);
  const lastStopNonce = useRef<number | null>(null);
  useEffect(() => {
    if (!audioState) return;
    if (lastStopNonce.current !== null && lastStopNonce.current !== audioState.stop_nonce) {
      engine.stopEffects();
    }
    lastStopNonce.current = audioState.stop_nonce;

    if (lastSfxNonce.current !== null && lastSfxNonce.current !== audioState.sfx_nonce && audioState.sfx_ref) {
      play(audioState.sfx_ref);
    }
    lastSfxNonce.current = audioState.sfx_nonce;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, play, audioState?.sfx_nonce, audioState?.stop_nonce]);

  // --- Automatic effects ---------------------------------------------------
  const autoEnabled = audioState?.auto_enabled ?? true;
  const autoMapRef = useRef(audioState?.auto_map);
  autoMapRef.current = audioState?.auto_map;

  const fire = useCallback(
    (event: AutoEventId, opts?: { durationMs?: number; cut?: boolean }) => {
      if (!autoEnabled) return;
      const ref = resolveAutoRef(event, autoMapRef.current);
      if (!ref) return;
      if (opts?.cut) engine.stopEffects();
      play(ref, opts);
    },
    [autoEnabled, engine, play]
  );

  const key = sceneKey(gameState, now);
  const prevKey = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevKey.current;
    prevKey.current = key;
    if (prev === null || prev === key) return;
    for (const e of sceneEvents(prev, key, gameState)) fire(e.event, e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // A new step of the running order gets the same stinger as the game start
  // (skipped when starting the step is what started the game: that one fires above).
  const showNonce = gameState.show_nonce ?? 0;
  const prevShow = useRef<{ nonce: number; status: string } | null>(null);
  useEffect(() => {
    const prev = prevShow.current;
    prevShow.current = { nonce: showNonce, status: gameState.status };
    if (!prev || prev.nonce === showNonce || prev.status === "REGISTRATION") return;
    if (gameState.status === "GAME") fire("game_start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNonce]);

  const prevTotals = useRef<TeamTotals | null>(null);
  useEffect(() => {
    const prev = prevTotals.current;
    prevTotals.current = totals;
    if (!prev) return;
    const scored = totals.palestrati > prev.palestrati || totals.divanisti > prev.divanisti;
    const live = gameState.status === "GAME" || gameState.status === "TIMER" || gameState.status === "PAUSED";
    if (scored && live) fire("point");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.palestrati, totals.divanisti]);

  const spotifyPlayer =
    spotify && audioState ? (
      <SpotifyPlayer
        uri={spotifyUri(spotify)}
        status={audioState.music_status}
        nonce={audioState.music_nonce}
        muted={audioState.muted}
        floating={floatingPlayer}
      />
    ) : null;

  return (
    <>
      {spotifyPlayer}
      {showUnlock && !unlocked && (
        <button
          type="button"
          onClick={() => engine.unlock()}
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold-400/60 bg-void/90 px-5 py-2.5 font-sans text-sm text-gold-300 shadow-lg backdrop-blur"
        >
          <SpeakerIcon />
          Tocca per attivare l&apos;audio
        </button>
      )}
    </>
  );
}

/**
 * A string that changes exactly when an automatic effect might be due:
 * each countdown digit, the last 5 seconds, timeout, draw/final phases…
 */
function sceneKey(gs: GameState, now: number): string {
  switch (gs.status) {
    case "TIMER": {
      const n = gs.timer_nonce;
      if (gs.timer_phase === "paused") return `timer:${n}:hold`;
      if (gs.timer_phase !== "active") return "timer";
      const countdown = msUntil(gs.timer_countdown_ends_at, now) ?? 0;
      if (countdown > 0) return `timer:${n}:cd${Math.max(1, Math.min(3, Math.ceil(countdown / 1000)))}`;
      const remaining = msUntil(gs.timer_ends_at, now) ?? 0;
      if (remaining <= 0) return `timer:${n}:timeout`;
      const seconds = Math.ceil(remaining / 1000);
      return seconds <= 5 ? `timer:${n}:last${seconds}` : `timer:${n}:run`;
    }
    case "DRAW": {
      const started = gs.draw_started_at ? new Date(gs.draw_started_at).getTime() : now;
      return `draw:${gs.draw_nonce}:${now - started >= DRAW_SHUFFLE_MS ? "reveal" : "shuffle"}`;
    }
    case "FINAL_REVEAL": {
      const started = gs.final_started_at ? new Date(gs.final_started_at).getTime() : now;
      return `final:${gs.final_nonce}:${now - started >= FINAL_SUSPENSE_MS ? "reveal" : "suspense"}`;
    }
    case "GAME": {
      // A question with an answer timer running reuses the timer's effects.
      if (gs.question_set && gs.question_index != null && gs.question_timer_ends_at) {
        const remaining = msUntil(gs.question_timer_ends_at, now) ?? 0;
        const n = gs.question_nonce ?? 0;
        if (remaining <= 0) return `question:${n}:timeout`;
        const seconds = Math.ceil(remaining / 1000);
        return seconds <= 5 ? `question:${n}:last${seconds}` : `question:${n}:run`;
      }
      return "game";
    }
    default:
      return gs.status.toLowerCase();
  }
}

function sceneEvents(
  prev: string,
  next: string,
  gs: GameState
): { event: AutoEventId; durationMs?: number; cut?: boolean }[] {
  if (next === "paused") return [{ event: "pause" }];
  if (prev === "paused") return [{ event: "resume" }];
  if (prev === "registration" && (next === "game" || next.startsWith("question:"))) {
    return [{ event: "game_start" }];
  }

  const [kind, nonce, part = ""] = next.split(":");
  const [prevKind, prevNonce, prevPart = ""] = prev.split(":");
  const sameRun = kind === prevKind && nonce === prevNonce;

  if (kind === "timer") {
    if (part.startsWith("cd")) return [{ event: "countdown_tick" }];
    if (part === "timeout") return [{ event: "timeout" }];
    if (!sameRun) return [];
    if (prevPart.startsWith("cd")) return [{ event: "timer_go" }];
    if (part.startsWith("last") && (prevPart === "run" || prevPart.startsWith("last"))) {
      return [{ event: "timer_tick" }];
    }
    return [];
  }
  if (kind === "question") {
    // Only within a run seen ticking, so a question already over on load stays silent.
    if (!sameRun) return [];
    if (part === "timeout" && prevPart !== "timeout") return [{ event: "timeout" }];
    if (part.startsWith("last")) return [{ event: "timer_tick" }];
    return [];
  }
  if (kind === "draw") {
    return part === "shuffle"
      ? [{ event: "draw_shuffle", durationMs: DRAW_SHUFFLE_MS }]
      : [{ event: "draw_reveal", cut: true }];
  }
  if (kind === "final") {
    if (part === "suspense") return [{ event: "final_suspense", durationMs: FINAL_SUSPENSE_MS }];
    return [{ event: gs.final_is_draw ? "tie" : "winner", cut: true }];
  }
  return [];
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" strokeLinecap="round" />
    </svg>
  );
}
