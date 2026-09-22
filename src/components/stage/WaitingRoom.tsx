"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { TEAM_ORDER, TEAMS } from "@/lib/constants";
import type { Participant, TeamId } from "@/lib/types";
import { HeroImage } from "@/components/brand/HeroImage";

interface WaitingRoomProps {
  participants: Participant[];
  variant?: "tv" | "phone";
}

export function WaitingRoom({ participants, variant = "phone" }: WaitingRoomProps) {
  const isTv = variant === "tv";
  const byTeam: Record<TeamId, Participant[]> = { palestrati: [], divanisti: [] };
  for (const p of participants) byTeam[p.team_id].push(p);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto flex w-full flex-col"
    >
      {isTv && (
        <div className="mx-auto w-full max-w-3xl">
          <HeroImage priority />
          <p className="-mt-4 pb-2 text-center font-sans text-sm uppercase tracking-[0.4em] text-ink-dim">
            In attesa che la sfida cominci
          </p>
        </div>
      )}

      <div
        className={cn(
          "mx-auto grid w-full grid-cols-2",
          isTv ? "max-w-5xl gap-10 px-10 pb-10" : "max-w-md gap-4 px-5 py-6"
        )}
      >
        {TEAM_ORDER.map((teamId) => (
          <TeamColumn key={teamId} teamId={teamId} people={byTeam[teamId]} isTv={isTv} />
        ))}
      </div>
    </motion.div>
  );
}

function TeamColumn({
  teamId,
  people,
  isTv,
}: {
  teamId: TeamId;
  people: Participant[];
  isTv: boolean;
}) {
  const color = teamId === "palestrati" ? "text-gym" : "text-couch";
  const borderColor = teamId === "palestrati" ? "border-gym/30" : "border-couch/30";

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-plum-900/30 backdrop-blur-sm", borderColor, isTv ? "p-6" : "p-4")}>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className={cn("font-display font-medium", color, isTv ? "text-2xl" : "text-lg")}>
          {TEAMS[teamId].name}
        </h3>
        <span className={cn("font-numeric text-gold-300", isTv ? "text-3xl" : "text-xl")}>
          {people.length}
        </span>
      </div>

      {people.length === 0 ? (
        <p className="font-sans text-xs italic text-ink-dim">In attesa di eroi…</p>
      ) : (
        <ul className={cn("flex flex-col", isTv ? "gap-1.5" : "gap-1")}>
          <AnimatePresence initial={false}>
            {people.map((p) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={cn("truncate font-sans text-ink", isTv ? "text-base" : "text-sm")}
              >
                {p.name}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
