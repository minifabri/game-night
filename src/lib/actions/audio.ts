"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { AUTO_EVENTS, parseBuiltin } from "@/lib/audio/catalog";
import { parseSpotify, spotifyUrl } from "@/lib/audio/spotify";

type ActionResult = { ok: true } | { ok: false; error: string };

const BUCKET = "sounds";

async function requireAdmin(): Promise<ActionResult> {
  const authed = await isAdminAuthenticated();
  if (!authed) return { ok: false, error: "Non autenticato." };
  return { ok: true };
}

const uuid = z.string().uuid();

/** A playable effect: a known builtin or a sounds.id. */
const soundRefSchema = z.string().refine((ref) => parseBuiltin(ref) !== null || uuid.safeParse(ref).success);

async function updateAudioState(patch: Record<string, unknown>, errorMessage: string): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("audio_state").update(patch).eq("id", 1);
  if (error) return { ok: false, error: errorMessage };
  return { ok: true };
}

async function readNonces() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("audio_state")
    .select("music_nonce, sfx_nonce, stop_nonce, auto_map")
    .eq("id", 1)
    .single();
  return {
    music_nonce: (data?.music_nonce as number) ?? 0,
    sfx_nonce: (data?.sfx_nonce as number) ?? 0,
    stop_nonce: (data?.stop_nonce as number) ?? 0,
    auto_map: (data?.auto_map as Record<string, string>) ?? {},
  };
}

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

/**
 * Mints a signed upload URL so the browser can send the file straight to
 * Supabase Storage — audio files are too big for a server action body.
 */
export async function createSoundUpload(
  filename: string
): Promise<{ ok: true; path: string; token: string } | { ok: false; error: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const ext = (filename.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? "mp3").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Impossibile preparare l'upload." };
  return { ok: true, path: data.path, token: data.token };
}

const addSoundSchema = z
  .object({
    // may be empty for a Spotify link: the title is fetched from Spotify
    name: z.string().trim().max(60),
    kind: z.enum(["music", "sfx"]),
    storagePath: z.string().regex(/^[0-9a-f-]{36}\.[a-z0-9]{1,5}$/).optional(),
    url: z.string().url("URL non valido.").max(1000).optional(),
  })
  .refine((v) => Boolean(v.storagePath) !== Boolean(v.url), "Serve un file o un URL.");

export async function addSound(input: {
  name: string;
  kind: "music" | "sfx";
  storagePath?: string;
  url?: string;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = addSoundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Suono non valido." };

  const supabase = getSupabaseAdminClient();
  let url = parsed.data.url ?? "";
  let name = parsed.data.name;
  let kind = parsed.data.kind;
  const spotify = parsed.data.url ? parseSpotify(url) : null;
  if (parsed.data.storagePath) {
    url = supabase.storage.from(BUCKET).getPublicUrl(parsed.data.storagePath).data.publicUrl;
  } else if (spotify) {
    // Spotify only plays through its embed player, so it can only be a soundtrack
    url = spotifyUrl(spotify);
    kind = "music";
    if (!name) name = (await fetchSpotifyTitle(url)) ?? "";
  } else if (/spotify\.(com|link)/i.test(url)) {
    return { ok: false, error: "Link Spotify non riconosciuto: usa Condividi → Copia link." };
  } else if (!/^https:\/\//.test(url)) {
    return { ok: false, error: "Usa un link https." };
  }
  if (!name) return { ok: false, error: "Dai un nome al suono." };

  const { error } = await supabase.from("sounds").insert({
    name,
    kind,
    url,
    storage_path: parsed.data.storagePath ?? null,
  });
  if (error) return { ok: false, error: "Impossibile salvare il suono." };
  return { ok: true };
}

/** Playlist/album/track title from Spotify's public oEmbed endpoint. */
async function fetchSpotifyTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: unknown };
    return typeof data.title === "string" ? data.title.trim().slice(0, 60) || null : null;
  } catch {
    return null;
  }
}

export async function deleteSound(id: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!uuid.safeParse(id).success) return { ok: false, error: "Suono non valido." };

  const supabase = getSupabaseAdminClient();
  const { data: sound } = await supabase.from("sounds").select("storage_path").eq("id", id).single();

  // drop auto-effect assignments pointing at it, so events fall back to the default
  const { auto_map } = await readNonces();
  const cleaned = Object.fromEntries(Object.entries(auto_map).filter(([, ref]) => ref !== id));
  await supabase.from("audio_state").update({ auto_map: cleaned }).eq("id", 1);

  const { error } = await supabase.from("sounds").delete().eq("id", id);
  if (error) return { ok: false, error: "Impossibile eliminare il suono." };

  if (sound?.storage_path) {
    await supabase.storage.from(BUCKET).remove([sound.storage_path as string]);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Playback commands (executed by the TV)
// ---------------------------------------------------------------------------

export async function playMusic(soundId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!uuid.safeParse(soundId).success) return { ok: false, error: "Traccia non valida." };

  const { music_nonce } = await readNonces();
  return updateAudioState(
    { music_sound_id: soundId, music_status: "playing", music_nonce: music_nonce + 1 },
    "Impossibile avviare la traccia."
  );
}

export async function setMusicStatus(status: "playing" | "paused" | "stopped"): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!["playing", "paused", "stopped"].includes(status)) return { ok: false, error: "Stato non valido." };
  return updateAudioState({ music_status: status }, "Impossibile aggiornare la musica.");
}

export async function setMusicLoop(loop: boolean): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  return updateAudioState({ music_loop: Boolean(loop) }, "Impossibile aggiornare la musica.");
}

export async function triggerSfx(ref: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!soundRefSchema.safeParse(ref).success) return { ok: false, error: "Effetto non valido." };

  const { sfx_nonce } = await readNonces();
  return updateAudioState({ sfx_ref: ref, sfx_nonce: sfx_nonce + 1 }, "Impossibile riprodurre l'effetto.");
}

export async function stopAllAudio(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const { stop_nonce } = await readNonces();
  return updateAudioState({ music_status: "stopped", stop_nonce: stop_nonce + 1 }, "Impossibile fermare l'audio.");
}

const settingsSchema = z.object({
  music_volume: z.number().min(0).max(1).optional(),
  sfx_volume: z.number().min(0).max(1).optional(),
  muted: z.boolean().optional(),
  auto_enabled: z.boolean().optional(),
});

export async function setAudioSettings(input: z.infer<typeof settingsSchema>): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Impostazioni non valide." };
  return updateAudioState(parsed.data, "Impossibile salvare le impostazioni audio.");
}

/** `ref` null restores the event's default effect, "off" mutes it. */
export async function setAutoEffect(event: string, ref: string | null): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (!AUTO_EVENTS.some((e) => e.id === event)) return { ok: false, error: "Evento non valido." };
  if (ref !== null && ref !== "off" && !soundRefSchema.safeParse(ref).success) {
    return { ok: false, error: "Effetto non valido." };
  }

  const { auto_map } = await readNonces();
  const next = { ...auto_map };
  if (ref === null) delete next[event];
  else next[event] = ref;
  return updateAudioState({ auto_map: next }, "Impossibile salvare l'effetto automatico.");
}
