"use client";

import { AnimatePresence } from "framer-motion";
import { useActiveGame } from "@/components/game/ActiveGameProvider";
import { useParticipants } from "@/hooks/useParticipants";
import { useScores } from "@/hooks/useScores";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { WaitingRoom } from "@/components/stage/WaitingRoom";
import { Scoreboard } from "@/components/stage/Scoreboard";
import { TimerScene } from "@/components/stage/TimerScene";
import { DrawScene } from "@/components/stage/DrawScene";
import { FinalRevealScene } from "@/components/stage/FinalRevealScene";
import { FinishedScreen } from "@/components/stage/FinishedScreen";
import { PausedScene } from "@/components/stage/PausedScene";
import { AnnouncementOverlay } from "@/components/stage/AnnouncementOverlay";
import { StageAudio } from "@/components/audio/StageAudio";
import { StepCardScene } from "@/components/stage/StepCardScene";
import { QuestionScene } from "@/components/stage/QuestionScene";
import { StepTrack } from "@/components/stage/StepTrack";
import { getQuestion, getStep } from "@/lib/game";

interface GameStageProps {
  variant?: "tv" | "phone";
  /** Only one client (the /display TV) should self-heal transient states back to GAME. */
  isCanonical?: boolean;
  /** Play the sound console output and automatic effects on this device (the TV). */
  withAudio?: boolean;
}

const NO_CHALLENGES: never[] = [];

export function GameStage({ variant = "phone", isCanonical = false, withAudio = false }: GameStageProps) {
  const { gameState, game, loading: gLoading, error: gError } = useActiveGame();
  const gameId = game?.id ?? null;
  const { participants, loading: pLoading } = useParticipants(gameId);
  const { totals, byChallenge, loading: sLoading } = useScores(gameId, game?.content.challenges ?? NO_CHALLENGES);

  if (gError) {
    return <StatusScreen kind="error" message="Impossibile contattare il game server." />;
  }

  if (gLoading || pLoading || sLoading || !gameState || !game) {
    return <StatusScreen kind="loading" message="Accendiamo le luci…" />;
  }
  const content = game.content;

  // On the scoreboard status the running order can take over the screen: a
  // question first, else the current step's card, else the scoreboard (with
  // the step track on top once the show has started).
  const step = getStep(content, gameState.show_step);
  const hasQuestion = getQuestion(content, gameState.question_set, gameState.question_index) !== null;
  const gameScene = hasQuestion ? "question" : step && gameState.show_card ? "step" : "scoreboard";

  return (
    <>
      {withAudio && <StageAudio gameState={gameState} totals={totals} />}
      <AnimatePresence mode="wait">
        {gameState.status === "REGISTRATION" && (
          <WaitingRoom key="waiting" participants={participants} variant={variant} />
        )}
        {gameState.status === "GAME" && gameScene === "question" && (
          <QuestionScene key="question" gameState={gameState} variant={variant} />
        )}
        {gameState.status === "GAME" && gameScene === "step" && step && (
          <StepCardScene
            key="step"
            step={step}
            gameState={gameState}
            totals={totals}
            byChallenge={byChallenge}
            variant={variant}
          />
        )}
        {gameState.status === "GAME" && gameScene === "scoreboard" && (
          <Scoreboard
            key="scoreboard"
            totals={totals}
            byChallenge={byChallenge}
            variant={variant}
            header={step && <StepTrack current={step.id} variant={variant} className={variant === "tv" ? "mb-10" : "mb-5"} />}
          />
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
        {gameState.status === "PAUSED" && (
          <PausedScene key="paused" gameState={gameState} totals={totals} variant={variant} />
        )}
      </AnimatePresence>
      {/* Overlaid rather than a status of its own, so the scene underneath (a
          running timer, the scoreboard…) keeps going while the message is up. */}
      <AnimatePresence>
        {gameState.announcement_message && (
          <AnnouncementOverlay key="announcement" message={gameState.announcement_message} variant={variant} />
        )}
      </AnimatePresence>
    </>
  );
}
