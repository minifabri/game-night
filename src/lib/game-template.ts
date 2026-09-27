import type { GamePack } from "./game-pack";

/**
 * Starting point for "Nuovo gioco" from scratch: the same running order as
 * the first evening (opening, five games, pre-final standings, finalissima,
 * proclamation) with neutral texts and empty question rounds, ready to be
 * filled in from the content editor.
 */
export function blankPack(id: string, title: string): GamePack {
  return {
    id,
    title,
    subtitle: "Game Night",
    teams: {
      a: { name: "Squadra A", member: "Giocatore A" },
      b: { name: "Squadra B", member: "Giocatore B" },
    },
    challenges: [
      { id: "quiz", name: "Quiz", icon: "quiz" },
      { id: "creativity", name: "Prova di creatività", icon: "creativity" },
      { id: "physical", name: "Prova fisica", icon: "physical" },
      { id: "courage", name: "Prova di coraggio", icon: "courage" },
      { id: "finalissima", name: "La Finalissima", icon: "finalissima" },
    ],
    steps: [
      {
        id: "opening",
        short: "Apertura",
        kicker: "Si comincia",
        title: "Apertura",
        tagline: "Ogni prova assegna punti. Alla fine, la Finalissima.",
        showTeams: true,
      },
      {
        id: "quiz",
        short: "Quiz",
        kicker: "Gioco 1",
        title: "Quiz",
        tagline: "",
        challengeId: "quiz",
        substepLabel: "Round",
        substeps: [{ title: "Round 1", description: "" }],
      },
      {
        id: "creativity",
        short: "Creatività",
        kicker: "Gioco 2",
        title: "Prova di creatività",
        tagline: "",
        challengeId: "creativity",
      },
      {
        id: "physical",
        short: "Fisica",
        kicker: "Gioco 3",
        title: "Prova fisica",
        tagline: "",
        challengeId: "physical",
        substepLabel: "Step",
        secretSubsteps: true,
        substeps: [{ title: "Step 1", description: "" }],
      },
      {
        id: "courage",
        short: "Coraggio",
        kicker: "Gioco 4",
        title: "Prova di coraggio",
        tagline: "",
        challengeId: "courage",
        substepLabel: "Livello",
        secretSubsteps: true,
        substeps: [{ title: "Livello 1", description: "" }],
      },
      {
        id: "prefinal",
        short: "Pre-finale",
        kicker: "Classifica",
        title: "Classifica pre-finale",
        tagline: "Tutto si decide nella Finalissima",
        showScoreboard: true,
      },
      {
        id: "finalissima",
        short: "Finalissima",
        kicker: "Gran finale",
        title: "La Finalissima",
        tagline: "Scegliete un numero",
        challengeId: "finalissima",
        board: "finalissima",
      },
      {
        id: "proclamation",
        short: "Vincitori",
        kicker: "Ci siamo",
        title: "Proclamazione",
        tagline: "E la squadra vincitrice è…",
        finale: true,
      },
    ],
    questionSets: [
      { id: "quiz-1", label: "Round 1", step: "quiz", substep: 0, ask: null, timerMs: 10_000, questions: [] },
      {
        id: "finalissima",
        label: "Finalissima",
        step: "finalissima",
        substep: null,
        ask: null,
        timerMs: null,
        pickByNumber: true,
        questions: [],
      },
    ],
  };
}
