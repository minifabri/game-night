"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadActiveGame, loadSecrets } from "@/lib/active-game";
import { DEFAULT_QUESTION_TIMER_MS, getQuestionSet, getStep, type GameContent, type GameSecrets } from "@/lib/game";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<ActionResult> {
  const authed = await isAdminAuthenticated();
  if (!authed) return { ok: false, error: "Non autenticato." };
  return { ok: true };
}

interface Scene {
  ok: true;
  content: GameContent;
  gameId: string;
  /** Status change needed to put the scene on screen. */
  patch: Record<string, unknown>;
  state: Record<string, unknown>;
}

/**
 * Step cards and questions replace the scoreboard, so they can go on screen
 * from the scoreboard, from the waiting room (starting the show starts the
 * game) or over a finished draw. A running timer, a pause or the final reveal
 * own the screen and must be closed first.
 */
async function loadScene(): Promise<Scene | { ok: false; error: string }> {
  const game = await loadActiveGame();
  if (!game.ok) return game;

  const supabase = getSupabaseAdminClient();
  const { data: state, error } = await supabase
    .from("game_state")
    .select("status, show_step, show_nonce, question_set, question_index, question_nonce, board_used")
    .eq("id", 1)
    .single();
  if (error || !state) return { ok: false, error: "Impossibile leggere lo stato del gioco." };

  const base = { ok: true as const, content: game.content, gameId: game.gameId, state };
  switch (state.status) {
    case "GAME":
      return { ...base, patch: {} };
    case "REGISTRATION":
    case "DRAW":
      return { ...base, patch: { status: "GAME" } };
    case "TIMER":
      return { ok: false, error: "C'è un timer a schermo: prima torna al tabellone." };
    case "PAUSED":
      return { ok: false, error: "Il gioco è in pausa." };
    default:
      return { ok: false, error: "Il gioco è terminato." };
  }
}

async function writeState(patch: Record<string, unknown>, failure: string): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("game_state").update(patch).eq("id", 1);
  if (error) return { ok: false, error: failure + "." };
  return { ok: true };
}

const NO_QUESTION = {
  question_set: null,
  question_index: null,
  question_answer_visible: false,
  question_answer_text: null,
  question_answer_detail: null,
  question_timer_ends_at: null,
};

// ---------------------------------------------------------------------------
// Admin-only content
// ---------------------------------------------------------------------------

/** The active game's presenter lines and answers, for the admin panels only. */
export async function getActiveGameSecrets(): Promise<
  { ok: true; gameId: string; secrets: GameSecrets } | { ok: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  const game = await loadActiveGame();
  if (!game.ok) return game;
  return { ok: true, gameId: game.gameId, secrets: await loadSecrets(game.gameId) };
}

// ---------------------------------------------------------------------------
// Scaletta
// ---------------------------------------------------------------------------

const stepSchema = z.object({ stepId: z.string().min(1).max(60) });

/** Lights up a step of the running order and puts its card on every screen. */
export async function startShowStep(input: { stepId: string }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Step non valido." };

  const scene = await loadScene();
  if (!scene.ok) return scene;
  const step = getStep(scene.content, parsed.data.stepId);
  if (!step) return { ok: false, error: "Step non valido." };

  return writeState(
    {
      ...scene.patch,
      ...NO_QUESTION,
      show_step: step.id,
      show_substep: step.substeps && !step.secretSubsteps ? 0 : null,
      show_card: true,
      show_nonce: ((scene.state.show_nonce as number) ?? 0) + 1,
    },
    "Impossibile avviare lo step"
  );
}

const substepSchema = z.object({ index: z.number().int().min(0).max(50) });

/** Moves to (or reveals) a sub-step of the current step. */
export async function setShowSubstep(input: { index: number }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = substepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sotto-step non valido." };

  const scene = await loadScene();
  if (!scene.ok) return scene;

  const step = getStep(scene.content, scene.state.show_step as string | null);
  if (!step?.substeps || parsed.data.index >= step.substeps.length) {
    return { ok: false, error: "Questo step non ha quel sotto-step." };
  }

  return writeState(
    { ...scene.patch, ...NO_QUESTION, show_substep: parsed.data.index, show_card: true },
    "Impossibile cambiare sotto-step"
  );
}

/** Shows or hides the current step's full-screen card (hidden = scoreboard). */
export async function setShowCard(input: { visible: boolean }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  if (!input.visible) {
    return writeState({ show_card: false, ...NO_QUESTION }, "Impossibile tornare al tabellone");
  }

  const scene = await loadScene();
  if (!scene.ok) return scene;
  if (!scene.state.show_step) return { ok: false, error: "Nessuno step avviato." };
  return writeState({ ...scene.patch, show_card: true }, "Impossibile mostrare la scheda");
}

/** Clears the running order: no step lit, no card, no question. */
export async function clearShow(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  return writeState(
    { show_step: null, show_substep: null, show_card: false, ...NO_QUESTION, board_used: [] },
    "Impossibile azzerare la scaletta"
  );
}

// ---------------------------------------------------------------------------
// Domande
// ---------------------------------------------------------------------------

const questionSchema = z.object({
  set: z.string().min(1).max(60),
  index: z.number().int().min(0),
});

/**
 * Puts a question on every screen, lighting up its step (and round) and
 * starting its answer timer if the set has one. On pick-a-number sets the
 * number is ticked off the board.
 */
export async function showQuestion(input: { set: string; index: number }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Domanda non valida." };

  const scene = await loadScene();
  if (!scene.ok) return scene;
  const qs = getQuestionSet(scene.content, parsed.data.set);
  if (!qs || parsed.data.index >= qs.questions.length) return { ok: false, error: "Domanda non valida." };

  const patch: Record<string, unknown> = {
    ...scene.patch,
    ...NO_QUESTION,
    question_set: qs.id,
    question_index: parsed.data.index,
    question_timer_ends_at: qs.timerMs ? new Date(Date.now() + qs.timerMs).toISOString() : null,
    question_nonce: ((scene.state.question_nonce as number) ?? 0) + 1,
    show_substep: qs.substep,
  };

  if (scene.state.show_step !== qs.step) {
    // Jumping straight to a question also lights its step; behind the
    // question the step card is shown, so "Togli dal display" lands there.
    Object.assign(patch, {
      show_step: qs.step,
      show_card: true,
      show_nonce: ((scene.state.show_nonce as number) ?? 0) + 1,
    });
  }

  if (qs.pickByNumber) {
    const used = new Set((scene.state.board_used as number[] | null) ?? []);
    used.add(parsed.data.index + 1);
    patch.board_used = [...used].sort((a, b) => a - b);
  }

  return writeState(patch, "Impossibile mostrare la domanda");
}

/** Reveals (copying it from the secrets) or hides the answer of the question on screen. */
export async function setAnswerVisible(input: { visible: boolean }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  if (input.visible !== true) {
    return writeState(
      { question_answer_visible: false, question_answer_text: null, question_answer_detail: null },
      "Impossibile nascondere la risposta"
    );
  }

  const game = await loadActiveGame();
  if (!game.ok) return game;
  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("question_set, question_index")
    .eq("id", 1)
    .single();
  if (!state?.question_set || state.question_index === null) {
    return { ok: false, error: "Nessuna domanda a schermo." };
  }

  const secrets = await loadSecrets(game.gameId);
  const secret = secrets.answers[state.question_set as string]?.[state.question_index as number];

  return writeState(
    {
      question_answer_visible: true,
      question_answer_text: secret?.answer ?? null,
      question_answer_detail: secret?.detail ?? null,
      question_timer_ends_at: null,
    },
    "Impossibile mostrare la risposta"
  );
}

/** Restarts the current question's answer timer from the full duration. */
export async function restartQuestionTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const game = await loadActiveGame();
  if (!game.ok) return game;
  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("question_set, question_index, question_nonce")
    .eq("id", 1)
    .single();
  const qs = getQuestionSet(game.content, state?.question_set as string | null);
  if (!qs || state?.question_index === null) return { ok: false, error: "Nessuna domanda a schermo." };

  return writeState(
    {
      question_timer_ends_at: new Date(Date.now() + (qs.timerMs ?? DEFAULT_QUESTION_TIMER_MS)).toISOString(),
      question_answer_visible: false,
      question_answer_text: null,
      question_answer_detail: null,
      question_nonce: ((state?.question_nonce as number) ?? 0) + 1,
    },
    "Impossibile riavviare il timer"
  );
}

/** Takes the question off screen, back to the step card (or the scoreboard). */
export async function hideQuestion(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  return writeState(NO_QUESTION, "Impossibile togliere la domanda");
}

const usedSchema = z.object({ number: z.number().int().min(1).max(500), used: z.boolean() });

/** Manually marks a board number as picked / free again. */
export async function setBoardUsed(input: { number: number; used: boolean }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = usedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Numero non valido." };

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase.from("game_state").select("board_used").eq("id", 1).single();
  const used = new Set((state?.board_used as number[] | null) ?? []);
  if (parsed.data.used) used.add(parsed.data.number);
  else used.delete(parsed.data.number);

  return writeState({ board_used: [...used].sort((a, b) => a - b) }, "Impossibile aggiornare il numero");
}
