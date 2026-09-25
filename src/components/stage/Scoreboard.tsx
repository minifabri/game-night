"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { TeamTotals } from "@/lib/types";
import type { ChallengeRow } from "@/hooks/useScores";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { ChallengeIcon } from "@/components/stage/ChallengeIcon";

interface ScoreboardProps {
  totals: TeamTotals;
  byChallenge: ChallengeRow[];
  variant?: "tv" | "phone";
  finalTag?: string;
  /** Rendered above the totals (the running-order track). */
  header?: React.ReactNode;
}

export function Scoreboard({ totals, byChallenge, variant = "phone", finalTag, header }: ScoreboardProps) {
  const isTv = variant === "tv";
  const content = useGameContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("mx-auto w-full", isTv ? "max-w-6xl px-10 py-8" : "max-w-md px-5 py-6")}
    >
      {header}
      {finalTag && (
        <p className="mb-4 text-center font-sans text-xs uppercase tracking-[0.5em] text-gold-400">
          {finalTag}
        </p>
      )}

      <div className="grid grid-cols-2 items-end gap-4">
        <TeamTotal label={content.teams.a.name} value={totals.a} team="a" isTv={isTv} align="start" />
        <TeamTotal label={content.teams.b.name} value={totals.b} team="b" isTv={isTv} align="end" />
      </div>

      <div
        className={cn(
          "relative mx-auto my-4 h-px w-full bg-gradient-to-r from-transparent via-gold-400/50 to-transparent",
          isTv && "my-6"
        )}
      />

      <div className={cn("space-y-1.5", isTv && "space-y-2")}>
        {byChallenge.map((row, i) => {
          const challenge = content.challenges.find((c) => c.id === row.challengeId);
          return (
            <div
              key={row.challengeId}
              className={cn(
                "grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl px-3 py-2",
                "bg-plum-900/40",
                isTv && "px-5 py-3"
              )}
            >
              <AnimatedNumber
                value={row.a}
                className={cn("justify-self-end font-numeric text-team-a-soft", isTv ? "text-3xl" : "text-lg")}
              />
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full border border-gold-400/40 font-numeric text-gold-300",
                    isTv ? "h-7 w-7 text-base" : "h-4 w-4 text-[0.6rem]"
                  )}
                >
                  {i + 1}
                </span>
                <ChallengeIcon
                  icon={challenge?.icon}
                  className={cn("shrink-0 text-gold-400/80", isTv ? "h-6 w-6" : "h-3.5 w-3.5")}
                />
                <p
                  className={cn(
                    "text-center font-sans uppercase tracking-[0.15em] text-ink-dim",
                    isTv ? "text-sm" : "text-[0.65rem]"
                  )}
                >
                  {challenge?.name}
                </p>
              </div>
              <AnimatedNumber
                value={row.b}
                className={cn("justify-self-start font-numeric text-team-b-soft", isTv ? "text-3xl" : "text-lg")}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TeamTotal({
  label,
  value,
  team,
  isTv,
  align,
}: {
  label: string;
  value: number;
  team: "a" | "b";
  isTv: boolean;
  align: "start" | "end";
}) {
  return (
    <div className={cn("flex flex-col", align === "start" ? "items-start" : "items-end")}>
      <p
        className={cn(
          "font-display font-medium tracking-wide",
          team === "a" ? "text-team-a" : "text-team-b",
          isTv ? "text-2xl sm:text-3xl" : "text-base"
        )}
      >
        {label}
      </p>
      <AnimatedNumber
        value={value}
        className={cn(
          "font-numeric leading-none text-cream",
          isTv ? "text-[7rem] sm:text-[9rem]" : "text-6xl"
        )}
      />
    </div>
  );
}
