import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GameContent } from "../src/lib/game.ts";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local."
    );
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** The game game_state points at, with its public content. */
export async function getActiveGame(supabase: SupabaseClient): Promise<{ gameId: string; content: GameContent }> {
  const { data: state, error } = await supabase.from("game_state").select("game_id").eq("id", 1).single();
  if (error || !state?.game_id) throw new Error("Nessun gioco attivo: hai applicato la migration 0008?");
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("content")
    .eq("id", state.game_id)
    .single();
  if (gameError || !game) throw new Error(`Il gioco ${state.game_id} non esiste.`);
  return { gameId: state.game_id as string, content: game.content as GameContent };
}
