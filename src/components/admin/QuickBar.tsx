"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { adjustScore } from "@/lib/actions/admin";
import { setAnswerVisible, showQuestion } from "@/lib/actions/show";
import { ChallengeIcon } from "@/components/stage/ChallengeIcon";
import { cn } from "@/lib/cn";
import { TEAM_ORDER } from "@/lib/constants";
import { adjacentQuestion, getQuestion, getQuestionSet, getStep } from "@/lib/game";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import type { ChallengeRow } from "@/hooks/useScores";
import type { ChallengeId, GameState, TeamId } from "@/lib/types";

type Target = { set: string; index: number } | null;

interface QuickBarProps {
  gameState: GameState;
  byChallenge: ChallengeRow[];
}

/**
 * Bottom bar for running the evening from a phone: +/- points for the two
 * teams on one challenge (by default the current step's) and previous / next
 * / answer for the questions, always within thumb reach.
 */
export function QuickBar({ gameState, byChallenge }: QuickBarProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const content = useGameContent();
  const { teams, challenges } = content;

  // Challenge: follows the running order unless picked by hand; a new step resets it.
  const step = getStep(content, gameState.show_step);
  const [picked, setPicked] = useState<ChallengeId | null>(null);
  useEffect(() => setPicked(null), [gameState.show_step]);
  const challenge =
    challenges.find((c) => c.id === (picked ?? step?.challengeId)) ?? challenges[0];
  const challengeId: ChallengeId = challenge?.id ?? "";
  const row = byChallenge.find((r) => r.challengeId === challengeId);

  // Questions: from the one on screen, or the last one shown after it was taken off.
  const live = getQuestion(content, gameState.question_set, gameState.question_index);
  const lastShown = useRef<Target>(null);
  if (live) lastShown.current = { set: live.set.id, index: live.index };
  const anchorSet = getQuestionSet(content, live?.set.id ?? lastShown.current?.set);
  const anchor: Target = live ? { set: live.set.id, index: live.index } : anchorSet ? lastShown.current : null;
  // Pick-a-number sets are chosen from the board, not stepped through.
  const steps = !anchorSet?.pickByNumber;
  // Nothing shown yet: ▶ starts the current step's round (its first set if no round matches).
  const stepSets = content.questionSets.filter((s) => s.step === gameState.show_step && !s.pickByNumber);
  const startSet = stepSets.find((s) => s.substep === (gameState.show_substep ?? 0)) ?? stepSets[0];
  const start: Target = startSet ? { set: startSet.id, index: 0 } : null;
  const next: Target = anchor ? (steps ? adjacentQuestion(content, anchor.set, anchor.index, 1) : null) : start;
  const prev: Target = anchor && steps ? adjacentQuestion(content, anchor.set, anchor.index, -1) : null;
  const showQuestions = Boolean(live || start || (anchor && steps));

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  const points = (team: TeamId) => row?.[team] ?? 0;
  const adjust = (teamId: TeamId, delta: number) => run(() => adjustScore({ challengeId, teamId, delta }));
  const go = (target: Target) => target && run(() => showQuestion(target));

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-plum-700/80 bg-void/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="mx-auto flex items-center gap-2 font-sans text-[0.6rem] uppercase tracking-[0.25em] text-ink-dim"
          aria-expanded={!collapsed}
        >
          <span className="block h-1 w-8 rounded-full bg-ink-dim/40" />
          {collapsed ? "Comandi rapidi" : "Riduci"}
        </button>

        {!collapsed && (
          <>
            {showQuestions && (
              <div className="flex items-center gap-2">
                <BarButton disabled={pending || !prev} onClick={() => go(prev)} aria-label="Domanda precedente">
                  ◀
                </BarButton>
                <BarButton
                  className="flex-1"
                  disabled={pending || !live}
                  active={gameState.question_answer_visible}
                  onClick={() => run(() => setAnswerVisible({ visible: !gameState.question_answer_visible }))}
                >
                  <span className="block truncate">
                    {live
                      ? `${live.set.label} ${live.index + 1}/${live.set.questions.length} · ${
                          gameState.question_answer_visible ? "Nascondi risposta" : "Risposta"
                        }`
                      : "Nessuna domanda a schermo"}
                  </span>
                </BarButton>
                <BarButton primary disabled={pending || !next} onClick={() => go(next)} aria-label="Domanda successiva">
                  {live ? "▶" : next ? `${getQuestionSet(content, next.set)?.label ?? ""} ${next.index + 1} ▶` : "▶"}
                </BarButton>
              </div>
            )}

            <div className="flex items-center justify-between gap-1">
              {challenges.map(({ id, name, icon }, i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPicked(id)}
                  aria-label={name}
                  aria-pressed={id === challengeId}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center gap-1 rounded-lg font-numeric text-base transition-colors",
                    id === challengeId ? "bg-gold-400 text-void" : "bg-plum-900/70 text-ink-dim"
                  )}
                >
                  {i + 1}
                  <ChallengeIcon icon={icon} className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {TEAM_ORDER.map((team) => (
                <div
                  key={team}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border p-1.5",
                    team === "a" ? "border-team-a/40" : "border-team-b/40"
                  )}
                >
                  <button
                    type="button"
                    disabled={pending || points(team) === 0}
                    onClick={() => adjust(team, -1)}
                    aria-label={`Togli un punto ai ${teams[team].name}`}
                    className="h-12 w-10 shrink-0 rounded-lg bg-plum-900/70 text-xl text-ink-dim disabled:opacity-40"
                  >
                    −
                  </button>
                  <div className="min-w-0 flex-1 text-center leading-none">
                    <p className={cn("truncate font-sans text-[0.6rem] uppercase tracking-[0.04em]", team === "a" ? "text-team-a" : "text-team-b")}>
                      {teams[team].name}
                    </p>
                    <p className="font-numeric text-2xl text-cream">{points(team)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => adjust(team, 1)}
                    aria-label={`Un punto ai ${teams[team].name}`}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-lg font-numeric text-2xl text-void disabled:opacity-60",
                      team === "a" ? "bg-team-a" : "bg-team-b"
                    )}
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>
            <p className="-mt-1 truncate text-center font-sans text-[0.6rem] uppercase tracking-[0.2em] text-ink-dim">
              Punti a: {challenge?.name}
            </p>
          </>
        )}

        {error && <p className="text-center font-sans text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}

function BarButton({
  children,
  className,
  primary,
  active,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex h-11 min-w-11 items-center justify-center rounded-xl px-3 font-sans text-sm transition-colors disabled:opacity-40",
        primary ? "bg-gold-400 text-void" : active ? "bg-gold-400/20 text-gold-200" : "bg-plum-900/70 text-cream",
        className
      )}
    >
      {children}
    </button>
  );
}
