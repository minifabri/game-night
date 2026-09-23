"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AudioState } from "@/lib/types";

/** Live audio_state row. `error` is set when the audio migration hasn't been applied yet. */
export function useAudioState() {
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("audio_state")
        .select("*")
        .eq("id", 1)
        .single();
      if (active) {
        setError(fetchError ? fetchError.message : null);
        setAudioState(data as AudioState | null);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("audio_state_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audio_state", filter: "id=eq.1" },
        (payload) => {
          if (active) setAudioState(payload.new as AudioState);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { audioState, loading, error };
}
