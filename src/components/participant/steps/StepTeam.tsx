"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TEAM_ORDER } from "@/lib/constants";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import type { TeamId } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function StepTeam({
  onNext,
  submitting = false,
  error = null,
}: {
  onNext: (team: TeamId) => void;
  /** Set when this is the last step (the game doesn't ask what to bring). */
  submitting?: boolean;
  error?: string | null;
}) {
  const [selected, setSelected] = useState<TeamId | null>(null);
  const { teams } = useGameContent();

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl font-medium text-cream sm:text-4xl"
      >
        Scegli la tua squadra
      </motion.p>

      <div className="grid w-full grid-cols-2 gap-4">
        {TEAM_ORDER.map((teamId, i) => (
          <motion.button
            key={teamId}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelected(teamId)}
            className={cn(
              "flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 transition-colors",
              teamId === "a"
                ? "border-team-a/40 bg-team-a/5"
                : "border-team-b/40 bg-team-b/5",
              selected === teamId &&
                (teamId === "a"
                  ? "border-team-a bg-team-a/15 shadow-[0_0_40px_color-mix(in_srgb,var(--color-team-a)_25%,transparent)]"
                  : "border-team-b bg-team-b/15 shadow-[0_0_40px_color-mix(in_srgb,var(--color-team-b)_25%,transparent)]")
            )}
          >
            <span
              className={cn(
                "font-display text-xl font-medium leading-tight sm:text-2xl",
                teamId === "a" ? "text-team-a" : "text-team-b"
              )}
            >
              {teams[teamId].name}
            </span>
          </motion.button>
        ))}
      </div>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      <motion.div
        animate={{ opacity: selected ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      >
        <Button size="lg" disabled={!selected || submitting} onClick={() => selected && onNext(selected)}>
          {submitting ? "Un attimo…" : "Continua"}
        </Button>
      </motion.div>
    </div>
  );
}
