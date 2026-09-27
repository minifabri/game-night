"use client";

import { useState, useTransition } from "react";
import { activateGame } from "@/lib/actions/games";
import { useActiveGame, GameOverride } from "@/components/game/ActiveGameProvider";
import { useGame } from "@/hooks/useGame";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ParticipantsPanel } from "@/components/admin/ParticipantsPanel";
import { Panel } from "@/components/admin/Panel";
import { Scoreboard } from "@/components/stage/Scoreboard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusScreen } from "@/components/ui/StatusScreen";
import type { Game } from "@/lib/game";

const NO_CHALLENGES: never[] = [];

/**
 * Console of one game: the full live console when it's the game being
 * played, otherwise a read-only look at it (result, participants) with a
 * button to make it the active one.
 */
export function GameConsole({ gameId }: { gameId: string }) {
  const { gameState, loading, error } = useActiveGame();

  if (error) return <StatusScreen kind="error" message={error} />;
  if (loading || !gameState) return <StatusScreen kind="loading" />;
  if (gameState.game_id === gameId) return <AdminDashboard />;
  return <ArchivedConsole gameId={gameId} />;
}

function ArchivedConsole({ gameId }: { gameId: string }) {
  const { game, loading, error } = useGame(gameId);

  if (error && !game) return <StatusScreen kind="error" message="Gioco non trovato." />;
  if (loading || !game) return <StatusScreen kind="loading" />;
  return (
    <GameOverride game={game}>
      <ArchivedView game={game} />
    </GameOverride>
  );
}

function ArchivedView({ game }: { game: Game }) {
  const { participants, loading: pLoading } = useParticipants(game.id);
  const { totals, byChallenge, loading: sLoading } = useScores(game.id, game.content.challenges ?? NO_CHALLENGES);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function activate() {
    setError(null);
    startTransition(async () => {
      const result = await activateGame({ gameId: game.id });
      setConfirmOpen(false);
      // On success game_state changes and GameConsole swaps in the live console.
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <AdminHeader back={{ href: "/admin", label: "Giochi" }} title={game.title} subtitle="Console · sola lettura" />

      <section className="rounded-2xl border border-gold-400/40 bg-gold-400/5 p-5">
        <p className="mb-3 font-sans text-sm text-cream">
          Questo gioco non è quello in onda: qui vedi com&apos;è finito. Per condurlo attivalo — TV e telefoni
          passeranno a questo gioco, e quello in onda adesso resta salvato così com&apos;è.
        </p>
        <Button size="lg" className="w-full" disabled={pending} onClick={() => setConfirmOpen(true)}>
          Attiva questo gioco
        </Button>
        {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}
      </section>

      <Panel title="Risultato">
        {sLoading ? (
          <p className="font-sans text-sm text-ink-dim">Carico…</p>
        ) : (
          <Scoreboard totals={totals} byChallenge={byChallenge} variant="phone" />
        )}
      </Panel>

      {!pLoading && <ParticipantsPanel participants={participants} readOnly />}

      <ConfirmDialog
        open={confirmOpen}
        title={`Attivare «${game.title}»?`}
        description="TV e telefoni passano a questo gioco. Il gioco in onda adesso resta salvato così com'è (iscritti e punteggi)."
        confirmLabel="Attiva"
        pending={pending}
        onConfirm={activate}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
