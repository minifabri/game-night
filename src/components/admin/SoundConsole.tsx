"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import {
  playMusic,
  setAudioSettings,
  setAutoEffect,
  setMusicLoop,
  setMusicStatus,
  stopAllAudio,
  triggerSfx,
} from "@/lib/actions/audio";
import { AUTO_EVENTS, BUILTIN_SOUNDS, builtinRef, parseBuiltin } from "@/lib/audio/catalog";
import { getAudioEngine } from "@/lib/audio/engine";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { AudioDirector } from "@/components/audio/AudioDirector";
import { SoundLibrary } from "@/components/admin/SoundLibrary";
import type { AudioState, GameState, Sound, SoundRef, TeamTotals } from "@/lib/types";

type Result = { ok: boolean; error?: string };

const MONITOR_KEY = "game-night:audio-monitor";

interface SoundConsoleProps {
  gameState: GameState;
  totals: TeamTotals;
  audioState: AudioState | null;
  audioError: string | null;
  sounds: Sound[];
}

export function SoundConsole({ gameState, totals, audioState, audioError, sounds }: SoundConsoleProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [monitor, setMonitor] = useState(false);
  const [padTarget, setPadTarget] = useState<"tv" | "local">("tv");

  useEffect(() => {
    try {
      setMonitor(localStorage.getItem(MONITOR_KEY) === "1");
    } catch {
      // storage unavailable: monitor stays off
    }
  }, []);

  function toggleMonitor() {
    const next = !monitor;
    setMonitor(next);
    if (next) getAudioEngine().unlock();
    try {
      localStorage.setItem(MONITOR_KEY, next ? "1" : "0");
    } catch {
      // not persisted, fine
    }
  }

  function run(action: () => Promise<Result>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  if (!audioState) {
    return (
      <Panel title="Console audio">
        <p className="font-sans text-sm text-ink-dim">
          {audioError
            ? "Tabelle audio non trovate: esegui la migration supabase/migrations/0005_audio.sql."
            : "Caricamento…"}
        </p>
      </Panel>
    );
  }

  const music = sounds.filter((s) => s.kind === "music");
  const libraryEffects = sounds.filter((s) => s.kind === "sfx");
  const currentTrack = sounds.find((s) => s.id === audioState.music_sound_id) ?? null;

  function playPad(ref: SoundRef) {
    if (padTarget === "local") {
      const engine = getAudioEngine();
      engine.unlock().then(() => {
        engine.playEffect({ ref, url: parseBuiltin(ref) ? null : sounds.find((s) => s.id === ref)?.url });
      });
      return;
    }
    // not a transition: pad taps must never be blocked by another pending command
    setError(null);
    triggerSfx(ref).then((result) => {
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Panel title="Console audio">
      {monitor && (
        <AudioDirector gameState={gameState} totals={totals} audioState={audioState} sounds={sounds} />
      )}

      <p className="mb-4 font-sans text-sm text-ink-dim">
        L&apos;audio esce dalla TV (<span className="text-cream">/display</span>): sulla TV tocca una volta lo
        schermo per sbloccarlo.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        <Toggle on={monitor} onClick={toggleMonitor}>
          Ascolta anche qui
        </Toggle>
        <Toggle on={audioState.muted} onClick={() => run(() => setAudioSettings({ muted: !audioState.muted }))} danger>
          {audioState.muted ? "Muto attivo" : "Muto"}
        </Toggle>
        <Button size="md" variant="danger" disabled={pending} onClick={() => run(stopAllAudio)} className="ml-auto">
          Stop tutto
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <VolumeSlider
          label="Volume musica"
          value={audioState.music_volume}
          onCommit={(v) => run(() => setAudioSettings({ music_volume: v }))}
        />
        <VolumeSlider
          label="Volume effetti"
          value={audioState.sfx_volume}
          onCommit={(v) => run(() => setAudioSettings({ sfx_volume: v }))}
        />
      </div>

      <SubTitle>Colonna sonora</SubTitle>
      <div className="mb-3 rounded-xl border border-ink-dim/15 px-3 py-2">
        <p className="truncate font-sans text-sm text-cream">
          {currentTrack ? currentTrack.name : "Nessuna traccia"}
          <span className="ml-2 text-xs uppercase tracking-[0.2em] text-gold-400">
            {currentTrack ? MUSIC_LABEL[audioState.music_status] : ""}
          </span>
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {audioState.music_status === "playing" ? (
            <SmallButton disabled={pending || !currentTrack} onClick={() => run(() => setMusicStatus("paused"))}>
              Pausa
            </SmallButton>
          ) : (
            <SmallButton disabled={pending || !currentTrack} onClick={() => run(() => setMusicStatus("playing"))}>
              Play
            </SmallButton>
          )}
          <SmallButton
            disabled={pending || audioState.music_status === "stopped"}
            onClick={() => run(() => setMusicStatus("stopped"))}
          >
            Stop
          </SmallButton>
          <SmallButton active={audioState.music_loop} onClick={() => run(() => setMusicLoop(!audioState.music_loop))}>
            Loop {audioState.music_loop ? "on" : "off"}
          </SmallButton>
        </div>
      </div>
      {music.length === 0 ? (
        <p className="mb-6 font-sans text-xs text-ink-dim">Carica una traccia dalla libreria qui sotto.</p>
      ) : (
        <ul className="mb-6 flex flex-col gap-1.5">
          {music.map((track) => {
            const current = track.id === audioState.music_sound_id && audioState.music_status !== "stopped";
            return (
              <li key={track.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => playMusic(track.id))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left font-sans text-sm",
                    current ? "border-gold-400 text-gold-300" : "border-ink-dim/20 text-ink hover:border-gold-400/60"
                  )}
                >
                  <PlayIcon />
                  <span className="truncate">{track.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <SubTitle className="mb-0">Pad effetti</SubTitle>
        <div className="flex rounded-full border border-ink-dim/25 p-0.5 font-sans text-xs">
          {(["tv", "local"] as const).map((target) => (
            <button
              key={target}
              type="button"
              onClick={() => setPadTarget(target)}
              className={cn(
                "rounded-full px-3 py-1",
                padTarget === target ? "bg-gold-400 text-void" : "text-ink-dim hover:text-cream"
              )}
            >
              {target === "tv" ? "Sulla TV" : "Anteprima qui"}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {libraryEffects.map((s) => (
          <PadButton key={s.id} highlight onClick={() => playPad(s.id)}>
            {s.name}
          </PadButton>
        ))}
        {BUILTIN_SOUNDS.map((b) => (
          <PadButton key={b.id} onClick={() => playPad(builtinRef(b.id))}>
            {b.label}
          </PadButton>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <SubTitle className="mb-0">Effetti automatici</SubTitle>
        <Toggle
          on={audioState.auto_enabled}
          onClick={() => run(() => setAudioSettings({ auto_enabled: !audioState.auto_enabled }))}
        >
          {audioState.auto_enabled ? "Attivi" : "Disattivati"}
        </Toggle>
      </div>
      <p className="mb-3 font-sans text-xs text-ink-dim">
        Partono da soli sulla TV durante countdown, timer, estrazione, punti, pausa e finale. Puoi sostituirli con i
        suoni della libreria (es. i clip di Ciao Darwin).
      </p>
      <div className={cn("mb-6 flex flex-col gap-2", !audioState.auto_enabled && "opacity-50")}>
        {AUTO_EVENTS.map((event) => {
          const override = audioState.auto_map[event.id];
          const defaultLabel = BUILTIN_SOUNDS.find((b) => b.id === event.default)?.label;
          return (
            <label key={event.id} className="grid grid-cols-[1fr_1.2fr] items-center gap-3 font-sans text-sm">
              <span className="text-ink">{event.label}</span>
              <select
                value={override ?? ""}
                disabled={pending}
                onChange={(e) => run(() => setAutoEffect(event.id, e.target.value || null))}
                className="w-full rounded-lg border border-ink-dim/25 bg-plum-900 px-2 py-1.5 text-sm text-cream outline-none focus:border-gold-400"
              >
                <option value="">Predefinito · {defaultLabel}</option>
                {sounds.length > 0 && (
                  <optgroup label="Libreria">
                    {sounds.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Effetti sintetizzati">
                  {BUILTIN_SOUNDS.map((b) => (
                    <option key={b.id} value={builtinRef(b.id)}>
                      {b.label}
                    </option>
                  ))}
                </optgroup>
                <option value="off">Nessun suono</option>
              </select>
            </label>
          );
        })}
      </div>

      {error && <p className="mb-3 text-center font-sans text-sm text-gym">{error}</p>}

      <SoundLibrary sounds={sounds} autoMap={audioState.auto_map} />
    </Panel>
  );
}

const MUSIC_LABEL = { playing: "in riproduzione", paused: "in pausa", stopped: "ferma" } as const;

function SubTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("mb-2 font-sans text-[0.7rem] uppercase tracking-[0.25em] text-gold-400/80", className)}>
      {children}
    </h3>
  );
}

function Toggle({
  on,
  onClick,
  danger,
  children,
}: {
  on: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-sans text-xs",
        on
          ? danger
            ? "border-gym bg-gym/15 text-gym"
            : "border-gold-400 bg-gold-400/15 text-gold-300"
          : "border-ink-dim/30 text-ink-dim hover:text-cream"
      )}
    >
      {children}
    </button>
  );
}

function SmallButton({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border py-1.5 font-sans text-xs disabled:opacity-40",
        active ? "border-gold-400/70 text-gold-300" : "border-ink-dim/25 text-ink hover:border-gold-400/60"
      )}
    >
      {children}
    </button>
  );
}

function PadButton({
  children,
  onClick,
  disabled,
  highlight,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-14 rounded-xl border px-2 py-2 font-sans text-sm leading-tight transition-transform active:scale-95 disabled:opacity-50",
        highlight
          ? "border-gold-400/50 bg-gold-400/10 text-gold-200 hover:border-gold-400"
          : "border-plum-600/70 bg-plum-800/50 text-ink hover:border-gold-400/60"
      )}
    >
      {children}
    </button>
  );
}

/** Local while dragging; commits to the TV shortly after the thumb stops. */
function VolumeSlider({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <label className="flex flex-col gap-1 font-sans text-xs text-ink-dim">
      <span className="flex justify-between">
        {label}
        <span className="font-numeric text-cream">{Math.round(local * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(local * 100)}
        onChange={(e) => {
          const next = Number(e.target.value) / 100;
          dragging.current = true;
          setLocal(next);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            dragging.current = false;
            onCommit(next);
          }, 250);
        }}
        className="accent-[var(--color-gold-400)]"
      />
    </label>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}
