"use client";

import { useActiveGame } from "@/components/game/ActiveGameProvider";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { useAudioState } from "@/hooks/useAudioState";
import { useSounds } from "@/hooks/useSounds";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { GameLifecyclePanel } from "@/components/admin/GameLifecyclePanel";
import { ParticipantsPanel } from "@/components/admin/ParticipantsPanel";
import { ScoreEditor } from "@/components/admin/ScoreEditor";
import { TimerControls } from "@/components/admin/TimerControls";
import { DrawControl } from "@/components/admin/DrawControl";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useGameSecrets } from "@/hooks/useGameSecrets";
import { ShowPanel } from "@/components/admin/ShowPanel";
import { QuestionsPanel } from "@/components/admin/QuestionsPanel";
import { QuickBar } from "@/components/admin/QuickBar";
import { AnnouncementPanel } from "@/components/admin/AnnouncementPanel";
import { SoundConsole } from "@/components/admin/SoundConsole";
import { ResetScoresPanel } from "@/components/admin/ResetScoresPanel";
import { DevResetPanel } from "@/components/admin/DevResetPanel";

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

  if (gError) return <StatusScreen kind="error" message={gError} />;
  if (gLoading || pLoading || sLoading || !gameState || !game) return <StatusScreen kind="loading" />;

  return (
    // pb leaves room for the sticky QuickBar at the bottom
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 pb-72 pt-8 sm:px-6">
      <AdminHeader
        back={{ href: "/admin", label: "Giochi" }}
        title={game.title}
        subtitle="Console · in gioco"
      />

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
      {DEV_MODE && <DevResetPanel />}
      <QuickBar gameState={gameState} byChallenge={byChallenge} />
    </div>
  );
}
