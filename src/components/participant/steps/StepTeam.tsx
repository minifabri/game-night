"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TEAM_ORDER, TEAMS } from "@/lib/constants";
import type { TeamId } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function StepTeam({ onNext }: { onNext: (team: TeamId) => void }) {
  const [selected, setSelected] = useState<TeamId | null>(null);

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
              teamId === "palestrati"
                ? "border-gym/40 bg-gym/5"
                : "border-couch/40 bg-couch/5",
              selected === teamId &&
                (teamId === "palestrati"
                  ? "border-gym bg-gym/15 shadow-[0_0_40px_rgba(255,106,69,0.25)]"
                  : "border-couch bg-couch/15 shadow-[0_0_40px_rgba(87,211,200,0.25)]")
            )}
          >
            <span
              className={cn(
                "font-display text-xl font-medium leading-tight sm:text-2xl",
                teamId === "palestrati" ? "text-gym" : "text-couch"
              )}
            >
              {TEAMS[teamId].name}
            </span>
          </motion.button>
        ))}
      </div>

      <motion.div
        animate={{ opacity: selected ? 1 : 0.3 }}
        transition={{ duration: 0.3 }}
      >
        <Button size="lg" disabled={!selected} onClick={() => selected && onNext(selected)}>
          Continua
        </Button>
      </motion.div>
    </div>
  );
}
