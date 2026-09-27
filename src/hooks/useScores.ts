"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChallengeInfo } from "@/lib/game";
import type { ChallengeId, Score, TeamTotals } from "@/lib/types";

export interface ChallengeRow {
  challengeId: ChallengeId;
  a: number;
  b: number;
}

/** Scores of one game, live; rows follow the game's challenges (missing = 0). */
export function useScores(gameId: string | null, challenges: ChallengeInfo[]) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data } = await supabase.from("scores").select("*").eq("game_id", gameId);
      if (active) {
        setScores((data as Score[]) ?? []);
        setLoadedFor(gameId);
      }
    }

    load();

    const channel = supabase
      .channel(`scores_${gameId}`)
      .on(
        "postgres_changes",
        // Unfiltered on purpose: realtime filters don't deliver DELETEs.
        { event: "*", schema: "public", table: "scores" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const current = useMemo(() => (loadedFor === gameId ? scores : []), [loadedFor, gameId, scores]);

  const byChallenge: ChallengeRow[] = useMemo(() => {
    const points = (challengeId: string, team: "a" | "b") =>
      current.find((s) => s.challenge_id === challengeId && s.team_id === team)?.points ?? 0;
    return challenges.map((c) => ({ challengeId: c.id, a: points(c.id, "a"), b: points(c.id, "b") }));
  }, [current, challenges]);

  // Totals only count the game's current challenges, like the rows above.
  const totals: TeamTotals = useMemo(
    () => byChallenge.reduce((acc, row) => ({ a: acc.a + row.a, b: acc.b + row.b }), { a: 0, b: 0 }),
    [byChallenge]
  );

  return { scores: current, totals, byChallenge, loading: loadedFor !== gameId };
}
