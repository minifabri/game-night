"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { activateGame, replayGame } from "@/lib/actions/games";
import { Panel } from "@/components/admin/Panel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";
import type { Game } from "@/lib/game";
import type { TeamId } from "@/lib/types";

interface GameSummary {
  game: Game;
  participants: number;
  totals: Record<TeamId, number>;
}

/** The team colours from globals.css, for games that don't set their own. */
const DEFAULT_COLORS = { a: "#ff6a45", b: "#57d3c8" };

type Pending = { kind: "activate" | "replay"; game: Game } | null;

/**
 * Every game in the database: the one being played and the archived ones,
 * with their participants and result. Switching game keeps the old one as it
 * is; "Rigioca" starts a fresh match with the same content.
 */
export function GamesPanel({ activeGameId }: { activeGameId: string }) {
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [confirm, setConfirm] = useState<Pending>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const [{ data: rows }, { data: people }, { data: scores }] = await Promise.all([
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("participants").select("game_id"),
      supabase.from("scores").select("game_id, team_id, points"),
    ]);
    setGames(
      ((rows as Game[] | null) ?? []).map((game) => ({
        game,
        participants: (people ?? []).filter((p) => p.game_id === game.id).length,
        totals: (scores ?? [])
          .filter((s) => s.game_id === game.id)
          .reduce((acc, s) => ({ ...acc, [s.team_id]: acc[s.team_id as TeamId] + (s.points as number) }), {
            a: 0,
            b: 0,
          }),
      }))
    );
  }, []);

  useEffect(() => {
    load();
  }, [load, activeGameId]);

  function run() {
    if (!confirm) return;
    const { kind, game } = confirm;
    setError(null);
    startTransition(async () => {
      const result = kind === "activate" ? await activateGame({ gameId: game.id }) : await replayGame({ gameId: game.id });
      setConfirm(null);
      if (!result.ok) setError(result.error);
      await load();
    });
  }

  return (
    <Panel title="Giochi">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Ogni gioco ha i suoi contenuti, iscritti e punteggi, e resta salvato quando passi a un altro. Per un gioco
        nuovo (altre squadre, prove, domande) chiedi a Claude di prepararlo in <code>games/</code> e caricalo con{" "}
        <code>npm run game:load</code>: comparirà qui.
      </p>

      {games === null ? (
        <p className="font-sans text-sm text-ink-dim">Carico…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map(({ game, participants, totals }) => {
            const active = game.id === activeGameId;
            const { teams } = game.content;
            const leader = totals.a === totals.b ? null : totals.a > totals.b ? "a" : "b";
            return (
              <li
                key={game.id}
                className={cn(
                  "rounded-xl border p-3",
                  active ? "bg-gold-400/5 ring-1 ring-gold-400/70" : "border-ink-dim/15"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-cream">{game.title}</p>
                    <p className="font-sans text-[0.65rem] text-ink-dim">
                      {new Date(game.created_at).toLocaleDateString("it-IT")} · {participants} iscritti
                    </p>
                    <p className="mt-1 font-sans text-xs">
                      {/* each game in its own colours, not the active game's */}
                      <span
                        className={cn("text-team-a", leader === "a" && "font-semibold")}
                        style={active ? undefined : { color: teams.a.color ?? DEFAULT_COLORS.a }}
                      >
                        {teams.a.name} {totals.a}
                      </span>
                      <span className="text-ink-dim"> – </span>
                      <span
                        className={cn("text-team-b", leader === "b" && "font-semibold")}
                        style={active ? undefined : { color: teams.b.color ?? DEFAULT_COLORS.b }}
                      >
                        {totals.b} {teams.b.name}
                      </span>
                    </p>
                  </div>
                  {active && (
                    <span className="shrink-0 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-gold-400">
                      In gioco
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  {!active && (
                    <SmallButton disabled={pending} onClick={() => setConfirm({ kind: "activate", game })}>
                      Attiva
                    </SmallButton>
                  )}
                  <SmallButton disabled={pending} onClick={() => setConfirm({ kind: "replay", game })}>
                    Rigioca da capo
                  </SmallButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "activate" ? `Passare a «${confirm.game.title}»?` : "Nuova partita da capo?"}
        description={
          confirm?.kind === "activate"
            ? "Il gioco in corso resta salvato così com'è (iscritti e punteggi). TV e telefoni passano al gioco scelto."
            : `Crea una nuova partita con gli stessi contenuti di «${confirm?.game.title ?? ""}», senza iscritti né punti, e la attiva. Quella di prima resta salvata.`
        }
        confirmLabel={confirm?.kind === "activate" ? "Attiva" : "Crea e attiva"}
        pending={pending}
        onConfirm={run}
        onCancel={() => setConfirm(null)}
      />
    </Panel>
  );
}

function SmallButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-ink-dim/30 px-3 py-1.5 font-sans text-xs text-cream hover:border-gold-400/70 hover:text-gold-300 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
