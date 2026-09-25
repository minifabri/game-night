"use client";

import { useEffect, useRef, useState } from "react";
import type { ChallengeId, TeamId } from "@/lib/types";
import type { ChallengeRow } from "@/hooks/useScores";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import { setScore } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { ChallengeIcon } from "@/components/stage/ChallengeIcon";
import { cn } from "@/lib/cn";

interface ScoreEditorProps {
  byChallenge: ChallengeRow[];
}

export function ScoreEditor({ byChallenge }: ScoreEditorProps) {
  const { challenges } = useGameContent();
  return (
    <Panel title="Punteggi">
      <div className="flex flex-col gap-4">
        {challenges.map((challenge, i) => {
          const challengeId = challenge.id;
          const row = byChallenge.find((r) => r.challengeId === challengeId);
          return (
            <div key={challengeId}>
              <p className="mb-2 flex items-center gap-2 font-sans text-sm text-ink-dim">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold-400/40 font-numeric text-xs text-gold-300">
                  {i + 1}
                </span>
                <ChallengeIcon icon={challenge.icon} className="h-4 w-4 shrink-0 text-gold-400/80" />
                {challenge.name}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ScoreCell challengeId={challengeId} teamId="a" points={row?.a ?? 0} />
                <ScoreCell challengeId={challengeId} teamId="b" points={row?.b ?? 0} />
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
        teamId === "a" ? "border-team-a/30" : "border-team-b/30"
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
          teamId === "a" ? "text-team-a" : "text-team-b",
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
