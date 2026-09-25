"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/game";

/** A game's public content, live (a `npm run game:load` reaches open screens). */
export function useGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const supabase = getSupabaseBrowserClient();
    let active = true;
    setLoading(true);

    async function load() {
      const { data, error: fetchError } = await supabase.from("games").select("*").eq("id", gameId).single();
      if (!active) return;
      setError(fetchError ? fetchError.message : null);
      setGame((data as Game | null) ?? null);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`game_${gameId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` }, () =>
        load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { game: game?.id === gameId ? game : null, loading: loading || game?.id !== gameId, error };
}
