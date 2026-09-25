"use server";

import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  QUESTION_SET_IDS,
  QUESTION_SETS,
  SHOW_STEP_IDS,
  getShowStep,
  type QuestionSetId,
  type ShowStepId,
} from "@/lib/show";

type ActionResult = { ok: true } | { ok: false; error: string };

const MIGRATION_HINT = " (hai applicato la migration 0007?)";

async function requireAdmin(): Promise<ActionResult> {
  const authed = await isAdminAuthenticated();
  if (!authed) return { ok: false, error: "Non autenticato." };
  return { ok: true };
}

/**
 * Step cards and questions replace the scoreboard, so they can go on screen
 * from the scoreboard, from the waiting room (starting the show starts the
 * game) or over a finished draw. A running timer, a pause or the final reveal
 * own the screen and must be closed first.
 */
async function sceneStatusPatch(): Promise<
  { ok: true; patch: Record<string, unknown>; state: Record<string, unknown> } | { ok: false; error: string }
> {
  const supabase = getSupabaseAdminClient();
  const { data: state, error } = await supabase
    .from("game_state")
    .select("status, show_step, show_nonce, question_nonce, finalissima_used")
    .eq("id", 1)
    .single();
  if (error || !state) return { ok: false, error: "Impossibile leggere lo stato del gioco" + MIGRATION_HINT };

  switch (state.status) {
    case "GAME":
      return { ok: true, patch: {}, state };
    case "REGISTRATION":
    case "DRAW":
      return { ok: true, patch: { status: "GAME" }, state };
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
  if (error) return { ok: false, error: failure + MIGRATION_HINT };
  return { ok: true };
}

const NO_QUESTION = {
  question_set: null,
  question_index: null,
  question_answer_visible: false,
  question_timer_ends_at: null,
};

// ---------------------------------------------------------------------------
// Scaletta
// ---------------------------------------------------------------------------

const stepSchema = z.object({ stepId: z.enum(SHOW_STEP_IDS) });

/** Lights up a step of the running order and puts its card on every screen. */
export async function startShowStep(input: { stepId: ShowStepId }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Step non valido." };
  const step = getShowStep(parsed.data.stepId)!;

  const scene = await sceneStatusPatch();
  if (!scene.ok) return scene;

  return writeState(
    {
      ...scene.patch,
      ...NO_QUESTION,
      show_step: step.id,
      show_substep: step.substeps ? 0 : null,
      show_card: true,
      show_nonce: ((scene.state.show_nonce as number) ?? 0) + 1,
    },
    "Impossibile avviare lo step"
  );
}

const substepSchema = z.object({ index: z.number().int().min(0).max(20) });

/** Moves to a sub-step (quiz round, triathlon event, courage level) of the current step. */
export async function setShowSubstep(input: { index: number }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = substepSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Sotto-step non valido." };

  const scene = await sceneStatusPatch();
  if (!scene.ok) return scene;

  const step = getShowStep(scene.state.show_step as string | null);
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

  const scene = await sceneStatusPatch();
  if (!scene.ok) return scene;
  if (!scene.state.show_step) return { ok: false, error: "Nessuno step avviato." };
  return writeState({ ...scene.patch, show_card: true }, "Impossibile mostrare la scheda");
}

/** Clears the running order: no step lit, no card, no question. */
export async function clearShow(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  return writeState(
    { show_step: null, show_substep: null, show_card: false, ...NO_QUESTION, finalissima_used: [] },
    "Impossibile azzerare la scaletta"
  );
}

// ---------------------------------------------------------------------------
// Domande
// ---------------------------------------------------------------------------

const questionSchema = z.object({
  set: z.enum(QUESTION_SET_IDS),
  index: z.number().int().min(0),
});

/**
 * Puts a question on every screen, lighting up its step (and quiz round) and
 * starting its answer timer if the set has one. Finalissima numbers are marked
 * as used on the 20-number board.
 */
export async function showQuestion(input: { set: QuestionSetId; index: number }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Domanda non valida." };
  const qs = QUESTION_SETS[parsed.data.set];
  if (parsed.data.index >= qs.questions.length) return { ok: false, error: "Domanda non valida." };

  const scene = await sceneStatusPatch();
  if (!scene.ok) return scene;

  const patch: Record<string, unknown> = {
    ...scene.patch,
    question_set: qs.id,
    question_index: parsed.data.index,
    question_answer_visible: false,
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

  if (qs.id === "finalissima") {
    const used = new Set((scene.state.finalissima_used as number[] | null) ?? []);
    used.add(parsed.data.index + 1);
    patch.finalissima_used = [...used].sort((a, b) => a - b);
  }

  return writeState(patch, "Impossibile mostrare la domanda");
}

export async function setAnswerVisible(input: { visible: boolean }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  return writeState(
    { question_answer_visible: input.visible === true, question_timer_ends_at: null },
    "Impossibile aggiornare la risposta"
  );
}

/** Restarts the current question's answer timer from the full duration. */
export async function restartQuestionTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("question_set, question_index, question_nonce")
    .eq("id", 1)
    .single();
  const qs = state?.question_set ? QUESTION_SETS[state.question_set as QuestionSetId] : null;
  if (!qs || state?.question_index === null) return { ok: false, error: "Nessuna domanda a schermo." };
  const ms = qs.timerMs ?? 10_000;

  return writeState(
    {
      question_timer_ends_at: new Date(Date.now() + ms).toISOString(),
      question_answer_visible: false,
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

const usedSchema = z.object({ number: z.number().int().min(1).max(20), used: z.boolean() });

/** Manually marks a Finalissima number as picked / free again on the board. */
export async function setFinalissimaUsed(input: { number: number; used: boolean }): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = usedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Numero non valido." };

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase.from("game_state").select("finalissima_used").eq("id", 1).single();
  const used = new Set((state?.finalissima_used as number[] | null) ?? []);
  if (parsed.data.used) used.add(parsed.data.number);
  else used.delete(parsed.data.number);

  return writeState({ finalissima_used: [...used].sort((a, b) => a - b) }, "Impossibile aggiornare il numero");
}
