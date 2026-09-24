"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Sound } from "@/lib/types";

export function useSounds() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("sounds")
        .select("*")
        .order("created_at", { ascending: true });
      if (active) {
        setSounds((data as Sound[]) ?? []);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("sounds_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "sounds" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { sounds, loading };
}
