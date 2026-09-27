"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LIVE_STATE_RESET } from "@/lib/constants";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<ActionResult> {
  const authed = await isAdminAuthenticated();
  if (!authed) return { ok: false, error: "Non autenticato." };
  return { ok: true };
}

const gameIdSchema = z.object({ gameId: z.string().regex(/^[a-z0-9-]+$/) });

/**
 * Makes another game the one being played. The game that was running stays
 * in the database as it is (participants, scores); the new one opens on its
 * waiting room, or on its scoreboard if it already has participants.
 */
export async function activateGame(input: { gameId: string }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = gameIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Gioco non valido." };

  const supabase = getSupabaseAdminClient();
  const { data: game } = await supabase.from("games").select("id").eq("id", parsed.data.gameId).maybeSingle();
  if (!game) return { ok: false, error: "Gioco non trovato." };

  const { count } = await supabase
    .from("participants")
    .select("id", { count: "exact", head: true })
    .eq("game_id", parsed.data.gameId);

  const { error } = await supabase
    .from("game_state")
    .update({ ...LIVE_STATE_RESET, game_id: parsed.data.gameId, status: count ? "GAME" : "REGISTRATION" })
    .eq("id", 1);
  if (error) return { ok: false, error: "Impossibile attivare il gioco." };
  return { ok: true };
}

/**
 * "Rigioca": copies a game's content and secrets into a new game with no
 * participants or scores, and activates it. The original stays archived.
 */
export async function replayGame(input: { gameId: string }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = gameIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Gioco non valido." };

  const supabase = getSupabaseAdminClient();
  const [{ data: game }, { data: secrets }] = await Promise.all([
    supabase.from("games").select("id, title, content").eq("id", parsed.data.gameId).maybeSingle(),
    supabase.from("game_secrets").select("content").eq("game_id", parsed.data.gameId).maybeSingle(),
  ]);
  if (!game) return { ok: false, error: "Gioco non trovato." };

  const { data: existing } = await supabase.from("games").select("id");
  const taken = new Set((existing ?? []).map((g) => g.id as string));
  const base = (game.id as string).replace(/-\d+$/, "");
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const newId = `${base}-${n}`;
  const title = `${(game.title as string).replace(/ \(partita \d+\)$/, "")} (partita ${n})`;

  const { error: insertError } = await supabase
    .from("games")
    .insert({ id: newId, title, content: game.content });
  if (insertError) return { ok: false, error: "Impossibile creare la nuova partita." };
  if (secrets) {
    await supabase.from("game_secrets").insert({ game_id: newId, content: secrets.content });
  }

  return activateGame({ gameId: newId });
}
