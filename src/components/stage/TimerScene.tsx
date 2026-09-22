"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTick, msUntil } from "@/hooks/useTick";
import { formatClock } from "@/lib/format";
import { TIMER_TIMEOUT_HOLD_MS } from "@/lib/constants";
import { finishTimer } from "@/lib/actions/admin";
import type { GameState } from "@/lib/types";

interface TimerSceneProps {
  gameState: GameState;
  isCanonical: boolean;
  variant?: "tv" | "phone";
}

export function TimerScene({ gameState, isCanonical, variant = "phone" }: TimerSceneProps) {
  const now = useTick(100);
  const isTv = variant === "tv";
  const settledRef = useRef<number | null>(null);

  const countdownRemaining = msUntil(gameState.timer_countdown_ends_at, now);
  const timerRemaining =
    gameState.timer_phase === "paused"
      ? gameState.timer_remaining_ms ?? 0
      : msUntil(gameState.timer_ends_at, now);

  const inStartupCountdown =
    gameState.timer_phase === "active" && countdownRemaining !== null && countdownRemaining > 0;
  const timedOut =
    gameState.timer_phase === "active" && !inStartupCountdown && (timerRemaining ?? 0) <= 0;
  const timeSinceTimeout = timedOut ? now - new Date(gameState.timer_ends_at!).getTime() : 0;

  useEffect(() => {
    if (!isCanonical || !timedOut) return;
    if (timeSinceTimeout < TIMER_TIMEOUT_HOLD_MS) return;
    if (settledRef.current === gameState.timer_nonce) return;
    settledRef.current = gameState.timer_nonce;
    finishTimer();
  }, [isCanonical, timedOut, timeSinceTimeout, gameState.timer_nonce]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {inStartupCountdown ? (
          <StartupCountdown key="countdown" ms={countdownRemaining ?? 0} isTv={isTv} />
        ) : timedOut ? (
          <TimeoutCard key="timeout" isTv={isTv} />
        ) : (
          <RunningTimer
            key="running"
            ms={timerRemaining ?? 0}
            label={gameState.timer_label}
            paused={gameState.timer_phase === "paused"}
            isTv={isTv}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StartupCountdown({ ms, isTv }: { ms: number; isTv: boolean }) {
  const digit = Math.max(1, Math.min(3, Math.ceil(ms / 1000)));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      <p
        className={cn(
          "font-sans uppercase tracking-[0.5em] text-gold-400",
          isTv ? "text-2xl" : "text-sm"
        )}
      >
        Game starts in
      </p>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={digit}
          initial={{ opacity: 0, scale: 1.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn("font-numeric leading-none text-cream", isTv ? "text-[16rem]" : "text-8xl")}
        >
          {digit}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

function RunningTimer({
  ms,
  label,
  paused,
  isTv,
}: {
  ms: number;
  label: string | null;
  paused: boolean;
  isTv: boolean;
}) {
  const secondsLeft = Math.ceil(ms / 1000);
  const urgent = secondsLeft <= 5 && !paused;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4"
    >
      {label && (
        <p className={cn("font-sans uppercase tracking-[0.4em] text-gold-400", isTv ? "text-xl" : "text-xs")}>
          {label}
        </p>
      )}
      <motion.p
        key={urgent ? secondsLeft : "steady"}
        initial={urgent ? { scale: 1.12 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "font-numeric leading-none",
          urgent ? "text-gym" : "text-cream",
          isTv ? "text-[18rem]" : "text-9xl"
        )}
      >
        {formatClock(ms)}
      </motion.p>
      {paused && (
        <p className={cn("font-sans uppercase tracking-[0.4em] text-ink-dim", isTv ? "text-lg" : "text-xs")}>
          In pausa
        </p>
      )}
    </motion.div>
  );
}

function TimeoutCard({ isTv }: { isTv: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-3"
    >
      <p className={cn("font-display font-medium tracking-[0.1em] text-gym", isTv ? "text-[8rem]" : "text-6xl")}>
        Time out
      </p>
    </motion.div>
  );
}
