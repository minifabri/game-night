"use client";

import { cn } from "@/lib/cn";
import { TEAM_ORDER } from "@/lib/constants";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import type { Participant, TeamId } from "@/lib/types";
import { Panel } from "@/components/admin/Panel";

export function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  const { teams } = useGameContent();
  const byTeam: Record<TeamId, Participant[]> = { a: [], b: [] };
  for (const p of participants) byTeam[p.team_id].push(p);

  return (
    <Panel title="Partecipanti">
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <Stat label="Totale" value={participants.length} />
        <Stat label={teams.a.name} value={byTeam.a.length} color="text-team-a" />
        <Stat label={teams.b.name} value={byTeam.b.length} color="text-team-b" />
      </div>

      {participants.length === 0 ? (
        <p className="font-sans text-sm italic text-ink-dim">Ancora nessuna registrazione.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {TEAM_ORDER.map((teamId) => (
            <div key={teamId}>
              <p
                className={cn(
                  "mb-2 font-sans text-xs font-medium uppercase tracking-[0.2em]",
                  teamId === "a" ? "text-team-a" : "text-team-b"
                )}
              >
                {teams[teamId].name}
              </p>
              <ul className="flex flex-col gap-1.5">
                {byTeam[teamId].map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-plum-800/40 px-3 py-1.5 font-sans text-sm text-ink"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-2 flex shrink-0 gap-1 text-[0.6rem] uppercase tracking-wide text-ink-dim">
                      {p.brings_food && (
                        <span className="rounded border border-ink-dim/30 px-1.5 py-0.5" title="Porta da mangiare">
                          cibo
                        </span>
                      )}
                      {p.brings_drink && (
                        <span className="rounded border border-ink-dim/30 px-1.5 py-0.5" title="Porta da bere">
                          bevande
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl bg-plum-800/40 py-3">
      <p className={cn("font-numeric text-3xl", color ?? "text-cream")}>{value}</p>
      <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">{label}</p>
    </div>
  );
}
