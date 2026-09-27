"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTick } from "@/hooks/useTick";
import { DRAW_SHUFFLE_MS, DRAW_TOTAL_HOLD_MS } from "@/lib/constants";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import { finishDraw } from "@/lib/actions/admin";
import type { GameState, Participant } from "@/lib/types";

interface DrawSceneProps {
  gameState: GameState;
  participants: Participant[];
  isCanonical: boolean;
  variant?: "tv" | "phone";
}

/** Draw of a single team: only that team's name shuffles and is revealed. */
export function DrawScene({ gameState, participants, isCanonical, variant = "phone" }: DrawSceneProps) {
  const isTv = variant === "tv";
  const now = useTick(100);
  const settledRef = useRef<number | null>(null);

  const startedAt = gameState.draw_started_at ? new Date(gameState.draw_started_at).getTime() : now;
  const elapsed = now - startedAt;
  const revealed = elapsed >= DRAW_SHUFFLE_MS;

  const { teams } = useGameContent();
  const team = gameState.draw_team ?? "a";
  const isA = team === "a";
  const pickedId = isA ? gameState.draw_a_participant_id : gameState.draw_b_participant_id;

  const pool = participants.filter((p) => p.team_id === team).map((p) => p.name);
  const finalName = participants.find((p) => p.id === pickedId)?.name ?? "—";
  const shuffled = useShuffleName(pool, gameState.draw_nonce, revealed, finalName);

  useEffect(() => {
    if (!isCanonical) return;
    if (elapsed < DRAW_TOTAL_HOLD_MS) return;
    if (settledRef.current === gameState.draw_nonce) return;
    settledRef.current = gameState.draw_nonce;
    finishDraw();
  }, [isCanonical, elapsed, gameState.draw_nonce]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p
        className={cn(
          "font-sans uppercase tracking-[0.5em]",
          isA ? "text-team-a" : "text-team-b",
          isTv ? "text-3xl" : "text-sm"
        )}
      >
        {teams[team].name}
      </p>

      <p className={cn("font-sans uppercase tracking-[0.4em] text-gold-400", isTv ? "text-xl" : "text-xs")}>
        {revealed ? "Il concorrente è" : "Estrazione in corso"}
      </p>

      <AnimatePresence mode="popLayout">
        <motion.p
          key={shuffled}
          initial={{ opacity: 0, y: revealed ? 20 : 4, scale: revealed ? 0.85 : 1 }}
          animate={{ opacity: 1, y: 0, scale: revealed ? [1, 1.08, 1] : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: revealed ? 0.6 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-display font-medium leading-tight text-cream",
            revealed &&
              (isA
                ? "drop-shadow-[0_0_32px_color-mix(in_srgb,var(--color-team-a)_50%,transparent)]"
                : "drop-shadow-[0_0_32px_color-mix(in_srgb,var(--color-team-b)_50%,transparent)]"),
            isTv ? "text-9xl" : "text-5xl"
          )}
        >
          {shuffled}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/** Cycles rapidly through random names from `pool`, slowing down until it locks on `finalName`. */
function useShuffleName(pool: string[], nonce: number, revealed: boolean, finalName: string) {
  const [display, setDisplay] = useState(pool[0] ?? "…");

  useEffect(() => {
    if (pool.length === 0) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const start = Date.now();

    function tick() {
      if (cancelled) return;
      const progress = Math.min(1, (Date.now() - start) / DRAW_SHUFFLE_MS);
      if (progress >= 1) return;
      setDisplay(pool[Math.floor(Math.random() * pool.length)]);
      const eased = progress * progress;
      const delay = 70 + eased * 320;
      timeoutId = setTimeout(tick, delay);
    }

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, pool.length]);

  return revealed ? finalName : display;
}
