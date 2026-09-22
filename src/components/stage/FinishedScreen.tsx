"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TEAMS } from "@/lib/constants";
import { Scoreboard } from "@/components/stage/Scoreboard";
import type { GameState, TeamTotals } from "@/lib/types";
import type { ChallengeId } from "@/lib/types";

interface FinishedScreenProps {
  gameState: GameState;
  byChallenge: { challengeId: ChallengeId; palestrati: number; divanisti: number }[];
  variant?: "tv" | "phone";
}

export function FinishedScreen({ gameState, byChallenge, variant = "phone" }: FinishedScreenProps) {
  const isTv = variant === "tv";
  const totals: TeamTotals = {
    palestrati: gameState.final_gym_score ?? 0,
    divanisti: gameState.final_couch_score ?? 0,
  };
  const winnerColor = gameState.final_winner_team_id === "palestrati" ? "gym" : "couch";

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
            gameState.final_is_draw ? "text-gold-300" : winnerColor === "gym" ? "text-gym" : "text-couch",
            isTv ? "text-6xl" : "text-3xl"
          )}
        >
          {gameState.final_is_draw
            ? "Pareggio"
            : `${TEAMS[gameState.final_winner_team_id ?? "palestrati"].name} vincono!`}
        </p>
      </motion.div>

      <Scoreboard totals={totals} byChallenge={byChallenge} variant={variant} />
    </div>
  );
}
