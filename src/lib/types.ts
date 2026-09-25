export type TeamId = "palestrati" | "divanisti";

export type ChallengeId =
  | "quiz"
  | "creativity"
  | "physical"
  | "courage"
  | "finalissima";

export type GameStatus =
  | "REGISTRATION"
  | "GAME"
  | "TIMER"
  | "DRAW"
  | "FINAL_REVEAL"
  | "FINISHED"
  | "PAUSED";

export type TimerPhase = "idle" | "active" | "paused";

export interface Team {
  id: TeamId;
  name: string;
  sort_order: number;
}

export interface Challenge {
  id: ChallengeId;
  name: string;
  sort_order: number;
}

export interface Participant {
  id: string;
  name: string;
  team_id: TeamId;
  brings_food: boolean;
  brings_drink: boolean;
  created_at: string;
}

export interface Score {
  challenge_id: ChallengeId;
  team_id: TeamId;
  points: number;
  updated_at: string;
}

export interface GameState {
  id: 1;
  status: GameStatus;

  timer_label: string | null;
  timer_duration_ms: number | null;
  timer_phase: TimerPhase;
  timer_countdown_ends_at: string | null;
  timer_ends_at: string | null;
  timer_remaining_ms: number | null;
  timer_nonce: number;

  draw_gym_participant_id: string | null;
  draw_couch_participant_id: string | null;
  draw_started_at: string | null;
  draw_nonce: number;
  /** Team being drawn in the current DRAW run; null for a draw of both teams at once. */
  draw_team: TeamId | null;

  final_started_at: string | null;
  final_gym_score: number | null;
  final_couch_score: number | null;
  final_winner_team_id: TeamId | null;
  final_is_draw: boolean;
  final_nonce: number;

  pause_previous_status: "GAME" | "TIMER" | null;
  pause_message: string | null;
  pause_resumes_timer: boolean;

  /** Text overlaid on every screen (instructions, announcements); null when hidden. */
  announcement_message: string | null;

  /** Scaletta (see lib/show.ts). Optional: undefined until migration 0007 is applied. */
  show_step?: string | null;
  show_substep?: number | null;
  /** Full-screen card of the current step in place of the scoreboard. */
  show_card?: boolean;
  show_nonce?: number;

  /** Question on screen: set + index into QUESTION_SETS; null when none. */
  question_set?: string | null;
  question_index?: number | null;
  question_answer_visible?: boolean;
  question_timer_ends_at?: string | null;
  question_nonce?: number;
  /** Finalissima numbers (1-20) already picked. */
  finalissima_used?: number[];

  updated_at: string;
}

export interface TeamTotals {
  palestrati: number;
  divanisti: number;
}

export type SoundKind = "music" | "sfx";

export interface Sound {
  id: string;
  name: string;
  kind: SoundKind;
  url: string;
  storage_path: string | null;
  created_at: string;
}

export type MusicStatus = "playing" | "paused" | "stopped";

/** A playable effect: `builtin:<id>` for a synthesized sound, otherwise a `sounds.id`. */
export type SoundRef = string;

export interface AudioState {
  id: 1;
  music_sound_id: string | null;
  music_status: MusicStatus;
  music_loop: boolean;
  music_nonce: number;
  music_volume: number;
  sfx_ref: SoundRef | null;
  sfx_nonce: number;
  sfx_volume: number;
  stop_nonce: number;
  muted: boolean;
  auto_enabled: boolean;
  auto_map: Record<string, SoundRef | "off">;
  updated_at: string;
}
