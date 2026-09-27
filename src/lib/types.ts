/**
 * Every game has two teams; their names, colours and everything else come
 * from the active game's content (see lib/game.ts). "a"/"b" are just slots.
 */
export type TeamId = "a" | "b";

/** A challenge id from the active game's content. */
export type ChallengeId = string;

export type GameStatus =
  | "REGISTRATION"
  | "GAME"
  | "TIMER"
  | "DRAW"
  | "FINAL_REVEAL"
  | "FINISHED"
  | "PAUSED";

export type TimerPhase = "idle" | "active" | "paused";

export interface Participant {
  id: string;
  game_id: string;
  name: string;
  team_id: TeamId;
  brings_food: boolean;
  brings_drink: boolean;
  created_at: string;
}

export interface Score {
  game_id: string;
  challenge_id: ChallengeId;
  team_id: TeamId;
  points: number;
  updated_at: string;
}

export interface GameState {
  id: 1;
  /** The active game (games.id): content, participants and scores all hang off it. */
  game_id: string;
  status: GameStatus;

  timer_label: string | null;
  timer_duration_ms: number | null;
  timer_phase: TimerPhase;
  timer_countdown_ends_at: string | null;
  timer_ends_at: string | null;
  timer_remaining_ms: number | null;
  timer_nonce: number;

  draw_a_participant_id: string | null;
  draw_b_participant_id: string | null;
  draw_started_at: string | null;
  draw_nonce: number;
  /** Team being drawn in the current DRAW run; null for a draw of both teams at once. */
  draw_team: TeamId | null;

  final_started_at: string | null;
  final_a_score: number | null;
  final_b_score: number | null;
  final_winner_team_id: TeamId | null;
  final_is_draw: boolean;
  final_nonce: number;

  pause_previous_status: "GAME" | "TIMER" | null;
  pause_message: string | null;
  pause_resumes_timer: boolean;

  /** Text overlaid on every screen (instructions, announcements); null when hidden. */
  announcement_message: string | null;

  /** Running order (step ids from the game content). */
  show_step: string | null;
  show_substep: number | null;
  /** Full-screen card of the current step in place of the scoreboard. */
  show_card: boolean;
  show_nonce: number;

  /** Question on screen: set id + index into the game content; null when none. */
  question_set: string | null;
  question_index: number | null;
  question_answer_visible: boolean;
  /** The revealed answer, copied from the (admin-only) game secrets on reveal. */
  question_answer_text: string | null;
  question_answer_detail: string | null;
  question_timer_ends_at: string | null;
  question_nonce: number;
  /** Numbers (1-based) already picked on a pick-a-number board. */
  board_used: number[];

  updated_at: string;
}

export interface TeamTotals {
  a: number;
  b: number;
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
