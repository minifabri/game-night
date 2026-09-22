"use client";

import { AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { WaitingRoom } from "@/components/stage/WaitingRoom";
import { Scoreboard } from "@/components/stage/Scoreboard";
import { TimerScene } from "@/components/stage/TimerScene";
import { DrawScene } from "@/components/stage/DrawScene";
import { FinalRevealScene } from "@/components/stage/FinalRevealScene";
import { FinishedScreen } from "@/components/stage/FinishedScreen";

interface GameStageProps {
  variant?: "tv" | "phone";
  /** Only one client (the /display TV) should self-heal transient states back to GAME. */
  isCanonical?: boolean;
}

export function GameStage({ variant = "phone", isCanonical = false }: GameStageProps) {
  const { gameState, loading: gsLoading, error: gsError } = useGameState();
  const { participants, loading: pLoading } = useParticipants();
  const { totals, byChallenge, loading: sLoading } = useScores();

  if (gsError) {
    return <StatusScreen kind="error" message="Impossibile contattare il game server." />;
  }

  if (gsLoading || pLoading || sLoading || !gameState) {
    return <StatusScreen kind="loading" message="Accendiamo le luci…" />;
  }

  return (
    <AnimatePresence mode="wait">
      {gameState.status === "REGISTRATION" && (
        <WaitingRoom key="waiting" participants={participants} variant={variant} />
      )}
      {gameState.status === "GAME" && (
        <Scoreboard key="scoreboard" totals={totals} byChallenge={byChallenge} variant={variant} />
      )}
      {gameState.status === "TIMER" && (
        <TimerScene key="timer" gameState={gameState} isCanonical={isCanonical} variant={variant} />
      )}
      {gameState.status === "DRAW" && (
        <DrawScene
          key="draw"
          gameState={gameState}
          participants={participants}
          isCanonical={isCanonical}
          variant={variant}
        />
      )}
      {gameState.status === "FINAL_REVEAL" && (
        <FinalRevealScene key="final" gameState={gameState} isCanonical={isCanonical} variant={variant} />
      )}
      {gameState.status === "FINISHED" && (
        <FinishedScreen key="finished" gameState={gameState} byChallenge={byChallenge} variant={variant} />
      )}
    </AnimatePresence>
  );
}
