"use client";

import { useState, useTransition } from "react";
import { startGame, finishGame, pauseGame, resumeGame } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { GameState, GameStatus } from "@/lib/types";

const STATUS_LABEL: Record<GameStatus, string> = {
  REGISTRATION: "In attesa di iscrizioni",
  GAME: "In corso — scoreboard",
  TIMER: "In corso — timer",
  DRAW: "In corso — estrazione",
  FINAL_REVEAL: "In corso — reveal finale",
  FINISHED: "Terminato",
  PAUSED: "In pausa",
};

export function GameLifecyclePanel({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pauseMessage, setPauseMessage] = useState("");

  function runStart() {
    setError(null);
    startTransition(async () => {
      const result = await startGame();
      if (!result.ok) setError(result.error);
    });
  }

  function runFinish() {
    setError(null);
    startTransition(async () => {
      const result = await finishGame();
      setConfirmOpen(false);
      if (!result.ok) setError(result.error);
    });
  }

  function runPause() {
    setError(null);
    startTransition(async () => {
      const result = await pauseGame({ message: pauseMessage });
      if (!result.ok) setError(result.error);
    });
  }

  function runResume() {
    setError(null);
    startTransition(async () => {
      const result = await resumeGame();
      if (!result.ok) setError(result.error);
      else setPauseMessage("");
    });
  }

  const isPaused = gameState.status === "PAUSED";
  const canPause = gameState.status === "GAME" || gameState.status === "TIMER";
  const canStart = gameState.status === "REGISTRATION";
  const canFinish = gameState.status !== "REGISTRATION" && gameState.status !== "FINISHED";

  return (
    <Panel title="Stato del gioco">
      <p className="mb-4 font-sans text-sm text-cream">{STATUS_LABEL[gameState.status]}</p>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={pending || !canStart} onClick={runStart}>
          Avvia gioco
        </Button>
        {isPaused ? (
          <Button size="lg" onClick={runResume} disabled={pending}>
            Riprendi il gioco
          </Button>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-ink-dim/15 p-3">
            <input
              type="text"
              value={pauseMessage}
              maxLength={80}
              onChange={(e) => setPauseMessage(e.target.value)}
              placeholder="Messaggio sullo schermo (opzionale) — es. Pausa cibo!"
              className="rounded-xl border border-ink-dim/25 bg-transparent px-3 py-2 font-sans text-sm text-cream outline-none placeholder:text-ink-dim/60 focus:border-gold-400"
            />
            <Button size="md" variant="ghost" disabled={pending || !canPause} onClick={runPause}>
              Metti in pausa
            </Button>
          </div>
        )}
        {isPaused && gameState.pause_message && (
          <p className="text-center font-sans text-xs text-ink-dim">
            Sullo schermo: “{gameState.pause_message}”
          </p>
        )}
        <Button
          size="lg"
          variant="danger"
          disabled={pending || !canFinish}
          onClick={() => setConfirmOpen(true)}
        >
          Termina gioco
        </Button>
      </div>

      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}

      <ConfirmDialog
        open={confirmOpen}
        title="Terminare il gioco?"
        description="I punteggi verranno bloccati e verrà mostrato il reveal finale a tutti. Non si può annullare."
        confirmLabel="Termina"
        pending={pending}
        onConfirm={runFinish}
        onCancel={() => setConfirmOpen(false)}
      />
    </Panel>
  );
}
