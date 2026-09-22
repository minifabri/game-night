"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GameState } from "@/lib/types";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("game_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (active) {
        if (fetchError) setError(fetchError.message);
        else setError(null);
        setGameState(data as GameState | null);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("game_state_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_state", filter: "id=eq.1" },
        (payload) => {
          if (active) setGameState(payload.new as GameState);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { gameState, loading, error };
}
