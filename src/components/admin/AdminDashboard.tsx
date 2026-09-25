"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActiveGame } from "@/components/game/ActiveGameProvider";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { useAudioState } from "@/hooks/useAudioState";
import { useSounds } from "@/hooks/useSounds";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { Wordmark } from "@/components/brand/Wordmark";
import { GameLifecyclePanel } from "@/components/admin/GameLifecyclePanel";
import { ParticipantsPanel } from "@/components/admin/ParticipantsPanel";
import { ScoreEditor } from "@/components/admin/ScoreEditor";
import { TimerControls } from "@/components/admin/TimerControls";
import { DrawControl } from "@/components/admin/DrawControl";
import { GamesPanel } from "@/components/admin/GamesPanel";
import { useGameSecrets } from "@/hooks/useGameSecrets";
import { ShowPanel } from "@/components/admin/ShowPanel";
import { QuestionsPanel } from "@/components/admin/QuestionsPanel";
import { AnnouncementPanel } from "@/components/admin/AnnouncementPanel";
import { SoundConsole } from "@/components/admin/SoundConsole";
import { ResetScoresPanel } from "@/components/admin/ResetScoresPanel";
import { DevResetPanel } from "@/components/admin/DevResetPanel";
import { logoutAdmin } from "@/lib/actions/admin";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const NO_CHALLENGES: never[] = [];

export function AdminDashboard() {
  const { gameState, game, loading: gLoading, error: gError } = useActiveGame();
  const gameId = game?.id ?? null;
  const { participants, loading: pLoading } = useParticipants(gameId);
  const { totals, byChallenge, loading: sLoading } = useScores(gameId, game?.content.challenges ?? NO_CHALLENGES);
  const secrets = useGameSecrets(gameId, game);
  const { audioState, error: audioError } = useAudioState();
  const { sounds } = useSounds();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (gError) return <StatusScreen kind="error" message={gError} />;
  if (gLoading || pLoading || sLoading || !gameState || !game) return <StatusScreen kind="loading" />;

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
      <ShowPanel gameState={gameState} secrets={secrets} />
      <QuestionsPanel gameState={gameState} secrets={secrets} />
      <AnnouncementPanel gameState={gameState} />
      <ParticipantsPanel participants={participants} />
      <ScoreEditor byChallenge={byChallenge} />
      <TimerControls gameState={gameState} />
      <DrawControl gameState={gameState} participants={participants} />
      <SoundConsole
        gameState={gameState}
        totals={totals}
        audioState={audioState}
        audioError={audioError}
        sounds={sounds}
      />
      <ResetScoresPanel />
      <GamesPanel activeGameId={game.id} />
      {DEV_MODE && <DevResetPanel />}
    </div>
  );
}
