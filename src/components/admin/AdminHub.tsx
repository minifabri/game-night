"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { replayGame } from "@/lib/actions/games";
import { useGameState } from "@/hooks/useGameState";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusScreen } from "@/components/ui/StatusScreen";
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

/**
 * /admin: every game in the database (the one being played first), each with
 * its console and its content editor, plus "Nuovo gioco". Activating a game
 * happens from its console; "Rigioca" starts a fresh match with the same
 * content.
 */
export function AdminHub() {
  const { gameState, error: stateError } = useGameState();
  const activeGameId = gameState?.game_id ?? null;
  const [games, setGames] = useState<GameSummary[] | null>(null);
  const [confirm, setConfirm] = useState<Game | null>(null);
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

  function replay() {
    if (!confirm) return;
    const game = confirm;
    setError(null);
    startTransition(async () => {
      const result = await replayGame({ gameId: game.id });
      setConfirm(null);
      if (!result.ok) setError(result.error);
      await load();
    });
  }

  if (stateError) return <StatusScreen kind="error" message={stateError} />;
  if (games === null) return <StatusScreen kind="loading" />;

  // The game being played first, then the others newest first.
  const sorted = [...games].sort((x, y) => Number(y.game.id === activeGameId) - Number(x.game.id === activeGameId));

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <AdminHeader title="Game Night" subtitle="I tuoi giochi" />

      <Link
        href="/admin/nuovo"
        className="flex items-center justify-center rounded-full bg-gold-400 px-6 py-3 font-sans text-sm font-medium text-void hover:bg-gold-300"
      >
        + Nuovo gioco
      </Link>

      <ul className="flex flex-col gap-3">
          {sorted.map(({ game, participants, totals }) => {
            const active = game.id === activeGameId;
            const { teams } = game.content;
            const leader = totals.a === totals.b ? null : totals.a > totals.b ? "a" : "b";
            return (
              <li
                key={game.id}
                className={cn(
                  "rounded-2xl border p-4",
                  active ? "bg-gold-400/5 ring-1 ring-gold-400/70" : "border-plum-700/60 bg-plum-900/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-medium text-cream">{game.title}</p>
                    <p className="font-sans text-[0.65rem] text-ink-dim">
                      {new Date(game.created_at).toLocaleDateString("it-IT")} · {participants} iscritti
                    </p>
                    <p className="mt-1 font-sans text-xs">
                      {/* each game in its own colours, not the active game's */}
                      <span
                        className={cn(leader === "a" && "font-semibold")}
                        style={{ color: teams.a.color ?? DEFAULT_COLORS.a }}
                      >
                        {teams.a.name} {totals.a}
                      </span>
                      <span className="text-ink-dim"> – </span>
                      <span
                        className={cn(leader === "b" && "font-semibold")}
                        style={{ color: teams.b.color ?? DEFAULT_COLORS.b }}
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/giochi/${game.id}`}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-center font-sans text-sm font-medium",
                      active ? "bg-gold-400 text-void hover:bg-gold-300" : "border border-ink-dim/30 text-cream hover:border-gold-400/70"
                    )}
                  >
                    Console
                  </Link>
                  <Link
                    href={`/admin/giochi/${game.id}/contenuti`}
                    className="rounded-xl border border-ink-dim/30 px-3 py-2.5 text-center font-sans text-sm text-cream hover:border-gold-400/70"
                  >
                    Contenuti
                  </Link>
                </div>
                <div className="mt-2 flex justify-end">
                  <SmallButton disabled={pending} onClick={() => setConfirm(game)}>
                    Rigioca da capo
                  </SmallButton>
                </div>
              </li>
            );
          })}
      </ul>

      {error && <p className="text-center font-sans text-sm text-danger">{error}</p>}

      <ConfirmDialog
        open={confirm !== null}
        title="Nuova partita da capo?"
        description={`Crea una nuova partita con gli stessi contenuti di «${confirm?.title ?? ""}», senza iscritti né punti, e la attiva. Quella di prima resta salvata.`}
        confirmLabel="Crea e attiva"
        pending={pending}
        onConfirm={replay}
        onCancel={() => setConfirm(null)}
      />
    </div>
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
