"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createAdminSession,
  destroyAdminSession,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  DRAW_TOTAL_HOLD_MS,
  FINAL_TOTAL_MS,
  TEAM_ORDER,
  TIMER_STARTUP_COUNTDOWN_MS,
  TIMER_TIMEOUT_HOLD_MS,
} from "@/lib/constants";
import type { ChallengeId, TeamId } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<ActionResult> {
  const authed = await isAdminAuthenticated();
  if (!authed) return { ok: false, error: "Non autenticato." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAdmin(password: string): Promise<ActionResult> {
  if (!verifyAdminPassword(password)) {
    return { ok: false, error: "Password errata." };
  }
  await createAdminSession();
  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  await destroyAdminSession();
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

export async function startGame(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("game_state")
    .update({ status: "GAME" })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile avviare il gioco." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pause
// ---------------------------------------------------------------------------

const pauseSchema = z.object({ message: z.string().trim().max(80).optional() });

/**
 * Puts every screen on the "gioco in pausa" card. Allowed from the scoreboard
 * or a timer; a running timer is frozen (same maths as pauseTimer) and
 * restarted automatically on resume.
 */
export async function pauseGame(input: { message?: string } = {}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = pauseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Messaggio troppo lungo (max 80 caratteri)." };

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("status, timer_phase, timer_ends_at, timer_countdown_ends_at")
    .eq("id", 1)
    .single();

  if (!state || (state.status !== "GAME" && state.status !== "TIMER")) {
    return { ok: false, error: "Si può mettere in pausa solo dalla scoreboard o durante un timer." };
  }

  const patch: Record<string, unknown> = {
    status: "PAUSED",
    pause_previous_status: state.status,
    pause_message: parsed.data.message || null,
    pause_resumes_timer: false,
  };

  if (state.status === "TIMER" && state.timer_phase === "active") {
    const now = Date.now();
    const countdownEndsAt = state.timer_countdown_ends_at
      ? new Date(state.timer_countdown_ends_at).getTime()
      : now;
    const endsAt = state.timer_ends_at ? new Date(state.timer_ends_at).getTime() : now;
    const remaining = now < countdownEndsAt ? endsAt - countdownEndsAt : Math.max(0, endsAt - now);
    if (remaining <= 0) {
      return { ok: false, error: "Il timer è già scaduto." };
    }
    Object.assign(patch, {
      timer_phase: "paused",
      timer_remaining_ms: remaining,
      timer_ends_at: null,
      timer_countdown_ends_at: null,
      pause_resumes_timer: true,
    });
  }

  const { error } = await supabase.from("game_state").update(patch).eq("id", 1).eq("status", state.status);
  if (error) return { ok: false, error: "Impossibile mettere in pausa il gioco." };
  return { ok: true };
}

export async function resumeGame(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("status, pause_previous_status, pause_resumes_timer, timer_phase, timer_remaining_ms")
    .eq("id", 1)
    .single();

  if (!state || state.status !== "PAUSED") {
    return { ok: false, error: "Il gioco non è in pausa." };
  }

  const backToTimer = state.pause_previous_status === "TIMER" && state.timer_phase !== "idle";
  const patch: Record<string, unknown> = {
    status: backToTimer ? "TIMER" : "GAME",
    pause_previous_status: null,
    pause_message: null,
    pause_resumes_timer: false,
  };

  if (backToTimer && state.pause_resumes_timer && state.timer_phase === "paused") {
    const now = Date.now();
    Object.assign(patch, {
      timer_phase: "active",
      timer_countdown_ends_at: new Date(now - 1).toISOString(),
      timer_ends_at: new Date(now + ((state.timer_remaining_ms as number) ?? 0)).toISOString(),
    });
  }

  const { error } = await supabase.from("game_state").update(patch).eq("id", 1).eq("status", "PAUSED");
  if (error) return { ok: false, error: "Impossibile riprendere il gioco." };
  return { ok: true };
}

const setScoreSchema = z.object({
  challengeId: z.enum(["quiz", "creativity", "physical", "courage", "finalissima"]),
  teamId: z.enum(["palestrati", "divanisti"]),
  points: z.number().int().min(0).max(999),
});

export async function setScore(input: {
  challengeId: ChallengeId;
  teamId: TeamId;
  points: number;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = setScoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Punteggio non valido." };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("scores")
    .update({ points: parsed.data.points })
    .eq("challenge_id", parsed.data.challengeId)
    .eq("team_id", parsed.data.teamId);

  if (error) return { ok: false, error: "Impossibile salvare il punteggio." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

const startTimerSchema = z.object({
  label: z.string().trim().min(1).max(40),
  durationMs: z
    .number()
    .int()
    .min(1000, "Il timer deve durare almeno 1 secondo")
    .max(60 * 60 * 1000),
});

export async function startTimer(input: {
  label: string;
  durationMs: number;
}): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const parsed = startTimerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Timer non valido." };
  }

  const now = Date.now();
  const countdownEndsAt = new Date(now + TIMER_STARTUP_COUNTDOWN_MS);
  const timerEndsAt = new Date(now + TIMER_STARTUP_COUNTDOWN_MS + parsed.data.durationMs);

  const supabase = getSupabaseAdminClient();
  const { data: current } = await supabase
    .from("game_state")
    .select("timer_nonce, status")
    .eq("id", 1)
    .single();
  if (current?.status === "PAUSED") return { ok: false, error: "Il gioco è in pausa." };

  const { error } = await supabase
    .from("game_state")
    .update({
      status: "TIMER",
      timer_label: parsed.data.label,
      timer_duration_ms: parsed.data.durationMs,
      timer_phase: "active",
      timer_countdown_ends_at: countdownEndsAt.toISOString(),
      timer_ends_at: timerEndsAt.toISOString(),
      timer_remaining_ms: parsed.data.durationMs,
      timer_nonce: ((current?.timer_nonce as number) ?? 0) + 1,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile avviare il timer." };
  return { ok: true };
}

export async function pauseTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("timer_phase, timer_ends_at, timer_countdown_ends_at")
    .eq("id", 1)
    .single();

  if (!state || state.timer_phase !== "active") {
    return { ok: false, error: "Nessun timer attivo da mettere in pausa." };
  }

  const now = Date.now();
  const countdownEndsAt = state.timer_countdown_ends_at
    ? new Date(state.timer_countdown_ends_at).getTime()
    : now;
  // While still in the 3-2-1 startup countdown, pausing just freezes the full duration.
  const endsAt = state.timer_ends_at ? new Date(state.timer_ends_at).getTime() : now;
  const remaining = now < countdownEndsAt ? endsAt - countdownEndsAt : Math.max(0, endsAt - now);

  const { error } = await supabase
    .from("game_state")
    .update({
      timer_phase: "paused",
      timer_remaining_ms: remaining,
      timer_ends_at: null,
      timer_countdown_ends_at: null,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile mettere in pausa." };
  return { ok: true };
}

export async function resumeTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("status, timer_phase, timer_remaining_ms")
    .eq("id", 1)
    .single();

  if (state?.status === "PAUSED") return { ok: false, error: "Prima riprendi il gioco." };
  if (!state || state.timer_phase !== "paused") {
    return { ok: false, error: "Nessun timer in pausa da riprendere." };
  }

  const now = Date.now();
  const remaining = (state.timer_remaining_ms as number) ?? 0;

  const { error } = await supabase
    .from("game_state")
    .update({
      timer_phase: "active",
      // already past the startup countdown: resume straight into the running display
      timer_countdown_ends_at: new Date(now - 1).toISOString(),
      timer_ends_at: new Date(now + remaining).toISOString(),
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile riprendere il timer." };
  return { ok: true };
}

export async function stopTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("game_state")
    .update({
      status: "GAME",
      timer_phase: "idle",
      timer_label: null,
      timer_duration_ms: null,
      timer_countdown_ends_at: null,
      timer_ends_at: null,
      timer_remaining_ms: null,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile fermare il timer." };
  return { ok: true };
}

export async function resetTimer(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: state } = await supabase
    .from("game_state")
    .select("timer_duration_ms")
    .eq("id", 1)
    .single();

  const { error } = await supabase
    .from("game_state")
    .update({
      status: "GAME",
      timer_phase: "idle",
      timer_countdown_ends_at: null,
      timer_ends_at: null,
      timer_remaining_ms: state?.timer_duration_ms ?? null,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile azzerare il timer." };
  return { ok: true };
}

/**
 * Called by the display once it has locally shown TIME OUT long enough; also
 * self-heals stale state for late-joining clients. No admin auth (the public
 * TV calls it), so the actual elapsed time is re-verified server-side via the
 * `lte("timer_ends_at", …)` condition — a client can't force an early cut by
 * calling this ahead of schedule.
 */
export async function finishTimer(): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - TIMER_TIMEOUT_HOLD_MS).toISOString();
  const { error } = await supabase
    .from("game_state")
    .update({
      status: "GAME",
      timer_phase: "idle",
      timer_label: null,
      timer_duration_ms: null,
      timer_countdown_ends_at: null,
      timer_ends_at: null,
      timer_remaining_ms: null,
    })
    .eq("id", 1)
    .eq("status", "TIMER")
    .lte("timer_ends_at", cutoff);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Random draw
// ---------------------------------------------------------------------------

export async function drawParticipants(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: participants, error: fetchError } = await supabase
    .from("participants")
    .select("id, team_id");

  if (fetchError) return { ok: false, error: "Impossibile leggere i partecipanti." };

  const byTeam: Record<TeamId, string[]> = { palestrati: [], divanisti: [] };
  for (const p of participants ?? []) {
    byTeam[p.team_id as TeamId].push(p.id as string);
  }

  if (byTeam.palestrati.length === 0 || byTeam.divanisti.length === 0) {
    return { ok: false, error: "Servono partecipanti in entrambe le squadre." };
  }

  const gymPick = byTeam.palestrati[Math.floor(Math.random() * byTeam.palestrati.length)];
  const couchPick = byTeam.divanisti[Math.floor(Math.random() * byTeam.divanisti.length)];

  const { data: current } = await supabase
    .from("game_state")
    .select("draw_nonce, status")
    .eq("id", 1)
    .single();
  if (current?.status === "PAUSED") return { ok: false, error: "Il gioco è in pausa." };

  const { error } = await supabase
    .from("game_state")
    .update({
      status: "DRAW",
      draw_gym_participant_id: gymPick,
      draw_couch_participant_id: couchPick,
      draw_started_at: new Date().toISOString(),
      draw_nonce: ((current?.draw_nonce as number) ?? 0) + 1,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile avviare l'estrazione." };
  return { ok: true };
}

/**
 * Called by the display once the reveal has been shown long enough; self-heals
 * stale state too. No admin auth, so the hold time is re-verified server-side.
 */
export async function finishDraw(): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - DRAW_TOTAL_HOLD_MS).toISOString();
  const { error } = await supabase
    .from("game_state")
    .update({ status: "GAME" })
    .eq("id", 1)
    .eq("status", "DRAW")
    .lte("draw_started_at", cutoff);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Finish game / final reveal
// ---------------------------------------------------------------------------

export async function finishGame(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = getSupabaseAdminClient();
  const { data: scores, error: fetchError } = await supabase
    .from("scores")
    .select("team_id, points");

  if (fetchError) return { ok: false, error: "Impossibile leggere i punteggi." };

  const totals: Record<TeamId, number> = { palestrati: 0, divanisti: 0 };
  for (const s of scores ?? []) {
    totals[s.team_id as TeamId] += s.points as number;
  }

  const isDraw = totals.palestrati === totals.divanisti;
  const winner: TeamId | null = isDraw
    ? null
    : totals.palestrati > totals.divanisti
      ? "palestrati"
      : "divanisti";

  const { data: current } = await supabase
    .from("game_state")
    .select("final_nonce")
    .eq("id", 1)
    .single();

  const { error } = await supabase
    .from("game_state")
    .update({
      status: "FINAL_REVEAL",
      final_started_at: new Date().toISOString(),
      final_gym_score: totals.palestrati,
      final_couch_score: totals.divanisti,
      final_winner_team_id: winner,
      final_is_draw: isDraw,
      final_nonce: ((current?.final_nonce as number) ?? 0) + 1,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Impossibile terminare il gioco." };
  return { ok: true };
}

/**
 * Called by the display once the reveal sequence has fully played out. No
 * admin auth, so the hold time is re-verified server-side.
 */
export async function settleFinalReveal(): Promise<ActionResult> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - FINAL_TOTAL_MS).toISOString();
  const { error } = await supabase
    .from("game_state")
    .update({ status: "FINISHED" })
    .eq("id", 1)
    .eq("status", "FINAL_REVEAL")
    .lte("final_started_at", cutoff);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Dev-only reset
// ---------------------------------------------------------------------------

export async function resetGameData(): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return { ok: false, error: "Reset disponibile solo in dev mode." };
  }

  const supabase = getSupabaseAdminClient();
  await supabase.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("scores").update({ points: 0 }).in("team_id", TEAM_ORDER);
  const { error } = await supabase
    .from("game_state")
    .update({
      status: "REGISTRATION",
      timer_label: null,
      timer_duration_ms: null,
      timer_phase: "idle",
      timer_countdown_ends_at: null,
      timer_ends_at: null,
      timer_remaining_ms: null,
      draw_gym_participant_id: null,
      draw_couch_participant_id: null,
      draw_started_at: null,
      final_started_at: null,
      final_gym_score: null,
      final_couch_score: null,
      final_winner_team_id: null,
      final_is_draw: false,
      pause_previous_status: null,
      pause_message: null,
      pause_resumes_timer: false,
    })
    .eq("id", 1);

  if (error) return { ok: false, error: "Reset non riuscito." };
  return { ok: true };
}
