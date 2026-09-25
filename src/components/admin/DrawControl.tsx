"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { drawParticipant, endDraw } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import type { GameState, Participant, TeamId } from "@/lib/types";
import { useGameContent } from "@/components/game/ActiveGameProvider";

export function DrawControl({ gameState, participants }: { gameState: GameState; participants: Participant[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { teams } = useGameContent();
  const drawing = gameState.status === "DRAW";
  const blocked = pending || gameState.status === "PAUSED";

  const nameOf = (id: string | null) => participants.find((p) => p.id === id)?.name ?? null;

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  function draw(team: TeamId) {
    run(() => drawParticipant({ team }));
  }

  return (
    <Panel title="Estrazione">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Ogni squadra si estrae per conto suo: a schermo compare solo la squadra estratta e il nome resta
        finché non torni al tabellone.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <TeamDraw
          label={`Ultimo ${teams.a.member}`}
          name={nameOf(gameState.draw_a_participant_id)}
          className="text-team-a"
          live={drawing && gameState.draw_team === "a"}
        >
          <Button size="md" variant="team-a" disabled={blocked} onClick={() => draw("a")}>
            Estrai {teams.a.member}
          </Button>
        </TeamDraw>
        <TeamDraw
          label={`Ultimo ${teams.b.member}`}
          name={nameOf(gameState.draw_b_participant_id)}
          className="text-team-b"
          live={drawing && gameState.draw_team === "b"}
        >
          <Button size="md" variant="team-b" disabled={blocked} onClick={() => draw("b")}>
            Estrai {teams.b.member}
          </Button>
        </TeamDraw>
      </div>

      <Button size="lg" disabled={pending || !drawing} onClick={() => run(endDraw)} className="mt-3 w-full">
        Torna al tabellone
      </Button>

      {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}
    </Panel>
  );
}

function TeamDraw({
  label,
  name,
  className,
  live,
  children,
}: {
  label: string;
  name: string | null;
  className: string;
  live: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn("rounded-xl border px-2 py-2 text-center", live ? "border-gold-400/60" : "border-ink-dim/15")}>
        <p className={cn("font-sans text-[0.65rem] uppercase tracking-[0.25em]", className)}>{label}</p>
        <p className="truncate font-sans text-sm text-cream">{name ?? "—"}</p>
        {live && <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-gold-400">a schermo</p>}
      </div>
      {children}
    </div>
  );
}
