import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GameContent, GameSecrets } from "@/lib/game";

export type ActiveGame = { ok: true; gameId: string; content: GameContent } | { ok: false; error: string };

/** The game being played (game_state.game_id) with its public content, read server-side. */
export async function loadActiveGame(): Promise<ActiveGame> {
  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase.from("game_state").select("game_id").eq("id", 1).single();
  const gameId = state?.game_id as string | undefined;
  if (!gameId) return { ok: false, error: "Nessun gioco attivo (hai applicato la migration 0008?)." };

  const { data: game } = await supabase.from("games").select("content").eq("id", gameId).single();
  if (!game) return { ok: false, error: `Il gioco ${gameId} non esiste.` };
  return { ok: true, gameId, content: game.content as GameContent };
}

/** Presenter's lines and answers of a game: admin-only, never sent to the public screens. */
export async function loadSecrets(gameId: string): Promise<GameSecrets> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("game_secrets").select("content").eq("game_id", gameId).maybeSingle();
  return (data?.content as GameSecrets | undefined) ?? { steps: {}, answers: {} };
}
