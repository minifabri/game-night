import type { SoundKind, SoundRef } from "@/lib/types";

/**
 * Effects synthesized on the fly with the Web Audio API (see synth.ts): they
 * need no files, so the automatic effects work out of the box and any of them
 * can be swapped for an uploaded clip from the console.
 */
export const BUILTIN_SOUNDS = [
  { id: "beep", label: "Bip countdown" },
  { id: "go", label: "Via!" },
  { id: "tick", label: "Tic-tac" },
  { id: "buzzer", label: "Buzzer" },
  { id: "drumroll", label: "Rullo di tamburi" },
  { id: "stinger", label: "Colpo di scena" },
  { id: "ding", label: "Punto!" },
  { id: "victory", label: "Vittoria" },
  { id: "fanfare", label: "Fanfara" },
  { id: "applause", label: "Applausi" },
  { id: "trombone", label: "Trombone triste" },
  { id: "correct", label: "Risposta giusta" },
  { id: "wrong", label: "Risposta sbagliata" },
  { id: "airhorn", label: "Tromba da stadio" },
  { id: "boing", label: "Boing" },
  { id: "whoosh", label: "Whoosh" },
  { id: "pause", label: "Pausa" },
  { id: "resume", label: "Ripresa" },
] as const;

export type BuiltinSoundId = (typeof BUILTIN_SOUNDS)[number]["id"];

export const BUILTIN_PREFIX = "builtin:";

export function builtinRef(id: BuiltinSoundId): SoundRef {
  return `${BUILTIN_PREFIX}${id}`;
}

export function parseBuiltin(ref: SoundRef): BuiltinSoundId | null {
  if (!ref.startsWith(BUILTIN_PREFIX)) return null;
  const id = ref.slice(BUILTIN_PREFIX.length);
  return BUILTIN_SOUNDS.some((b) => b.id === id) ? (id as BuiltinSoundId) : null;
}

/** Game events that fire an automatic effect on the TV. */
export const AUTO_EVENTS = [
  { id: "game_start", label: "Avvio gioco", default: "stinger" },
  { id: "countdown_tick", label: "Countdown 3-2-1", default: "beep" },
  { id: "timer_go", label: "Partenza timer", default: "go" },
  { id: "timer_tick", label: "Ultimi 5 secondi", default: "tick" },
  { id: "timeout", label: "Time out", default: "buzzer" },
  { id: "draw_shuffle", label: "Estrazione — shuffle", default: "drumroll" },
  { id: "draw_reveal", label: "Estrazione — reveal", default: "stinger" },
  { id: "point", label: "Assegnazione punti", default: "ding" },
  { id: "final_suspense", label: "Finale — suspense", default: "drumroll" },
  { id: "winner", label: "Vincita", default: "victory" },
  { id: "tie", label: "Pareggio", default: "trombone" },
  { id: "pause", label: "Gioco in pausa", default: "pause" },
  { id: "resume", label: "Ripresa gioco", default: "resume" },
] as const satisfies readonly { id: string; label: string; default: BuiltinSoundId }[];

export type AutoEventId = (typeof AUTO_EVENTS)[number]["id"];

/** Resolves which effect an event plays, honouring the admin's overrides. `null` = muted. */
export function resolveAutoRef(
  event: AutoEventId,
  overrides: Record<string, SoundRef | "off"> | undefined
): SoundRef | null {
  const override = overrides?.[event];
  if (override === "off") return null;
  if (override) return override;
  const def = AUTO_EVENTS.find((e) => e.id === event)!.default;
  return builtinRef(def);
}

/**
 * Ciao Darwin sounds worth having for the night. The clips are copyrighted
 * (Mediaset / the artists), so they aren't shipped with the app: the console
 * shows this list with a search link for each, and the admin uploads the
 * files they download (or pastes a direct mp3 URL).
 */
export const CIAO_DARWIN_PACK: {
  name: string;
  kind: SoundKind;
  hint: string;
  query: string;
  suggestedFor?: AutoEventId;
}[] = [
  {
    name: "Matti — sigla (Renato Zero)",
    kind: "music",
    hint: "La sigla storica del programma: perfetta per l'apertura e le pause.",
    query: "ciao darwin sigla matti renato zero",
  },
  {
    name: "Adiemus — Madre Natura",
    kind: "music",
    hint: "L'ingresso di Madre Natura (Karl Jenkins): da usare per la vincita.",
    query: "adiemus ciao darwin",
    suggestedFor: "winner",
  },
  {
    name: "Stacco / jingle Ciao Darwin",
    kind: "sfx",
    hint: "Lo stacco musicale tra una prova e l'altra: ottimo come avvio gioco.",
    query: "ciao darwin jingle",
    suggestedFor: "game_start",
  },
  {
    name: "Genodrome",
    kind: "sfx",
    hint: "La musica della prova dei rulli: adatta allo shuffle dell'estrazione.",
    query: "ciao darwin genodrome",
    suggestedFor: "draw_shuffle",
  },
  {
    name: "Cilindroni — suspense",
    kind: "sfx",
    hint: "Il crescendo del quiz finale dei cilindroni.",
    query: "ciao darwin cilindroni",
    suggestedFor: "final_suspense",
  },
  {
    name: "Risata di Luca Laurenti",
    kind: "sfx",
    hint: "Un classico da pad, per sdrammatizzare.",
    query: "luca laurenti risata",
  },
  {
    name: "Paolo Bonolis — tormentoni",
    kind: "sfx",
    hint: "Le battute di Bonolis: da pad, a piacere.",
    query: "bonolis ciao darwin",
  },
  {
    name: "Applausi del pubblico",
    kind: "sfx",
    hint: "Il pubblico in studio: per assegnazione punti o vincita.",
    query: "ciao darwin applausi pubblico",
    suggestedFor: "point",
  },
];

export function searchUrl(query: string): string {
  return `https://www.myinstants.com/it/search/?name=${encodeURIComponent(query)}`;
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
