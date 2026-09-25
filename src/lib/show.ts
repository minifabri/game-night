import type { ChallengeId } from "./types";

/**
 * La scaletta della serata e tutte le domande, dalla scaletta della
 * presentatrice. Tutto quello che finisce sul display è qui in chiaro; i testi
 * "da dire" e le risposte li vede solo l'admin (e il display mostra la
 * risposta solo quando l'admin la svela).
 */

export type ShowStepId =
  | "opening"
  | "quiz"
  | "creativity"
  | "physical"
  | "courage"
  | "prefinal"
  | "finalissima"
  | "proclamation";

export interface ShowSubstep {
  title: string;
  /** Regola breve, mostrata sul display quando il sotto-step è attivo. */
  description: string;
  /** Battuta di lancio per la presentatrice (solo admin). */
  script?: string;
}

export interface ShowStep {
  id: ShowStepId;
  /** Etichetta corta per la barra degli step sul display. */
  short: string;
  /** Es. "Gioco 1", o un'etichetta per i blocchi che non sono un gioco. */
  kicker: string;
  title: string;
  /** Sottotitolo mostrato sul display. */
  tagline: string;
  /** Orario e durata dalla scaletta (solo admin). */
  time: string;
  duration: string;
  /** Prova del tabellone collegata allo step, per l'icona. */
  challengeId?: ChallengeId;
  /** Testo "da dire" della presentatrice (solo admin). */
  script?: string;
  substeps?: ShowSubstep[];
  /** Es. "Round", "Livello": prefisso dei sotto-step. */
  substepLabel?: string;
  /**
   * Sotto-step a sorpresa: sul display restano coperti ("?") finché l'admin
   * non li svela uno a uno; avviare lo step non ne svela nessuno.
   */
  secretSubsteps?: boolean;
}

export const SHOW_STEPS: ShowStep[] = [
  {
    id: "opening",
    short: "Apertura",
    kicker: "Si comincia",
    title: "Apertura",
    tagline: "Ogni prova assegna punti. Alla fine, la Finalissima.",
    time: "21:00",
    duration: "5 min",
    script:
      "Benvenuti alla sfida definitiva: PALESTRATI contro DIVANISTI. Stasera non basterà essere intelligenti, creativi, atletici o coraggiosi: purtroppo per voi servirà tutto. Prima di cominciare, voglio un rappresentante per squadra. Avete pochissimo tempo per convincerci di una cosa: perché siete voi quelli che meritano di vincere?",
  },
  {
    id: "quiz",
    substepLabel: "Round",
    short: "Quiz",
    kicker: "Gioco 1",
    title: "Quiz culturale",
    tagline: "30 domande · 10 secondi ciascuna",
    time: "21:05",
    duration: "12 min",
    challengeId: "quiz",
    script:
      "Cominciamo dalla testa. Tre round, trenta domande, dieci secondi per rispondere. Arte, letteratura e cinema. Qui non c'è tempo per consultarsi per mezz'ora: sapete la risposta o non la sapete. Pronti? Si parte.",
    substeps: [
      { title: "Arte", description: "Guardate l'opera: chi l'ha dipinta?" },
      { title: "Libri", description: "Vi diamo il titolo: chi l'ha scritto?" },
      { title: "Cinema", description: "Riconoscete il film dalla frase." },
    ],
  },
  {
    id: "creativity",
    substepLabel: "Fase",
    short: "Creatività",
    kicker: "Gioco 2",
    title: "La pubblicità",
    tagline: "Diventate un'agenzia pubblicitaria e convinceteci",
    time: "21:20",
    duration: "15 min",
    challengeId: "creativity",
    script:
      "Bene, la cultura è finita. Adesso vediamo se almeno sapete vendere qualcosa. Questa è la prova di creatività: dovrete trasformarvi in un'agenzia pubblicitaria e convincerci con la vostra pubblicità. Non mi interessa che sia elegante: mi interessa che sia memorabile. Avete il vostro tempo per prepararvi… e poi si va in scena.",
    substeps: [
      { title: "Preparazione", description: "Avete il vostro tempo per preparare la pubblicità." },
      { title: "In scena", description: "Non deve essere elegante: deve essere memorabile." },
    ],
  },
  {
    id: "physical",
    substepLabel: "Step",
    short: "Triathlon",
    kicker: "Gioco 3",
    title: "Triathlon fisico",
    tagline: "Tre round. Scegliete bene chi mandare in campo.",
    time: "21:40",
    duration: "20 min",
    challengeId: "physical",
    secretSubsteps: true,
    script:
      "Finora avete usato il cervello e, più o meno, la creatività. Adesso basta parlare: è il momento di vedere come ve la cavate fisicamente. Questa non è una prova sola. È un TRIATHLON in tre round: equilibrio, combattimento e precisione. Quindi scegliete bene chi mandare in campo, perché essere forti non basterà.",
    substeps: [
      {
        title: "Equilibrio con il cuscino",
        description: "Il cuscino va tenuto in equilibrio sulla testa. Vince chi completa la sfida meglio e più in fretta, senza farlo cadere.",
        script:
          "Prima prova: equilibrio. Il vostro peggior nemico sarà… un cuscino. Va tenuto sulla testa. Sembra facile finché non siete voi a doverlo fare. Pronti?",
      },
      {
        title: "Sumo",
        description: "Una sola regola dentro il cerchio: restarci. Chi mette piede fuori perde.",
        script:
          "Secondo round: SUMO. Dentro questo cerchio vale una sola regola fondamentale: restarci. Chi mette piede fuori perde. Quindi posizione, strategia… e cercate di conservare almeno un minimo di dignità.",
      },
      {
        title: "Tiro a canestro",
        description: "Avete le palline, avete il bersaglio. Vince chi centra di più.",
        script:
          "Ultima parte del triathlon: precisione. Niente scuse, niente forza bruta: avete le palline, avete il bersaglio. Vince chi centra di più. Via.",
      },
    ],
  },
  {
    id: "courage",
    substepLabel: "Livello",
    short: "Coraggio",
    kicker: "Gioco 4",
    title: "Prova di coraggio",
    tagline: "Tre livelli. Saprete cosa vi aspetta… quando sarà troppo tardi.",
    time: "22:05",
    duration: "20 min",
    challengeId: "courage",
    secretSubsteps: true,
    script:
      "Avete dimostrato quanto sapete, quanto siete creativi e quanto siete atletici. Adesso resta una domanda: quanto siete coraggiosi? Questa prova ha TRE LIVELLI. E la cosa bella è che saprete cosa vi aspetta… solo quando sarà troppo tardi per tirarvi indietro.",
    substeps: [
      {
        title: "La scatola misteriosa",
        description: "Non potete guardare dentro. Solo la mano, solo il tatto.",
        script:
          "Livello uno. Davanti a voi c'è una scatola. Non potete guardare dentro. Potete solo mettere la mano e scoprire cosa c'è… con il tatto. Vi consiglio di non fare troppe domande.",
      },
      {
        title: "Camminata bendati",
        description: "Senza vista, dritti al traguardo nel minor tempo possibile.",
        script:
          "Livello due. Vi togliamo una cosa abbastanza utile: la vista. Dovete andare dritti e raggiungere il traguardo il più velocemente possibile. Noi sappiamo dove state andando. Voi, decisamente meno.",
      },
      {
        title: "Natto",
        description: "La prova finisce quando riuscite a mangiarlo.",
        script:
          "Siete arrivati al terzo e ultimo livello. Niente benda, niente scatola. Stavolta potete vedere perfettamente quello che vi aspetta… e forse era meglio di no. Signore e signori: NATTO. La prova finisce quando riuscite a mangiarlo.",
      },
    ],
  },
  {
    id: "prefinal",
    short: "Pre-finale",
    kicker: "Classifica",
    title: "Classifica pre-finale",
    tagline: "Tutto si decide nella Finalissima",
    time: "22:25",
    duration: "5 min",
  },
  {
    id: "finalissima",
    short: "Finalissima",
    kicker: "Gran finale",
    title: "La Finalissima",
    tagline: "Scegliete un numero da 1 a 20",
    time: "22:30",
    duration: "25 min",
    challengeId: "finalissima",
    script:
      "Siamo arrivati alla FINALISSIMA. Davanti a voi ci sono venti numeri e dietro ogni numero c'è una domanda. Scegliete il vostro numero e scoprite cosa vi è capitato. Qui non avete i dieci secondi del primo quiz: potete pensarci… ma non approfittate della mia pazienza. E attenzione: cinque domande riguardano me. Vediamo chi mi conosce davvero.",
  },
  {
    id: "proclamation",
    short: "Vincitori",
    kicker: "Ci siamo",
    title: "Proclamazione",
    tagline: "E la squadra vincitrice è…",
    time: "22:55",
    duration: "5 min",
    script:
      "Ci siamo. Dopo cultura, creatività, forza, coraggio e una finalissima senza pietà, abbiamo un risultato. La squadra vincitrice di PALESTRATI vs DIVANISTI è…",
  },
];

export const SHOW_STEP_IDS = SHOW_STEPS.map((s) => s.id) as [ShowStepId, ...ShowStepId[]];

export function getShowStep(id: string | null | undefined): ShowStep | null {
  return SHOW_STEPS.find((s) => s.id === id) ?? null;
}

/** Sotto-step acceso: per gli step a sorpresa -1 (nessuno svelato) finché l'admin non ne sceglie uno. */
export function activeSubstep(step: ShowStep, substep: number | null | undefined): number {
  return substep ?? (step.secretSubsteps ? -1 : 0);
}

/** game_state fields cleared by the resets (kept separate: they need migration 0007). */
export const SHOW_RESET_PATCH = {
  show_step: null,
  show_substep: null,
  show_card: false,
  question_set: null,
  question_index: null,
  question_answer_visible: false,
  question_timer_ends_at: null,
  finalissima_used: [],
};

// ---------------------------------------------------------------------------
// Domande
// ---------------------------------------------------------------------------

export type QuestionSetId = "arte" | "libri" | "cinema" | "finalissima";

export interface Question {
  /** Testo a schermo (titolo del libro, frase del film, domanda). Assente per i quadri. */
  prompt?: string;
  /** Solo per i quadri: il display mostra unicamente l'immagine. */
  image?: string;
  /** Titolo dell'opera, mostrato insieme alla risposta. */
  title?: string;
  /** Categoria della Finalissima. */
  category?: string;
  /** null = risposta che conosce solo la presentatrice. */
  answer: string | null;
}

export interface QuestionSet {
  id: QuestionSetId;
  label: string;
  step: ShowStepId;
  /** Indice del sotto-step (round del quiz) che il set accende. */
  substep: number | null;
  /** La domanda che il display ripete sopra ogni item. */
  ask: string | null;
  /** Tempo per rispondere; null = senza timer. */
  timerMs: number | null;
  questions: Question[];
}

export const QUIZ_TIMER_MS = 10_000;

function painting(file: string, title: string, answer: string): Question {
  return { image: `/quiz/arte/${file}`, title, answer };
}

export const QUESTION_SETS: Record<QuestionSetId, QuestionSet> = {
  arte: {
    id: "arte",
    label: "Arte",
    step: "quiz",
    substep: 0,
    ask: "Chi l'ha dipinto?",
    timerMs: QUIZ_TIMER_MS,
    questions: [
      painting("01-medusa.jpg", "La Medusa", "Caravaggio"),
      painting("02-guernica.jpg", "Guernica", "Pablo Picasso"),
      painting("03-da-dove-veniamo.jpg", "Da dove veniamo? Chi siamo? Dove andiamo?", "Paul Gauguin"),
      painting("04-il-figlio-dell-uomo.jpg", "Il figlio dell'uomo", "René Magritte"),
      painting("05-la-persistenza-della-memoria.jpg", "La persistenza della memoria", "Salvador Dalí"),
      painting("06-l-ultima-cena.jpg", "L'ultima cena", "Leonardo da Vinci"),
      painting("07-il-bevitore-d-assenzio.jpg", "Il bevitore d'assenzio", "Edgar Degas"),
      painting("08-il-compleanno.jpg", "Il compleanno", "Marc Chagall"),
      painting("09-la-nascita-di-venere.jpg", "La nascita di Venere", "Sandro Botticelli"),
      painting("10-l-urlo.jpg", "L'urlo", "Edvard Munch"),
    ],
  },
  libri: {
    id: "libri",
    label: "Libri",
    step: "quiz",
    substep: 1,
    ask: "Chi l'ha scritto?",
    timerMs: QUIZ_TIMER_MS,
    questions: [
      { prompt: "Cent'anni di solitudine", answer: "Gabriel García Márquez" },
      { prompt: "Cecità", answer: "José Saramago" },
      { prompt: "Il barone rampante", answer: "Italo Calvino" },
      { prompt: "Siddhartha", answer: "Hermann Hesse" },
      { prompt: "I Malavoglia", answer: "Giovanni Verga" },
      { prompt: "Lo straniero", answer: "Albert Camus" },
      { prompt: "Il fu Mattia Pascal", answer: "Luigi Pirandello" },
      { prompt: "Bar Sport", answer: "Stefano Benni" },
      { prompt: "Quel che resta del giorno", answer: "Kazuo Ishiguro" },
      { prompt: "Kitchen", answer: "Banana Yoshimoto" },
    ],
  },
  cinema: {
    id: "cinema",
    label: "Cinema",
    step: "quiz",
    substep: 2,
    ask: "Da quale film?",
    timerMs: QUIZ_TIMER_MS,
    questions: [
      { prompt: "«Io ne ho viste cose che voi umani non potreste immaginare…»", answer: "Blade Runner" },
      {
        prompt: "«A differenza degli altri Robin Hood, io parlo con accento inglese.»",
        answer: "Robin Hood – Un uomo in calzamaglia",
      },
      { prompt: "«Dimmi qualcosa.»\n«Qualcosa.»", answer: "Pulp Fiction" },
      { prompt: "«Wilson!»", answer: "Cast Away" },
      { prompt: "«Apri la porta, HAL.»", answer: "2001: Odissea nello spazio" },
      { prompt: "«Non c'è gene per lo spirito umano.»", answer: "Gattaca" },
      { prompt: "«Non esiste il cucchiaio.»", answer: "Matrix" },
      { prompt: "«Incontrami a Montauk.»", answer: "Se mi lasci ti cancello" },
      { prompt: "«Perché indossi quello stupido costume da uomo?»", answer: "Donnie Darko" },
      { prompt: "«Il Drugo resta.»", answer: "Il grande Lebowski" },
    ],
  },
  finalissima: {
    id: "finalissima",
    label: "Finalissima",
    step: "finalissima",
    substep: null,
    ask: null,
    timerMs: null,
    questions: [
      { category: "Personale", prompt: "Dove è stato trovato Marino, il mio gatto?", answer: null },
      { category: "Personale", prompt: "Quando è il mio compleanno?", answer: null },
      { category: "Personale", prompt: "Qual è stato il mio ultimo viaggio?", answer: "Budapest" },
      { category: "Personale", prompt: "Qual è il mio colore naturale di capelli?", answer: null },
      { category: "Personale", prompt: "Come si chiama mio fratello?", answer: null },
      { category: "Storia", prompt: "In che anno cadde il Muro di Berlino?", answer: "1989" },
      { category: "Geografia", prompt: "Quale paese ha una foglia d'acero sulla bandiera?", answer: "Canada" },
      { category: "Cultura generale", prompt: "Qual è la moneta del Giappone?", answer: "Yen" },
      { category: "Sport", prompt: "Quanti giocatori per squadra sono in campo nel calcio?", answer: "11" },
      { category: "Geografia", prompt: "Qual è la capitale della Nuova Zelanda?", answer: "Wellington" },
      { category: "Scienza", prompt: "Quale elemento chimico ha simbolo W?", answer: "Tungsteno" },
      {
        category: "Scienza",
        prompt: "Quale pianeta impiega più tempo a ruotare su se stesso?",
        answer: "Venere",
      },
      {
        category: "Animali",
        prompt: "Quale animale ha impronte digitali sorprendentemente simili a quelle umane?",
        answer: "Koala",
      },
      {
        category: "Animali",
        prompt: "Qual è indicativamente la vita media di una gallina domestica?",
        answer: "Circa 5-10 anni",
      },
      { category: "Geografia", prompt: "Qual è il deserto più grande del mondo?", answer: "Antartide" },
      { category: "Geografia", prompt: "Quale fiume attraversa Budapest?", answer: "Danubio" },
      { category: "Corpo umano", prompt: "Qual è l'osso più piccolo del corpo umano?", answer: "La staffa" },
      {
        category: "Geografia",
        prompt: "Qual è l'unico continente attraversato sia dall'Equatore sia dal meridiano di Greenwich?",
        answer: "Africa",
      },
      { category: "Scienza", prompt: "Quale metallo è liquido a temperatura ambiente?", answer: "Mercurio" },
      {
        category: "Lingue",
        prompt: "Qual è la lingua con il maggior numero di madrelingua al mondo?",
        answer: "Cinese mandarino",
      },
    ],
  },
};

/** Ordine del quiz: "Succ" dall'ultima domanda di un round passa al round dopo. */
export const QUIZ_SET_ORDER: QuestionSetId[] = ["arte", "libri", "cinema"];

export const QUESTION_SET_IDS = Object.keys(QUESTION_SETS) as [QuestionSetId, ...QuestionSetId[]];

export function getQuestion(set: string | null | undefined, index: number | null | undefined) {
  if (!set || index === null || index === undefined) return null;
  const qs = QUESTION_SETS[set as QuestionSetId];
  const question = qs?.questions[index];
  return question ? { set: qs, question, index } : null;
}

/** La domanda prima/dopo, attraversando i round del quiz; null a inizio/fine. */
export function adjacentQuestion(
  set: QuestionSetId,
  index: number,
  dir: 1 | -1
): { set: QuestionSetId; index: number } | null {
  const size = QUESTION_SETS[set].questions.length;
  const next = index + dir;
  if (next >= 0 && next < size) return { set, index: next };
  const pos = QUIZ_SET_ORDER.indexOf(set);
  if (pos === -1) return null;
  const other = QUIZ_SET_ORDER[pos + dir];
  if (!other) return null;
  return { set: other, index: dir === 1 ? 0 : QUESTION_SETS[other].questions.length - 1 };
}
