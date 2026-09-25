"use client";

import { useEffect, useRef, useState } from "react";
import { CHALLENGE_ORDER, CHALLENGES } from "@/lib/constants";
import type { ChallengeId, TeamId } from "@/lib/types";
import { setScore } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { ChallengeIcon } from "@/components/stage/ChallengeIcon";
import { cn } from "@/lib/cn";

interface ScoreEditorProps {
  byChallenge: { challengeId: ChallengeId; palestrati: number; divanisti: number }[];
}

export function ScoreEditor({ byChallenge }: ScoreEditorProps) {
  return (
    <Panel title="Punteggi">
      <div className="flex flex-col gap-4">
        {CHALLENGE_ORDER.map((challengeId) => {
          const row = byChallenge.find((r) => r.challengeId === challengeId);
          return (
            <div key={challengeId}>
              <p className="mb-2 flex items-center gap-2 font-sans text-sm text-ink-dim">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-400/40 font-numeric text-xs text-gold-300">
                  {CHALLENGES[challengeId].sort_order + 1}
                </span>
                <ChallengeIcon id={challengeId} className="h-4 w-4 shrink-0 text-gold-400/80" />
                {CHALLENGES[challengeId].name}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ScoreCell challengeId={challengeId} teamId="palestrati" points={row?.palestrati ?? 0} />
                <ScoreCell challengeId={challengeId} teamId="divanisti" points={row?.divanisti ?? 0} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ScoreCell({
  challengeId,
  teamId,
  points,
}: {
  challengeId: ChallengeId;
  teamId: TeamId;
  points: number;
}) {
  const [value, setValue] = useState(points);
  const [saving, setSaving] = useState(false);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setValue(points);
  }, [points]);

  async function commit(next: number) {
    const clamped = Math.max(0, Math.min(999, next));
    setValue(clamped);
    setSaving(true);
    await setScore({ challengeId, teamId, points: clamped });
    setSaving(false);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-2 py-1.5",
        teamId === "palestrati" ? "border-gym/30" : "border-couch/30"
      )}
    >
      <button
        type="button"
        aria-label="Diminuisci"
        onClick={() => commit(value - 1)}
        className="h-8 w-8 rounded-lg text-lg text-ink-dim hover:text-cream"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onFocus={() => (focused.current = true)}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={() => {
          focused.current = false;
          commit(value);
        }}
        className={cn(
          "w-12 bg-transparent text-center font-numeric text-2xl outline-none",
          teamId === "palestrati" ? "text-gym" : "text-couch",
          saving && "opacity-60"
        )}
      />
      <button
        type="button"
        aria-label="Aumenta"
        onClick={() => commit(value + 1)}
        className="h-8 w-8 rounded-lg text-lg text-ink-dim hover:text-cream"
      >
        +
      </button>
    </div>
  );
}
