import type { Challenge, ChallengeId, Team, TeamId } from "./types";

export const TEAMS: Record<TeamId, Team> = {
  palestrati: { id: "palestrati", name: "Palestrati", sort_order: 0 },
  divanisti: { id: "divanisti", name: "Divanisti", sort_order: 1 },
};

export const TEAM_ORDER: TeamId[] = ["palestrati", "divanisti"];

export const BRING_IDEAS: { food: string[]; drink: string[] } = {
  food: [
    "Hummus e verdure crude da pucciare",
    "Chips di mais con guacamole",
    "Olive, frutta secca, taralli senza glutine",
    "Insalata di quinoa e verdure",
    "Bruschette senza glutine con pomodorini",
    "Frutta fresca a fette",
  ],
  drink: [
    "Succhi di frutta",
    "Acqua tonica e sciroppi per spritz analcolici",
    "Birra senza glutine",
    "Vino",
    "Bibite gassate",
  ],
};

export const CHALLENGES: Record<ChallengeId, Challenge> = {
  quiz: { id: "quiz", name: "Quiz culturale", sort_order: 0 },
  creativity: { id: "creativity", name: "Prova di creatività", sort_order: 1 },
  physical: { id: "physical", name: "Prova fisica", sort_order: 2 },
  courage: { id: "courage", name: "Prova di coraggio", sort_order: 3 },
  finalissima: { id: "finalissima", name: "La Finalissima", sort_order: 4 },
};

export const CHALLENGE_ORDER: ChallengeId[] = [
  "quiz",
  "creativity",
  "physical",
  "courage",
  "finalissima",
];

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

/** How long the full-screen "TIME OUT" card stays up before auto-returning to the scoreboard. */
export const TIMER_TIMEOUT_HOLD_MS = 3_000;

/** Total duration of the draw shuffle animation before the names are revealed. */
export const DRAW_SHUFFLE_MS = 2_600;

/** How long the drawn matchup stays on screen (from draw start) before auto-returning to the scoreboard. */
export const DRAW_TOTAL_HOLD_MS = 7_000;

/** Suspense hold before the winner (or pareggio) is revealed, from final sequence start. */
export const FINAL_SUSPENSE_MS = 3_400;

/** Total duration of the whole final reveal sequence before settling on the FINISHED screen. */
export const FINAL_TOTAL_MS = 9_000;
