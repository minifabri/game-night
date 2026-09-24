"use client";

import { useState, useTransition } from "react";
import { drawParticipants } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import type { GameState } from "@/lib/types";

export function DrawControl({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await drawParticipants();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Panel title="Estrazione">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Sceglie a caso un Palestrato e un Divanista tra i partecipanti registrati.
      </p>
      <Button
        size="lg"
        disabled={pending || gameState.status === "DRAW" || gameState.status === "PAUSED"}
        onClick={run}
        className="w-full"
      >
        {gameState.status === "DRAW" ? "Estrazione in corso…" : "Estrai concorrenti"}
      </Button>
      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}
    </Panel>
  );
}
