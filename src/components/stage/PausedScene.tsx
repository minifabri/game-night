"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { GameState, TeamTotals } from "@/lib/types";

interface PausedSceneProps {
  gameState: GameState;
  totals: TeamTotals;
  variant?: "tv" | "phone";
}

export function PausedScene({ gameState, totals, variant = "phone" }: PausedSceneProps) {
  const isTv = variant === "tv";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-dvh w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{ opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(ellipse 55% 45% at 50% 50%, var(--color-plum-600), transparent 70%)",
        }}
      />

      <div className={cn("flex items-center", isTv ? "gap-5" : "gap-3")} aria-hidden>
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={cn("rounded-full bg-gold-400", isTv ? "h-24 w-7" : "h-14 w-4")}
          />
        ))}
      </div>

      <p
        className={cn(
          "font-display font-medium tracking-[0.08em] text-gold-300",
          isTv ? "text-9xl" : "text-6xl"
        )}
      >
        Pausa
      </p>

      <p className={cn("max-w-3xl font-sans text-cream", isTv ? "text-3xl" : "text-lg")}>
        {gameState.pause_message || "Si riprende tra poco"}
      </p>

      <div
        className={cn(
          "mt-4 flex items-baseline font-numeric",
          isTv ? "gap-10 text-6xl" : "gap-6 text-3xl"
        )}
      >
        <span className="text-team-a">{totals.a}</span>
        <span className="text-ink-dim/50">–</span>
        <span className="text-team-b">{totals.b}</span>
      </div>
    </motion.div>
  );
}
