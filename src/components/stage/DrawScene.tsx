"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTick } from "@/hooks/useTick";
import { DRAW_SHUFFLE_MS, DRAW_TOTAL_HOLD_MS } from "@/lib/constants";
import { finishDraw } from "@/lib/actions/admin";
import type { GameState, Participant } from "@/lib/types";

interface DrawSceneProps {
  gameState: GameState;
  participants: Participant[];
  isCanonical: boolean;
  variant?: "tv" | "phone";
}

export function DrawScene({ gameState, participants, isCanonical, variant = "phone" }: DrawSceneProps) {
  const isTv = variant === "tv";
  const now = useTick(100);
  const settledRef = useRef<number | null>(null);

  const startedAt = gameState.draw_started_at ? new Date(gameState.draw_started_at).getTime() : now;
  const elapsed = now - startedAt;
  const revealed = elapsed >= DRAW_SHUFFLE_MS;

  const gymPool = participants.filter((p) => p.team_id === "palestrati").map((p) => p.name);
  const couchPool = participants.filter((p) => p.team_id === "divanisti").map((p) => p.name);

  const gymFinal = participants.find((p) => p.id === gameState.draw_gym_participant_id)?.name ?? null;
  const couchFinal = participants.find((p) => p.id === gameState.draw_couch_participant_id)?.name ?? null;

  // A single-team draw only shuffles that team; the other side shows its
  // earlier pick (the opponent) or a question mark if not drawn yet.
  const drawingGym = gameState.draw_team !== "divanisti";
  const drawingCouch = gameState.draw_team !== "palestrati";

  const gymShuffle = useShuffleName(drawingGym ? gymPool : [], gameState.draw_nonce, revealed, gymFinal ?? "—");
  const couchShuffle = useShuffleName(drawingCouch ? couchPool : [], gameState.draw_nonce, revealed, couchFinal ?? "—");

  const heading =
    gameState.draw_team === "palestrati"
      ? "Estrazione Palestrati"
      : gameState.draw_team === "divanisti"
        ? "Estrazione Divanisti"
        : "Estrazione in corso";

  useEffect(() => {
    if (!isCanonical) return;
    if (elapsed < DRAW_TOTAL_HOLD_MS) return;
    if (settledRef.current === gameState.draw_nonce) return;
    settledRef.current = gameState.draw_nonce;
    finishDraw();
  }, [isCanonical, elapsed, gameState.draw_nonce]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <p
        className={cn(
          "font-sans uppercase tracking-[0.5em] text-gold-400 transition-opacity",
          isTv ? "text-xl" : "text-xs",
          revealed && !gameState.draw_team && "opacity-0"
        )}
      >
        {heading}
      </p>

      <div className={cn("flex w-full flex-col items-center", isTv ? "gap-10" : "gap-6")}>
        <NamePod
          teamLabel="Palestrati"
          name={drawingGym ? (revealed ? gymFinal ?? "—" : gymShuffle) : gymFinal}
          color="gym"
          isTv={isTv}
          revealed={revealed}
          idle={!drawingGym}
        />

        <motion.p
          animate={revealed ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.6 }}
          className={cn("font-display italic text-gold-400", isTv ? "text-4xl" : "text-2xl")}
        >
          vs
        </motion.p>

        <NamePod
          teamLabel="Divanisti"
          name={drawingCouch ? (revealed ? couchFinal ?? "—" : couchShuffle) : couchFinal}
          color="couch"
          isTv={isTv}
          revealed={revealed}
          idle={!drawingCouch}
          reverse
        />
      </div>
    </div>
  );
}

function NamePod({
  teamLabel,
  name,
  color,
  isTv,
  revealed,
  idle,
  reverse,
}: {
  teamLabel: string;
  /** null = this team hasn't been drawn yet (only when `idle`). */
  name: string | null;
  color: "gym" | "couch";
  isTv: boolean;
  revealed: boolean;
  /** Not part of the current draw: shown still, dimmed, with no reveal animation. */
  idle?: boolean;
  reverse?: boolean;
}) {
  const glow = revealed || idle;
  return (
    <div className={cn("flex flex-col items-center", reverse && "flex-col-reverse")}>
      <p
        className={cn(
          "font-sans uppercase tracking-[0.4em]",
          color === "gym" ? "text-gym" : "text-couch",
          isTv ? "text-lg" : "text-xs"
        )}
      >
        {teamLabel}
      </p>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={name ?? "?"}
          initial={idle ? false : { opacity: 0, y: revealed ? 20 : 4, scale: revealed ? 0.85 : 1 }}
          animate={{ opacity: idle ? 0.55 : 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: revealed ? 0.5 : 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-display font-medium leading-tight text-cream",
            name && glow && (color === "gym" ? "drop-shadow-[0_0_24px_rgba(255,106,69,0.45)]" : "drop-shadow-[0_0_24px_rgba(87,211,200,0.45)]"),
            isTv ? "text-7xl" : "text-4xl"
          )}
        >
          {name ?? "?"}
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
