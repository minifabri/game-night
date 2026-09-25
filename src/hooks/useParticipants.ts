"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Participant } from "@/lib/types";

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .order("created_at", { ascending: true });
      if (active) {
        setParticipants((data as Participant[]) ?? []);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("participants_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { participants, loading };
}
