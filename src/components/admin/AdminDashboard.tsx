"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { Wordmark } from "@/components/brand/Wordmark";
import { GameLifecyclePanel } from "@/components/admin/GameLifecyclePanel";
import { ParticipantsPanel } from "@/components/admin/ParticipantsPanel";
import { ScoreEditor } from "@/components/admin/ScoreEditor";
import { TimerControls } from "@/components/admin/TimerControls";
import { DrawControl } from "@/components/admin/DrawControl";
import { DevResetPanel } from "@/components/admin/DevResetPanel";
import { logoutAdmin } from "@/lib/actions/admin";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export function AdminDashboard() {
  const { gameState, loading: gsLoading, error: gsError } = useGameState();
  const { participants, loading: pLoading } = useParticipants();
  const { byChallenge, loading: sLoading } = useScores();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (gsError) return <StatusScreen kind="error" />;
  if (gsLoading || pLoading || sLoading || !gameState) return <StatusScreen kind="loading" />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Wordmark size="sm" className="items-start text-left" />
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => {
            await logoutAdmin();
            router.refresh();
          })}
          className="font-sans text-xs uppercase tracking-[0.2em] text-ink-dim hover:text-gold-300"
        >
          Esci
        </button>
      </header>

      <GameLifecyclePanel gameState={gameState} />
      <ParticipantsPanel participants={participants} />
      <ScoreEditor byChallenge={byChallenge} />
      <TimerControls gameState={gameState} />
      <DrawControl gameState={gameState} />
      {DEV_MODE && <DevResetPanel />}
    </div>
  );
}
