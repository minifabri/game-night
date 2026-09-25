"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import { Scoreboard } from "@/components/stage/Scoreboard";
import type { GameState, TeamTotals } from "@/lib/types";
import type { ChallengeRow } from "@/hooks/useScores";

interface FinishedScreenProps {
  gameState: GameState;
  byChallenge: ChallengeRow[];
  variant?: "tv" | "phone";
}

export function FinishedScreen({ gameState, byChallenge, variant = "phone" }: FinishedScreenProps) {
  const isTv = variant === "tv";
  const totals: TeamTotals = {
    a: gameState.final_a_score ?? 0,
    b: gameState.final_b_score ?? 0,
  };
  const { teams } = useGameContent();
  const winner = gameState.final_winner_team_id ?? "a";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-1 text-center"
      >
        <p className={cn("font-sans uppercase tracking-[0.5em] text-gold-400", isTv ? "text-lg" : "text-xs")}>
          Risultato finale
        </p>
        <p
          className={cn(
            "font-display font-medium",
            gameState.final_is_draw ? "text-gold-300" : winner === "a" ? "text-team-a" : "text-team-b",
            isTv ? "text-6xl" : "text-3xl"
          )}
        >
          {gameState.final_is_draw
            ? "Pareggio"
            : `${teams[winner].name} vincono!`}
        </p>
      </motion.div>

      <Scoreboard totals={totals} byChallenge={byChallenge} variant={variant} />
    </div>
  );
}
