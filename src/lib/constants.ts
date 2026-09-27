import type { TeamId } from "./types";

/** The two team slots; names and colours come from the active game. */
export const TEAM_ORDER: TeamId[] = ["a", "b"];

/**
 * game_state fields rewound when a game (re)starts: timer, draw, final
 * reveal, pause, message, running order and question. Doesn't touch
 * `status` or `game_id`.
 */
export const LIVE_STATE_RESET = {
  timer_label: null,
  timer_duration_ms: null,
  timer_phase: "idle",
  timer_countdown_ends_at: null,
  timer_ends_at: null,
  timer_remaining_ms: null,
  draw_a_participant_id: null,
  draw_b_participant_id: null,
  draw_started_at: null,
  draw_team: null,
  final_started_at: null,
  final_a_score: null,
  final_b_score: null,
  final_winner_team_id: null,
  final_is_draw: false,
  pause_previous_status: null,
  pause_message: null,
  pause_resumes_timer: false,
  announcement_message: null,
  show_step: null,
  show_substep: null,
  show_card: false,
  question_set: null,
  question_index: null,
  question_answer_visible: false,
  question_answer_text: null,
  question_answer_detail: null,
  question_timer_ends_at: null,
  board_used: [],
};

export interface TimerPreset {
  label: string;
  ms: number;
}

export const TIMER_PRESETS: TimerPreset[] = [
  { label: "5 secondi", ms: 5_000 },
  { label: "10 secondi", ms: 10_000 },
  { label: "30 secondi", ms: 30_000 },
  { label: "1 minuto", ms: 60_000 },
  { label: "3 minuti", ms: 180_000 },
  { label: "5 minuti", ms: 300_000 },
];

/** Duration of the "GAME STARTS IN 3-2-1" scenic countdown before a timer actually starts running. */
export const TIMER_STARTUP_COUNTDOWN_MS = 3_000;

/**
 * How long the full-screen "TIME OUT" card stays up before auto-returning to
 * the scoreboard; the admin can go back sooner with "Torna al tabellone".
 */
export const TIMER_TIMEOUT_HOLD_MS = 5 * 60_000;

/** Total duration of the draw shuffle animation before the names are revealed. */
export const DRAW_SHUFFLE_MS = 2_600;

/**
 * How long the drawn contestant stays on screen (from draw start) before
 * auto-returning to the scoreboard; the admin can go back sooner with
 * "Torna al tabellone".
 */
export const DRAW_TOTAL_HOLD_MS = 5 * 60_000;

/** Suspense hold before the winner (or pareggio) is revealed, from final sequence start. */
export const FINAL_SUSPENSE_MS = 3_400;

/** Total duration of the whole final reveal sequence before settling on the FINISHED screen. */
export const FINAL_TOTAL_MS = 9_000;
