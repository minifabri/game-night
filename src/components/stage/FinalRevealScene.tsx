"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTick } from "@/hooks/useTick";
import { FINAL_SUSPENSE_MS, FINAL_TOTAL_MS } from "@/lib/constants";
import { settleFinalReveal } from "@/lib/actions/admin";
import { TEAMS } from "@/lib/constants";
import { Particles } from "@/components/stage/Particles";
import type { GameState } from "@/lib/types";

interface FinalRevealSceneProps {
  gameState: GameState;
  isCanonical: boolean;
  variant?: "tv" | "phone";
}

export function FinalRevealScene({ gameState, isCanonical, variant = "phone" }: FinalRevealSceneProps) {
  const isTv = variant === "tv";
  const now = useTick(100);
  const settledRef = useRef<number | null>(null);

  const startedAt = gameState.final_started_at ? new Date(gameState.final_started_at).getTime() : now;
  const elapsed = now - startedAt;
  const revealed = elapsed >= FINAL_SUSPENSE_MS;

  useEffect(() => {
    if (!isCanonical) return;
    if (elapsed < FINAL_TOTAL_MS) return;
    if (settledRef.current === gameState.final_nonce) return;
    settledRef.current = gameState.final_nonce;
    settleFinalReveal();
  }, [isCanonical, elapsed, gameState.final_nonce]);

  const winnerColor = gameState.final_winner_team_id === "palestrati" ? "gym" : "couch";

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      {revealed && <Particles color={gameState.final_is_draw ? "gold" : winnerColor} />}

      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="suspense"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              className="absolute inset-0 -z-10"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, var(--color-gold-400), transparent 70%)",
              }}
            />
            <p
              className={cn(
                "font-display font-medium tracking-[0.08em] text-gold-300",
                isTv ? "text-8xl" : "text-5xl"
              )}
            >
              Vincono<motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                …
              </motion.span>
            </p>
            <div className={cn("flex gap-10 font-numeric text-ink-dim", isTv ? "text-4xl" : "text-2xl")}>
              <span>{gameState.final_gym_score ?? 0}</span>
              <span className="opacity-40">–</span>
              <span>{gameState.final_couch_score ?? 0}</span>
            </div>
          </motion.div>
        ) : gameState.final_is_draw ? (
          <motion.div
            key="draw"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="flex flex-col items-center gap-4"
          >
            <p
              className={cn(
                "font-display font-medium tracking-[0.06em] text-gold-300",
                isTv ? "text-9xl" : "text-6xl"
              )}
            >
              Pareggio!
            </p>
            <p className={cn("font-numeric text-cream", isTv ? "text-5xl" : "text-3xl")}>
              {gameState.final_gym_score} – {gameState.final_couch_score}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="winner"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="flex flex-col items-center gap-4"
          >
            <p className={cn("font-sans uppercase tracking-[0.5em] text-gold-400", isTv ? "text-2xl" : "text-sm")}>
              Vincono
            </p>
            <p
              className={cn(
                "font-display font-medium tracking-[0.04em]",
                winnerColor === "gym" ? "text-gym" : "text-couch",
                winnerColor === "gym"
                  ? "drop-shadow-[0_0_60px_rgba(255,106,69,0.55)]"
                  : "drop-shadow-[0_0_60px_rgba(87,211,200,0.55)]",
                isTv ? "text-[10rem]" : "text-7xl"
              )}
            >
              {gameState.final_winner_team_id ? TEAMS[gameState.final_winner_team_id].name : ""}!
            </p>
            <p className={cn("font-numeric text-cream", isTv ? "text-5xl" : "text-3xl")}>
              {gameState.final_gym_score} – {gameState.final_couch_score}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
