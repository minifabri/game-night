"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { clearDraw, drawParticipant } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import type { GameState, Participant, TeamId } from "@/lib/types";

export function DrawControl({ gameState, participants }: { gameState: GameState; participants: Participant[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const drawing = gameState.status === "DRAW";
  const blocked = pending || drawing || gameState.status === "PAUSED";

  const nameOf = (id: string | null) => participants.find((p) => p.id === id)?.name ?? null;
  const gymName = nameOf(gameState.draw_gym_participant_id);
  const couchName = nameOf(gameState.draw_couch_participant_id);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  function label(team: TeamId, singular: string) {
    if (drawing && gameState.draw_team === team) return "Estrazione in corso…";
    return `Estrai ${singular}`;
  }

  return (
    <Panel title="Estrazione">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Estrai un concorrente per squadra, uno alla volta: il primo estratto resta a schermo come avversario
        mentre estrai l&apos;altro.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 text-center">
        <CurrentPick label="Palestrato" name={gymName} className="text-gym" />
        <CurrentPick label="Divanista" name={couchName} className="text-couch" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="md"
          variant="team-gym"
          disabled={blocked}
          onClick={() => run(() => drawParticipant({ team: "palestrati" }))}
        >
          {label("palestrati", "Palestrato")}
        </Button>
        <Button
          size="md"
          variant="team-couch"
          disabled={blocked}
          onClick={() => run(() => drawParticipant({ team: "divanisti" }))}
        >
          {label("divanisti", "Divanista")}
        </Button>
      </div>

      <Button
        size="md"
        variant="ghost"
        disabled={blocked || (!gymName && !couchName)}
        onClick={() => run(clearDraw)}
        className="mt-2 w-full"
      >
        Nuova sfida (azzera estratti)
      </Button>

      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}
    </Panel>
  );
}

function CurrentPick({ label, name, className }: { label: string; name: string | null; className: string }) {
  return (
    <div className="rounded-xl border border-ink-dim/15 px-2 py-2">
      <p className={cn("font-sans text-[0.65rem] uppercase tracking-[0.25em]", className)}>{label}</p>
      <p className="truncate font-sans text-sm text-cream">{name ?? "—"}</p>
    </div>
  );
}
