"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TEAMS } from "@/lib/constants";
import { QUESTION_SETS, type ShowStep } from "@/lib/show";
import { StepTrack } from "@/components/stage/StepTrack";
import { ChallengeIcon } from "@/components/stage/ChallengeIcon";
import { Scoreboard } from "@/components/stage/Scoreboard";
import type { ChallengeId, GameState, TeamTotals } from "@/lib/types";

interface StepCardSceneProps {
  step: ShowStep;
  gameState: GameState;
  totals: TeamTotals;
  byChallenge: { challengeId: ChallengeId; palestrati: number; divanisti: number }[];
  variant?: "tv" | "phone";
}

/** Full-screen card of the step in progress: what's on now and what's next. */
export function StepCardScene({ step, gameState, totals, byChallenge, variant = "phone" }: StepCardSceneProps) {
  const isTv = variant === "tv";
  // Steps with a big body (number board, scoreboard) get a smaller title to fit a 16:9 TV.
  const compact = step.id === "finalissima" || step.id === "prefinal";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative flex min-h-dvh w-full flex-col items-center", isTv ? "gap-8 py-10" : "gap-6 px-5 py-6")}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        animate={{ opacity: [0.1, 0.22, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 45%, var(--color-plum-600), transparent 70%)" }}
      />

      <StepTrack current={step.id} variant={variant} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn("flex w-full flex-1 flex-col items-center justify-center text-center", isTv ? "gap-8 px-12" : "gap-5")}
        >
          <div className={cn("flex flex-col items-center", isTv ? "gap-3" : "gap-2")}>
            <div className="flex items-center gap-3">
              {step.challengeId && (
                <ChallengeIcon id={step.challengeId} className={cn("text-gold-400", isTv ? "h-9 w-9" : "h-5 w-5")} />
              )}
              <p className={cn("font-sans uppercase tracking-[0.5em] text-gold-400", isTv ? "text-2xl" : "text-xs")}>
                {step.kicker}
              </p>
            </div>
            <h1 className={cn("font-display font-medium leading-none text-cream", isTv ? (compact ? "text-7xl" : "text-[7rem]") : "text-5xl")}>
              {step.title}
            </h1>
            <p className={cn("max-w-4xl text-balance font-sans text-ink-dim", isTv ? "text-3xl" : "text-base")}>
              {step.tagline}
            </p>
          </div>

          {step.id === "opening" && <TeamsFaceOff isTv={isTv} />}
          {step.substeps && <Substeps step={step} active={gameState.show_substep ?? 0} isTv={isTv} />}
          {step.id === "finalissima" && <NumberBoard used={gameState.finalissima_used ?? []} isTv={isTv} />}
          {step.id === "prefinal" && (
            <Scoreboard totals={totals} byChallenge={byChallenge} variant={variant} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function TeamsFaceOff({ isTv }: { isTv: boolean }) {
  return (
    <div className={cn("flex items-baseline font-display font-medium", isTv ? "gap-10 text-7xl" : "gap-4 text-3xl")}>
      <span className="text-gym">{TEAMS.palestrati.name}</span>
      <span className={cn("font-sans uppercase tracking-[0.3em] text-gold-400", isTv ? "text-2xl" : "text-xs")}>vs</span>
      <span className="text-couch">{TEAMS.divanisti.name}</span>
    </div>
  );
}

function Substeps({ step, active, isTv }: { step: ShowStep; active: number; isTv: boolean }) {
  const substeps = step.substeps ?? [];
  const current = substeps[active];

  return (
    <div className={cn("flex w-full flex-col items-center", isTv ? "max-w-6xl gap-6" : "max-w-md gap-4")}>
      <div className={cn("grid w-full", isTv ? "gap-5" : "gap-2")} style={{ gridTemplateColumns: `repeat(${substeps.length}, minmax(0, 1fr))` }}>
        {substeps.map((sub, i) => {
          const state = i === active ? "current" : i < active ? "done" : "todo";
          const hidden = step.secretSubsteps && state === "todo";
          return (
            <motion.div
              key={sub.title}
              layout
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border transition-colors duration-500",
                isTv ? "gap-2 px-5 py-6" : "gap-1 px-2 py-3",
                state === "current" && "bg-gold-400/15 shadow-[0_0_50px_rgba(221,179,103,0.3)] ring-2 ring-gold-300",
                state === "done" && "border-gold-400/30 bg-plum-900/40 opacity-70",
                state === "todo" && "border-ink-dim/15 bg-plum-900/20 opacity-50"
              )}
            >
              <p
                className={cn(
                  "font-sans uppercase tracking-[0.3em]",
                  state === "current" ? "text-gold-300" : "text-ink-dim",
                  isTv ? "text-base" : "text-[0.55rem]"
                )}
              >
                {step.substepLabel} {i + 1}
              </p>
              <p
                className={cn(
                  "font-display font-medium leading-tight",
                  state === "current" ? "text-cream" : "text-ink-dim",
                  isTv ? "text-4xl" : "text-sm"
                )}
              >
                {hidden ? "?" : sub.title}
              </p>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {current && (
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={cn("max-w-4xl text-balance font-sans text-cream", isTv ? "text-3xl" : "text-sm")}
          >
            {current.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function NumberBoard({ used, isTv }: { used: number[]; isTv: boolean }) {
  const count = QUESTION_SETS.finalissima.questions.length;
  return (
    <div className={cn("grid w-full grid-cols-5", isTv ? "max-w-4xl gap-4" : "max-w-sm gap-2")}>
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const taken = used.includes(n);
        return (
          <motion.div
            key={n}
            initial={false}
            animate={{ opacity: taken ? 0.3 : 1, scale: taken ? 0.92 : 1 }}
            transition={{ duration: 0.4 }}
            className={cn(
              "relative flex aspect-[5/3] items-center justify-center rounded-2xl border font-numeric",
              taken ? "bg-void text-ink-dim" : "bg-plum-900/60 text-gold-200 ring-1 ring-gold-400/60",
              isTv ? "text-7xl" : "text-3xl"
            )}
          >
            {n}
            {taken && (
              <span aria-hidden className="absolute inset-x-[18%] top-1/2 h-[3px] -rotate-12 rounded-full bg-gym/70" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
