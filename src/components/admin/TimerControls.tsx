"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { TIMER_PRESETS } from "@/lib/constants";
import { pauseTimer, resetTimer, resumeTimer, startTimer, stopTimer } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import type { GameState } from "@/lib/types";

export function TimerControls({ gameState }: { gameState: GameState }) {
  const [customMinutes, setCustomMinutes] = useState(0);
  const [customSeconds, setCustomSeconds] = useState(30);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isTimerStatus = gameState.status === "TIMER";
  const phase = gameState.timer_phase;
  const paused = gameState.status === "PAUSED";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  function launch(label: string, ms: number) {
    if (ms <= 0) return;
    run(() => startTimer({ label, durationMs: ms }));
  }

  return (
    <Panel title="Timer">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {TIMER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={pending || paused}
            onClick={() => launch(preset.label, preset.ms)}
            className="rounded-xl border border-ink-dim/25 py-2 font-sans text-sm text-ink hover:border-gold-400 hover:text-gold-300 disabled:opacity-40"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center justify-center gap-2">
        <NumberStepper value={customMinutes} onChange={setCustomMinutes} max={59} label="min" />
        <span className="text-ink-dim">:</span>
        <NumberStepper value={customSeconds} onChange={setCustomSeconds} max={59} label="sec" />
        <Button
          size="md"
          variant="ghost"
          disabled={pending || paused || (customMinutes === 0 && customSeconds === 0)}
          onClick={() => launch("Timer", (customMinutes * 60 + customSeconds) * 1000)}
        >
          Avvia
        </Button>
      </div>

      {isTimerStatus && (
        <p className="mb-3 text-center font-sans text-xs uppercase tracking-[0.3em] text-gold-400">
          {gameState.timer_label} · {phase === "paused" ? "in pausa" : "in corso"}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Button
          size="md"
          variant="ghost"
          disabled={pending || !isTimerStatus || phase !== "active"}
          onClick={() => run(pauseTimer)}
        >
          Pausa
        </Button>
        <Button
          size="md"
          variant="ghost"
          disabled={pending || !isTimerStatus || phase !== "paused"}
          onClick={() => run(resumeTimer)}
        >
          Riprendi
        </Button>
        <Button
          size="md"
          variant="ghost"
          disabled={pending || !isTimerStatus}
          onClick={() => run(resetTimer)}
        >
          Reset
        </Button>
      </div>

      {/* Stops a running timer or leaves the TIME OUT card, which otherwise stays up for minutes. */}
      <Button size="lg" disabled={pending || !isTimerStatus} onClick={() => run(stopTimer)} className="mt-3 w-full">
        Torna al tabellone
      </Button>

      {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}
    </Panel>
  );
}

function NumberStepper({
  value,
  onChange,
  max,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={cn("flex items-center gap-1 rounded-xl border border-ink-dim/25 px-1")}>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-8 w-6 text-ink-dim hover:text-cream"
        >
          −
        </button>
        <span className="w-6 text-center font-numeric text-xl text-cream">
          {value.toString().padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-8 w-6 text-ink-dim hover:text-cream"
        >
          +
        </button>
      </div>
      <span className="mt-1 text-[0.6rem] uppercase tracking-wide text-ink-dim">{label}</span>
    </div>
  );
}
