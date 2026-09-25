import type { TeamId } from "./types";

/**
 * A game is everything that changes from one party to the next: team names
 * and colours, the challenges on the scoreboard, the running order and the
 * questions. It lives in the database (`games` + `game_secrets`), one row per
 * game, and `game_state.game_id` says which one is being played.
 *
 * `GameContent` is public (every screen reads it); the presenter's lines and
 * the answers live in `GameSecrets`, readable only by the admin, so nobody
 * can find them from a phone. Games are authored as a single `GamePack` file
 * in `games/` (see game-pack.ts), which is split into the two.
 */

export type IconId = "quiz" | "creativity" | "physical" | "courage" | "finalissima" | "star";

export interface TeamInfo {
  /** Plural, as on the scoreboard: "Palestrati". */
  name: string;
  /** Singular, for the draw: "Palestrato". */
  member: string;
  /** Optional CSS colours overriding the default orange (a) / teal (b). */
  color?: string;
  colorSoft?: string;
}

export interface ChallengeInfo {
  id: string;
  name: string;
  icon?: IconId;
}

export interface ShowSubstep {
  title: string;
  /** Short rule shown on screen while the sub-step is active. */
  description: string;
}

export interface ShowStep {
  id: string;
  /** Short label for the step track on screen. */
  short: string;
  /** E.g. "Gioco 1", or a label for blocks that aren't a game. */
  kicker: string;
  title: string;
  /** Subtitle shown on screen. */
  tagline: string;
  /** Time slot and duration from the running order (admin only). */
  time?: string;
  duration?: string;
  /** Scoreboard challenge the step belongs to, for its icon. */
  challengeId?: string;
  substeps?: ShowSubstep[];
  /** E.g. "Round", "Livello": prefix of the sub-steps. */
  substepLabel?: string;
  /**
   * Surprise sub-steps: they stay covered ("?") on screen until the admin
   * reveals them one by one; starting the step reveals none.
   */
  secretSubsteps?: boolean;
  /** The step card also shows the two teams face to face. */
  showTeams?: boolean;
  /** The step card also shows the scoreboard. */
  showScoreboard?: boolean;
  /** Id of a pick-a-number question set whose board the step card shows. */
  board?: string;
  /** Last step: the admin is reminded to run "Termina gioco" for the winner reveal. */
  finale?: boolean;
}

export interface PublicQuestion {
  /** Text on screen (book title, film quote, question). Absent for image questions. */
  prompt?: string;
  /** Image-only question (e.g. a painting): the screen shows just the picture. */
  image?: string;
  category?: string;
}

export interface QuestionSet {
  id: string;
  label: string;
  /** Step the set belongs to (showing a question lights it up). */
  step: string;
  /** Sub-step (e.g. quiz round) the set lights up. */
  substep: number | null;
  /** The question repeated above every item, e.g. "Chi l'ha scritto?". */
  ask: string | null;
  /** Answer time; null = no timer. */
  timerMs: number | null;
  /** Contestants pick a number: shown as "N° x" and ticked off on the step's board. */
  pickByNumber?: boolean;
  questions: PublicQuestion[];
}

export interface GameContent {
  /** Small line under "A vs B" in the wordmark, e.g. "Game Night". */
  subtitle: string;
  /** Poster at the top of the registration and waiting room (path in /public). */
  heroImage?: string;
  teams: Record<TeamId, TeamInfo>;
  challenges: ChallengeInfo[];
  registration?: {
    /** "Cosa porterai?" step; omitted = not asked. */
    bring?: {
      note?: string;
      ideas?: { food: string[]; drink: string[] };
    };
  };
  steps: ShowStep[];
  questionSets: QuestionSet[];
}

export interface Game {
  id: string;
  title: string;
  content: GameContent;
  created_at: string;
}

export interface QuestionSecret {
  answer: string | null;
  /** Shown with the answer, e.g. the painting's title. */
  detail?: string;
}

export interface GameSecrets {
  /** Presenter's lines per step id. */
  steps: Record<string, { script?: string; substepScripts?: (string | null)[] }>;
  /** Answers per question set id, same order as the questions. */
  answers: Record<string, QuestionSecret[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function teamLabel(content: GameContent, team: TeamId): string {
  return content.teams[team].name;
}

export function getStep(content: GameContent, id: string | null | undefined): ShowStep | null {
  return content.steps.find((s) => s.id === id) ?? null;
}

export function getQuestionSet(content: GameContent, id: string | null | undefined): QuestionSet | null {
  return content.questionSets.find((s) => s.id === id) ?? null;
}

export function getQuestion(content: GameContent, set: string | null | undefined, index: number | null | undefined) {
  if (index === null || index === undefined) return null;
  const qs = getQuestionSet(content, set);
  const question = qs?.questions[index];
  return qs && question ? { set: qs, question, index } : null;
}

/** Active sub-step: -1 for a surprise step until the admin reveals one. */
export function activeSubstep(step: ShowStep, substep: number | null | undefined): number {
  return substep ?? (step.secretSubsteps ? -1 : 0);
}

/**
 * The question before/after, moving across the sets of the same step (quiz
 * rounds) in content order; null at either end. Pick-a-number sets don't
 * step: contestants choose.
 */
export function adjacentQuestion(
  content: GameContent,
  setId: string,
  index: number,
  dir: 1 | -1
): { set: string; index: number } | null {
  const set = getQuestionSet(content, setId);
  if (!set) return null;
  const next = index + dir;
  if (next >= 0 && next < set.questions.length) return { set: set.id, index: next };
  if (set.pickByNumber) return null;
  const siblings = content.questionSets.filter((s) => s.step === set.step && !s.pickByNumber);
  const other = siblings[siblings.indexOf(set) + dir];
  if (!other || other.questions.length === 0) return null;
  return { set: other.id, index: dir === 1 ? 0 : other.questions.length - 1 };
}

/** Default answer time when the admin starts a timer on a set without one. */
export const DEFAULT_QUESTION_TIMER_MS = 10_000;
