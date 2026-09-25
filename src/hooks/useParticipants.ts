"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Participant } from "@/lib/types";

/** Participants of one game, live. */
export function useParticipants(gameId: string | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });
      if (active) {
        setParticipants((data as Participant[]) ?? []);
        setLoadedFor(gameId);
      }
    }

    load();

    const channel = supabase
      .channel(`participants_${gameId}`)
      .on(
        "postgres_changes",
        // Unfiltered on purpose: realtime filters don't deliver DELETEs.
        { event: "*", schema: "public", table: "participants" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const loading = loadedFor !== gameId;
  return { participants: loading ? [] : participants, loading };
}
