"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LIVE_STATE_RESET } from "@/lib/constants";
import { describePackErrors, gamePackSchema, joinPack, splitPack, type GamePack } from "@/lib/game-pack";
import { blankPack } from "@/lib/game-template";
import type { GameContent, GameSecrets } from "@/lib/game";

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

// ---------------------------------------------------------------------------
// Content editor
// ---------------------------------------------------------------------------

/** A game with its lines and answers, as the content editor edits it. */
export async function getGamePack(
  input: { gameId: string }
): Promise<{ ok: true; pack: GamePack } | { ok: false; error: string }> {
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

  const pack = joinPack(
    game.id as string,
    game.title as string,
    game.content as GameContent,
    (secrets?.content as GameSecrets | undefined) ?? { steps: {}, answers: {} }
  );
  return { ok: true, pack };
}

/**
 * Saves the editor's pack: validated like `npm run game:load`, then split
 * into public content and admin-only secrets. Participants and scores are
 * untouched; screens showing the game update live.
 */
export async function saveGamePack(
  input: GamePack
): Promise<{ ok: true } | { ok: false; error: string; details?: string[] }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = gamePackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Ci sono dei campi da sistemare.", details: describePackErrors(parsed.error, input) };
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("games").select("id").eq("id", parsed.data.id).maybeSingle();
  if (!existing) return { ok: false, error: "Gioco non trovato." };

  const { id, title, content, secrets } = splitPack(parsed.data);
  const { error } = await supabase.from("games").update({ title, content }).eq("id", id);
  if (error) return { ok: false, error: "Salvataggio non riuscito." };
  const { error: secretsError } = await supabase
    .from("game_secrets")
    .upsert({ game_id: id, content: secrets }, { onConflict: "game_id" });
  if (secretsError) return { ok: false, error: "Salvataggio delle risposte non riuscito." };
  return { ok: true };
}

const createSchema = z.object({
  title: z.string().trim().min(1, "Scrivi un titolo.").max(80),
  /** Game to copy the content from; null starts from the blank template. */
  from: z.string().regex(/^[a-z0-9-]+$/).nullable(),
});

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "gioco"
  );
}

/**
 * "Nuovo gioco": a new game (not activated) from the blank template or as a
 * copy of an existing game's content and answers. Returns its id, for the
 * editor.
 */
export async function createGame(input: {
  title: string;
  from: string | null;
}): Promise<{ ok: true; gameId: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("games").select("id");
  const taken = new Set((existing ?? []).map((g) => g.id as string));
  const base = slugify(parsed.data.title);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;

  let content: GameContent;
  let secrets: GameSecrets;
  if (parsed.data.from) {
    const source = await getGamePack({ gameId: parsed.data.from });
    if (!source.ok) return source;
    ({ content, secrets } = splitPack({ ...source.pack, id, title: parsed.data.title }));
  } else {
    ({ content, secrets } = splitPack(blankPack(id, parsed.data.title)));
  }

  const { error } = await supabase.from("games").insert({ id, title: parsed.data.title, content });
  if (error) return { ok: false, error: "Impossibile creare il gioco." };
  await supabase.from("game_secrets").insert({ game_id: id, content: secrets });
  return { ok: true, gameId: id };
}

const ASSETS_BUCKET = "game-assets";

/**
 * Signed upload URL for a game image (poster, question picture): the browser
 * sends the file straight to Supabase Storage, then stores the public URL in
 * the pack.
 */
export async function createAssetUpload(input: {
  gameId: string;
  filename: string;
}): Promise<{ ok: true; path: string; token: string; publicUrl: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = gameIdSchema.safeParse({ gameId: input.gameId });
  if (!parsed.success) return { ok: false, error: "Gioco non valido." };

  const ext = (input.filename.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? "jpg").toLowerCase();
  const path = `${parsed.data.gameId}/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(ASSETS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Impossibile preparare l'upload (hai applicato la migration 0009?)." };
  const publicUrl = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(data.path).data.publicUrl;
  return { ok: true, path: data.path, token: data.token, publicUrl };
}
