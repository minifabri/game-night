"use client";

import { useState, useTransition } from "react";
import { startGame, finishGame } from "@/lib/actions/admin";
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
};

export function GameLifecyclePanel({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const canStart = gameState.status === "REGISTRATION";
  const canFinish = gameState.status !== "REGISTRATION" && gameState.status !== "FINISHED";

  return (
    <Panel title="Stato del gioco">
      <p className="mb-4 font-sans text-sm text-cream">{STATUS_LABEL[gameState.status]}</p>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={pending || !canStart} onClick={runStart}>
          Avvia gioco
        </Button>
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
