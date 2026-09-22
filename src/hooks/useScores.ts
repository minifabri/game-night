"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CHALLENGE_ORDER } from "@/lib/constants";
import type { Score, TeamTotals } from "@/lib/types";

export function useScores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data } = await supabase.from("scores").select("*");
      if (active) {
        setScores((data as Score[]) ?? []);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("scores_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const totals: TeamTotals = useMemo(() => {
    return scores.reduce(
      (acc, s) => {
        acc[s.team_id] += s.points;
        return acc;
      },
      { palestrati: 0, divanisti: 0 } as TeamTotals
    );
  }, [scores]);

  const byChallenge = useMemo(() => {
    return CHALLENGE_ORDER.map((challengeId) => ({
      challengeId,
      palestrati: scores.find((s) => s.challenge_id === challengeId && s.team_id === "palestrati")?.points ?? 0,
      divanisti: scores.find((s) => s.challenge_id === challengeId && s.team_id === "divanisti")?.points ?? 0,
    }));
  }, [scores]);

  return { scores, totals, byChallenge, loading };
}
