"use client";

import { useEffect, useMemo, useState } from "react";
import { GameOverride } from "@/components/game/ActiveGameProvider";
import { WaitingRoom } from "@/components/stage/WaitingRoom";
import { Scoreboard } from "@/components/stage/Scoreboard";
import { StepCardScene } from "@/components/stage/StepCardScene";
import { QuestionScene } from "@/components/stage/QuestionScene";
import { StepTrack } from "@/components/stage/StepTrack";
import { LIVE_STATE_RESET } from "@/lib/constants";
import { getStep, type Game } from "@/lib/game";
import type { GameState, Participant } from "@/lib/types";
import { PREVIEW_READY, type PreviewMessage } from "@/components/admin/preview/types";

/** A few made-up names so the waiting room isn't empty. */
const SAMPLE_PARTICIPANTS: Participant[] = ["Anna", "Marco", "Sara", "Luca", "Giulia", "Paolo"].map((name, i) => ({
  id: `sample-${i}`,
  game_id: "preview",
  name,
  team_id: i % 2 === 0 ? "a" : "b",
  brings_food: false,
  brings_drink: false,
  created_at: new Date(0).toISOString(),
}));

/**
 * /admin/anteprima, shown inside the content editor's preview frame: renders
 * one scene of the display with the editor's unsaved content and made-up
 * state. Nothing is read from or written to the live game.
 */
export function DisplayPreview() {
  const [message, setMessage] = useState<PreviewMessage | null>(null);
  const [receivedAt, setReceivedAt] = useState(0);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const data = e.data as PreviewMessage;
      if (data?.type !== "gn-preview") return;
      setMessage(data);
      setReceivedAt(Date.now());
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Team colours, as ActiveGameProvider does on the real screens.
  const teams = message?.content.teams;
  useEffect(() => {
    if (!teams) return;
    const root = document.documentElement.style;
    const vars: [string, string | undefined][] = [
      ["--color-team-a", teams.a.color],
      ["--color-team-a-soft", teams.a.colorSoft],
      ["--color-team-b", teams.b.color],
      ["--color-team-b-soft", teams.b.colorSoft],
    ];
    for (const [name, value] of vars) {
      if (value) root.setProperty(name, value);
      else root.removeProperty(name);
    }
  }, [teams]);

  const game: Game | null = useMemo(
    () =>
      message ? { id: "preview", title: message.title, content: message.content, created_at: new Date(0).toISOString() } : null,
    [message]
  );

  if (!message || !game) return null;

  const { scene, variant, content } = message;
  const byChallenge = content.challenges.map((c) => ({ challengeId: c.id, a: 0, b: 0 }));
  const totals = { a: 0, b: 0 };

  const state = {
    ...LIVE_STATE_RESET,
    id: 1,
    game_id: "preview",
    status: "GAME",
    timer_nonce: 0,
    draw_nonce: 0,
    final_nonce: 0,
    show_nonce: 1,
    question_nonce: receivedAt,
    updated_at: new Date(receivedAt).toISOString(),
  } as unknown as GameState;

  let body: React.ReactNode = null;
  if (scene.kind === "waiting") {
    body = <WaitingRoom participants={SAMPLE_PARTICIPANTS} variant={variant} />;
  } else if (scene.kind === "scoreboard") {
    const step = getStep(content, scene.stepId);
    body = (
      <Scoreboard
        totals={totals}
        byChallenge={byChallenge}
        variant={variant}
        header={step && <StepTrack current={step.id} variant={variant} className={variant === "tv" ? "mb-10" : "mb-5"} />}
      />
    );
  } else if (scene.kind === "step") {
    const step = getStep(content, scene.stepId);
    if (step) {
      body = (
        <StepCardScene
          step={step}
          gameState={{ ...state, show_step: step.id, show_substep: scene.substep, show_card: true }}
          totals={totals}
          byChallenge={byChallenge}
          variant={variant}
        />
      );
    }
  } else {
    const set = content.questionSets.find((s) => s.id === scene.setId);
    body = (
      <QuestionScene
        gameState={{
          ...state,
          show_step: set?.step ?? null,
          question_set: scene.setId,
          question_index: scene.index,
          question_answer_visible: scene.answer !== null,
          question_answer_text: scene.answer?.text ?? null,
          question_answer_detail: scene.answer?.detail ?? null,
          question_timer_ends_at:
            scene.answer === null && set?.timerMs ? new Date(receivedAt + set.timerMs).toISOString() : null,
        }}
        variant={variant}
      />
    );
  }

  return (
    <GameOverride game={game}>
      <main className="flex min-h-dvh items-center justify-center overflow-hidden">{body}</main>
    </GameOverride>
  );
}
