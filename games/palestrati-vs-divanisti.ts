import type { GamePack } from "../src/lib/game-pack.ts";

/**
 * Palestrati vs Divanisti — la prima serata, dalla scaletta definitiva della
 * presentatrice. Caricato nel database dalla migration 0008; dopo una
 * modifica: npm run game:load -- games/palestrati-vs-divanisti.ts
 *
 * Tutto quello che finisce sul display è in chiaro; "script" (testi da dire)
 * e "answer"/"detail" restano all'admin finché non si svela la risposta.
 */

const IMAGES = "/games/palestrati-vs-divanisti/arte";
const QUIZ_TIMER_MS = 10_000;

const pack: GamePack = {
  id: "palestrati-vs-divanisti",
  title: "Palestrati vs Divanisti",
  subtitle: "Game Night",
  heroImage: "/games/palestrati-vs-divanisti/hero.jpg",
  teams: {
    a: { name: "Palestrati", member: "Palestrato" },
    b: { name: "Divanisti", member: "Divanista" },
  },
  challenges: [
    { id: "quiz", name: "Quiz culturale", icon: "quiz" },
    { id: "creativity", name: "Prova di creatività", icon: "creativity" },
    { id: "physical", name: "Prova fisica", icon: "physical" },
    { id: "courage", name: "Prova di coraggio", icon: "courage" },
    { id: "finalissima", name: "La Finalissima", icon: "finalissima" },
  ],
  registration: {
    bring: {
      note: "Tutto vegano e senza glutine, ovviamente.",
      ideas: {
        food: [
          "Hummus e verdure crude da pucciare",
          "Chips di mais o legumi con guacamole",
          "Olive, frutta secca, taralli senza glutine",
          "Insalata di quinoa e verdure, legumi",
          "Bruschette senza glutine con pomodorini",
          "Frutta fresca a fette",
          "Frittata di ceci (farinata)",
          "Tofu marinato a cubetti",
        ],
        drink: ["Spritz", "Birra", "Vino", "Coca zero"],
      },
    },
  },
  steps: [
    {
      id: "opening",
      showTeams: true,
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
      showScoreboard: true,
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
      board: "finalissima",
      script:
        "Siamo arrivati alla FINALISSIMA. Davanti a voi ci sono venti numeri e dietro ogni numero c'è una domanda. Scegliete il vostro numero e scoprite cosa vi è capitato. Qui non avete i dieci secondi del primo quiz: potete pensarci… ma non approfittate della mia pazienza. E attenzione: cinque domande riguardano me. Vediamo chi mi conosce davvero.",
    },
    {
      id: "proclamation",
      finale: true,
      short: "Vincitori",
      kicker: "Ci siamo",
      title: "Proclamazione",
      tagline: "E la squadra vincitrice è…",
      time: "22:55",
      duration: "5 min",
      script:
        "Ci siamo. Dopo cultura, creatività, forza, coraggio e una finalissima senza pietà, abbiamo un risultato. La squadra vincitrice di PALESTRATI vs DIVANISTI è…",
    },
  ],
  questionSets: [
    {
      id: "arte",
      label: "Arte",
      step: "quiz",
      substep: 0,
      ask: "Chi l'ha dipinto?",
      timerMs: QUIZ_TIMER_MS,
      questions: [
        { image: `${IMAGES}/01-medusa.jpg`, detail: "La Medusa", answer: "Caravaggio" },
        { image: `${IMAGES}/02-guernica.jpg`, detail: "Guernica", answer: "Pablo Picasso" },
        { image: `${IMAGES}/03-da-dove-veniamo.jpg`, detail: "Da dove veniamo? Chi siamo? Dove andiamo?", answer: "Paul Gauguin" },
        { image: `${IMAGES}/04-il-figlio-dell-uomo.jpg`, detail: "Il figlio dell'uomo", answer: "René Magritte" },
        { image: `${IMAGES}/05-la-persistenza-della-memoria.jpg`, detail: "La persistenza della memoria", answer: "Salvador Dalí" },
        { image: `${IMAGES}/06-l-ultima-cena.jpg`, detail: "L'ultima cena", answer: "Leonardo da Vinci" },
        { image: `${IMAGES}/07-il-bevitore-d-assenzio.jpg`, detail: "Il bevitore d'assenzio", answer: "Edgar Degas" },
        { image: `${IMAGES}/08-il-compleanno.jpg`, detail: "Il compleanno", answer: "Marc Chagall" },
        { image: `${IMAGES}/09-la-nascita-di-venere.jpg`, detail: "La nascita di Venere", answer: "Sandro Botticelli" },
        { image: `${IMAGES}/10-l-urlo.jpg`, detail: "L'urlo", answer: "Edvard Munch" },
      ],
    },
    {
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
    {
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
    {
      id: "finalissima",
      label: "Finalissima",
      step: "finalissima",
      substep: null,
      ask: null,
      timerMs: null,
      pickByNumber: true,
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
  ],
};

export default pack;
