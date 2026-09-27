-- Giochi riutilizzabili: ogni gioco (squadre, prove, scaletta, domande) è una
-- riga di `games`, e iscritti e punteggi appartengono a un gioco, così una
-- serata resta in archivio quando si passa alla successiva.
-- `game_state.game_id` è il gioco attivo.
--
-- - games.content: contenuti pubblici (li leggono tutti gli schermi).
-- - game_secrets.content: testi da dire e risposte, SOLO admin (nessuna
--   policy di lettura: le legge solo il server con la service_role key). La
--   risposta svelata viene copiata in game_state.question_answer_*.
-- - Le squadre diventano due "posti", 'a' e 'b': nomi e colori sono nel
--   contenuto del gioco. I dati esistenti passano da palestrati → a e
--   divanisti → b, e finiscono nel gioco 'palestrati-vs-divanisti'.
--
-- ATTENZIONE: rinomina colonne usate dal codice. Va applicata insieme al
-- deploy della versione dell'app che la usa.

create table games (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(trim(title)) > 0),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table game_secrets (
  game_id text primary key references games(id) on delete cascade,
  content jsonb not null
);

alter table games enable row level security;
alter table game_secrets enable row level security;
create policy "public read games" on games for select using (true);
-- no policy on game_secrets on purpose: anon/authenticated can't read it.

alter publication supabase_realtime add table games;

-- La prima serata, generata da games/palestrati-vs-divanisti.ts
-- (npm run game:sql -- games/palestrati-vs-divanisti.ts).
insert into games (id, title, content) values (
  'palestrati-vs-divanisti',
  'Palestrati vs Divanisti',
  $game${
  "subtitle": "Game Night",
  "heroImage": "/games/palestrati-vs-divanisti/hero.jpg",
  "teams": {
    "a": {
      "name": "Palestrati",
      "member": "Palestrato"
    },
    "b": {
      "name": "Divanisti",
      "member": "Divanista"
    }
  },
  "challenges": [
    {
      "id": "quiz",
      "name": "Quiz culturale",
      "icon": "quiz"
    },
    {
      "id": "creativity",
      "name": "Prova di creatività",
      "icon": "creativity"
    },
    {
      "id": "physical",
      "name": "Prova fisica",
      "icon": "physical"
    },
    {
      "id": "courage",
      "name": "Prova di coraggio",
      "icon": "courage"
    },
    {
      "id": "finalissima",
      "name": "La Finalissima",
      "icon": "finalissima"
    }
  ],
  "registration": {
    "bring": {
      "note": "Tutto vegano e senza glutine, ovviamente.",
      "ideas": {
        "food": [
          "Hummus e verdure crude da pucciare",
          "Chips di mais o legumi con guacamole",
          "Olive, frutta secca, taralli senza glutine",
          "Insalata di quinoa e verdure, legumi",
          "Bruschette senza glutine con pomodorini",
          "Frutta fresca a fette",
          "Frittata di ceci (farinata)",
          "Tofu marinato a cubetti"
        ],
        "drink": [
          "Spritz",
          "Birra",
          "Vino",
          "Coca zero"
        ]
      }
    }
  },
  "steps": [
    {
      "id": "opening",
      "short": "Apertura",
      "kicker": "Si comincia",
      "title": "Apertura",
      "tagline": "Ogni prova assegna punti. Alla fine, la Finalissima.",
      "time": "21:00",
      "duration": "5 min",
      "showTeams": true
    },
    {
      "id": "quiz",
      "short": "Quiz",
      "kicker": "Gioco 1",
      "title": "Quiz culturale",
      "tagline": "30 domande · 10 secondi ciascuna",
      "time": "21:05",
      "duration": "12 min",
      "challengeId": "quiz",
      "substepLabel": "Round",
      "substeps": [
        {
          "title": "Arte",
          "description": "Guardate l'opera: chi l'ha dipinta?"
        },
        {
          "title": "Libri",
          "description": "Vi diamo il titolo: chi l'ha scritto?"
        },
        {
          "title": "Cinema",
          "description": "Riconoscete il film dalla frase."
        }
      ]
    },
    {
      "id": "creativity",
      "short": "Creatività",
      "kicker": "Gioco 2",
      "title": "La pubblicità",
      "tagline": "Diventate un'agenzia pubblicitaria e convinceteci",
      "time": "21:20",
      "duration": "15 min",
      "challengeId": "creativity",
      "substepLabel": "Fase",
      "substeps": [
        {
          "title": "Preparazione",
          "description": "Avete il vostro tempo per preparare la pubblicità."
        },
        {
          "title": "In scena",
          "description": "Non deve essere elegante: deve essere memorabile."
        }
      ]
    },
    {
      "id": "physical",
      "short": "Triathlon",
      "kicker": "Gioco 3",
      "title": "Triathlon fisico",
      "tagline": "Tre round. Scegliete bene chi mandare in campo.",
      "time": "21:40",
      "duration": "20 min",
      "challengeId": "physical",
      "substepLabel": "Step",
      "secretSubsteps": true,
      "substeps": [
        {
          "title": "Equilibrio con il cuscino",
          "description": "Il cuscino va tenuto in equilibrio sulla testa. Vince chi completa la sfida meglio e più in fretta, senza farlo cadere."
        },
        {
          "title": "Sumo",
          "description": "Una sola regola dentro il cerchio: restarci. Chi mette piede fuori perde."
        },
        {
          "title": "Tiro a canestro",
          "description": "Avete le palline, avete il bersaglio. Vince chi centra di più."
        }
      ]
    },
    {
      "id": "courage",
      "short": "Coraggio",
      "kicker": "Gioco 4",
      "title": "Prova di coraggio",
      "tagline": "Tre livelli. Saprete cosa vi aspetta… quando sarà troppo tardi.",
      "time": "22:05",
      "duration": "20 min",
      "challengeId": "courage",
      "substepLabel": "Livello",
      "secretSubsteps": true,
      "substeps": [
        {
          "title": "La scatola misteriosa",
          "description": "Non potete guardare dentro. Solo la mano, solo il tatto."
        },
        {
          "title": "Camminata bendati",
          "description": "Senza vista, dritti al traguardo nel minor tempo possibile."
        },
        {
          "title": "Natto",
          "description": "La prova finisce quando riuscite a mangiarlo."
        }
      ]
    },
    {
      "id": "prefinal",
      "short": "Pre-finale",
      "kicker": "Classifica",
      "title": "Classifica pre-finale",
      "tagline": "Tutto si decide nella Finalissima",
      "time": "22:25",
      "duration": "5 min",
      "showScoreboard": true
    },
    {
      "id": "finalissima",
      "short": "Finalissima",
      "kicker": "Gran finale",
      "title": "La Finalissima",
      "tagline": "Scegliete un numero da 1 a 20",
      "time": "22:30",
      "duration": "25 min",
      "challengeId": "finalissima",
      "board": "finalissima"
    },
    {
      "id": "proclamation",
      "short": "Vincitori",
      "kicker": "Ci siamo",
      "title": "Proclamazione",
      "tagline": "E la squadra vincitrice è…",
      "time": "22:55",
      "duration": "5 min",
      "finale": true
    }
  ],
  "questionSets": [
    {
      "id": "arte",
      "label": "Arte",
      "step": "quiz",
      "substep": 0,
      "ask": "Chi l'ha dipinto?",
      "timerMs": 10000,
      "questions": [
        {
          "image": "/games/palestrati-vs-divanisti/arte/01-medusa.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/02-guernica.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/03-da-dove-veniamo.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/04-il-figlio-dell-uomo.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/05-la-persistenza-della-memoria.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/06-l-ultima-cena.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/07-il-bevitore-d-assenzio.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/08-il-compleanno.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/09-la-nascita-di-venere.jpg"
        },
        {
          "image": "/games/palestrati-vs-divanisti/arte/10-l-urlo.jpg"
        }
      ]
    },
    {
      "id": "libri",
      "label": "Libri",
      "step": "quiz",
      "substep": 1,
      "ask": "Chi l'ha scritto?",
      "timerMs": 10000,
      "questions": [
        {
          "prompt": "Cent'anni di solitudine"
        },
        {
          "prompt": "Cecità"
        },
        {
          "prompt": "Il barone rampante"
        },
        {
          "prompt": "Siddhartha"
        },
        {
          "prompt": "I Malavoglia"
        },
        {
          "prompt": "Lo straniero"
        },
        {
          "prompt": "Il fu Mattia Pascal"
        },
        {
          "prompt": "Bar Sport"
        },
        {
          "prompt": "Quel che resta del giorno"
        },
        {
          "prompt": "Kitchen"
        }
      ]
    },
    {
      "id": "cinema",
      "label": "Cinema",
      "step": "quiz",
      "substep": 2,
      "ask": "Da quale film?",
      "timerMs": 10000,
      "questions": [
        {
          "prompt": "«Io ne ho viste cose che voi umani non potreste immaginare…»"
        },
        {
          "prompt": "«A differenza degli altri Robin Hood, io parlo con accento inglese.»"
        },
        {
          "prompt": "«Dimmi qualcosa.»\n«Qualcosa.»"
        },
        {
          "prompt": "«Wilson!»"
        },
        {
          "prompt": "«Apri la porta, HAL.»"
        },
        {
          "prompt": "«Non c'è gene per lo spirito umano.»"
        },
        {
          "prompt": "«Non esiste il cucchiaio.»"
        },
        {
          "prompt": "«Incontrami a Montauk.»"
        },
        {
          "prompt": "«Perché indossi quello stupido costume da uomo?»"
        },
        {
          "prompt": "«Il Drugo resta.»"
        }
      ]
    },
    {
      "id": "finalissima",
      "label": "Finalissima",
      "step": "finalissima",
      "substep": null,
      "ask": null,
      "timerMs": null,
      "pickByNumber": true,
      "questions": [
        {
          "prompt": "Dove è stato trovato Marino, il mio gatto?",
          "category": "Personale"
        },
        {
          "prompt": "Quando è il mio compleanno?",
          "category": "Personale"
        },
        {
          "prompt": "Qual è stato il mio ultimo viaggio?",
          "category": "Personale"
        },
        {
          "prompt": "Qual è il mio colore naturale di capelli?",
          "category": "Personale"
        },
        {
          "prompt": "Come si chiama mio fratello?",
          "category": "Personale"
        },
        {
          "prompt": "In che anno cadde il Muro di Berlino?",
          "category": "Storia"
        },
        {
          "prompt": "Quale paese ha una foglia d'acero sulla bandiera?",
          "category": "Geografia"
        },
        {
          "prompt": "Qual è la moneta del Giappone?",
          "category": "Cultura generale"
        },
        {
          "prompt": "Quanti giocatori per squadra sono in campo nel calcio?",
          "category": "Sport"
        },
        {
          "prompt": "Qual è la capitale della Nuova Zelanda?",
          "category": "Geografia"
        },
        {
          "prompt": "Quale elemento chimico ha simbolo W?",
          "category": "Scienza"
        },
        {
          "prompt": "Quale pianeta impiega più tempo a ruotare su se stesso?",
          "category": "Scienza"
        },
        {
          "prompt": "Quale animale ha impronte digitali sorprendentemente simili a quelle umane?",
          "category": "Animali"
        },
        {
          "prompt": "Qual è indicativamente la vita media di una gallina domestica?",
          "category": "Animali"
        },
        {
          "prompt": "Qual è il deserto più grande del mondo?",
          "category": "Geografia"
        },
        {
          "prompt": "Quale fiume attraversa Budapest?",
          "category": "Geografia"
        },
        {
          "prompt": "Qual è l'osso più piccolo del corpo umano?",
          "category": "Corpo umano"
        },
        {
          "prompt": "Qual è l'unico continente attraversato sia dall'Equatore sia dal meridiano di Greenwich?",
          "category": "Geografia"
        },
        {
          "prompt": "Quale metallo è liquido a temperatura ambiente?",
          "category": "Scienza"
        },
        {
          "prompt": "Qual è la lingua con il maggior numero di madrelingua al mondo?",
          "category": "Lingue"
        }
      ]
    }
  ]
}$game$::jsonb
) on conflict (id) do update set title = excluded.title, content = excluded.content;

insert into game_secrets (game_id, content) values (
  'palestrati-vs-divanisti',
  $game${
  "steps": {
    "opening": {
      "script": "Benvenuti alla sfida definitiva: PALESTRATI contro DIVANISTI. Stasera non basterà essere intelligenti, creativi, atletici o coraggiosi: purtroppo per voi servirà tutto. Prima di cominciare, voglio un rappresentante per squadra. Avete pochissimo tempo per convincerci di una cosa: perché siete voi quelli che meritano di vincere?"
    },
    "quiz": {
      "script": "Cominciamo dalla testa. Tre round, trenta domande, dieci secondi per rispondere. Arte, letteratura e cinema. Qui non c'è tempo per consultarsi per mezz'ora: sapete la risposta o non la sapete. Pronti? Si parte.",
      "substepScripts": [
        null,
        null,
        null
      ]
    },
    "creativity": {
      "script": "Bene, la cultura è finita. Adesso vediamo se almeno sapete vendere qualcosa. Questa è la prova di creatività: dovrete trasformarvi in un'agenzia pubblicitaria e convincerci con la vostra pubblicità. Non mi interessa che sia elegante: mi interessa che sia memorabile. Avete il vostro tempo per prepararvi… e poi si va in scena.",
      "substepScripts": [
        null,
        null
      ]
    },
    "physical": {
      "script": "Finora avete usato il cervello e, più o meno, la creatività. Adesso basta parlare: è il momento di vedere come ve la cavate fisicamente. Questa non è una prova sola. È un TRIATHLON in tre round: equilibrio, combattimento e precisione. Quindi scegliete bene chi mandare in campo, perché essere forti non basterà.",
      "substepScripts": [
        "Prima prova: equilibrio. Il vostro peggior nemico sarà… un cuscino. Va tenuto sulla testa. Sembra facile finché non siete voi a doverlo fare. Pronti?",
        "Secondo round: SUMO. Dentro questo cerchio vale una sola regola fondamentale: restarci. Chi mette piede fuori perde. Quindi posizione, strategia… e cercate di conservare almeno un minimo di dignità.",
        "Ultima parte del triathlon: precisione. Niente scuse, niente forza bruta: avete le palline, avete il bersaglio. Vince chi centra di più. Via."
      ]
    },
    "courage": {
      "script": "Avete dimostrato quanto sapete, quanto siete creativi e quanto siete atletici. Adesso resta una domanda: quanto siete coraggiosi? Questa prova ha TRE LIVELLI. E la cosa bella è che saprete cosa vi aspetta… solo quando sarà troppo tardi per tirarvi indietro.",
      "substepScripts": [
        "Livello uno. Davanti a voi c'è una scatola. Non potete guardare dentro. Potete solo mettere la mano e scoprire cosa c'è… con il tatto. Vi consiglio di non fare troppe domande.",
        "Livello due. Vi togliamo una cosa abbastanza utile: la vista. Dovete andare dritti e raggiungere il traguardo il più velocemente possibile. Noi sappiamo dove state andando. Voi, decisamente meno.",
        "Siete arrivati al terzo e ultimo livello. Niente benda, niente scatola. Stavolta potete vedere perfettamente quello che vi aspetta… e forse era meglio di no. Signore e signori: NATTO. La prova finisce quando riuscite a mangiarlo."
      ]
    },
    "finalissima": {
      "script": "Siamo arrivati alla FINALISSIMA. Davanti a voi ci sono venti numeri e dietro ogni numero c'è una domanda. Scegliete il vostro numero e scoprite cosa vi è capitato. Qui non avete i dieci secondi del primo quiz: potete pensarci… ma non approfittate della mia pazienza. E attenzione: cinque domande riguardano me. Vediamo chi mi conosce davvero."
    },
    "proclamation": {
      "script": "Ci siamo. Dopo cultura, creatività, forza, coraggio e una finalissima senza pietà, abbiamo un risultato. La squadra vincitrice di PALESTRATI vs DIVANISTI è…"
    }
  },
  "answers": {
    "arte": [
      {
        "answer": "Caravaggio",
        "detail": "La Medusa"
      },
      {
        "answer": "Pablo Picasso",
        "detail": "Guernica"
      },
      {
        "answer": "Paul Gauguin",
        "detail": "Da dove veniamo? Chi siamo? Dove andiamo?"
      },
      {
        "answer": "René Magritte",
        "detail": "Il figlio dell'uomo"
      },
      {
        "answer": "Salvador Dalí",
        "detail": "La persistenza della memoria"
      },
      {
        "answer": "Leonardo da Vinci",
        "detail": "L'ultima cena"
      },
      {
        "answer": "Edgar Degas",
        "detail": "Il bevitore d'assenzio"
      },
      {
        "answer": "Marc Chagall",
        "detail": "Il compleanno"
      },
      {
        "answer": "Sandro Botticelli",
        "detail": "La nascita di Venere"
      },
      {
        "answer": "Edvard Munch",
        "detail": "L'urlo"
      }
    ],
    "libri": [
      {
        "answer": "Gabriel García Márquez"
      },
      {
        "answer": "José Saramago"
      },
      {
        "answer": "Italo Calvino"
      },
      {
        "answer": "Hermann Hesse"
      },
      {
        "answer": "Giovanni Verga"
      },
      {
        "answer": "Albert Camus"
      },
      {
        "answer": "Luigi Pirandello"
      },
      {
        "answer": "Stefano Benni"
      },
      {
        "answer": "Kazuo Ishiguro"
      },
      {
        "answer": "Banana Yoshimoto"
      }
    ],
    "cinema": [
      {
        "answer": "Blade Runner"
      },
      {
        "answer": "Robin Hood – Un uomo in calzamaglia"
      },
      {
        "answer": "Pulp Fiction"
      },
      {
        "answer": "Cast Away"
      },
      {
        "answer": "2001: Odissea nello spazio"
      },
      {
        "answer": "Gattaca"
      },
      {
        "answer": "Matrix"
      },
      {
        "answer": "Se mi lasci ti cancello"
      },
      {
        "answer": "Donnie Darko"
      },
      {
        "answer": "Il grande Lebowski"
      }
    ],
    "finalissima": [
      {
        "answer": null
      },
      {
        "answer": null
      },
      {
        "answer": "Budapest"
      },
      {
        "answer": null
      },
      {
        "answer": null
      },
      {
        "answer": "1989"
      },
      {
        "answer": "Canada"
      },
      {
        "answer": "Yen"
      },
      {
        "answer": "11"
      },
      {
        "answer": "Wellington"
      },
      {
        "answer": "Tungsteno"
      },
      {
        "answer": "Venere"
      },
      {
        "answer": "Koala"
      },
      {
        "answer": "Circa 5-10 anni"
      },
      {
        "answer": "Antartide"
      },
      {
        "answer": "Danubio"
      },
      {
        "answer": "La staffa"
      },
      {
        "answer": "Africa"
      },
      {
        "answer": "Mercurio"
      },
      {
        "answer": "Cinese mandarino"
      }
    ]
  }
}$game$::jsonb
) on conflict (game_id) do update set content = excluded.content;


-- Squadre → posti 'a' / 'b' -------------------------------------------------

alter table participants drop constraint participants_team_id_fkey;
alter table scores drop constraint scores_team_id_fkey;
alter table game_state drop constraint game_state_final_winner_team_id_fkey;
alter table game_state drop constraint game_state_draw_team_fkey;

insert into teams (id, name, sort_order) values ('a', 'Squadra A', 0), ('b', 'Squadra B', 1);

update participants set team_id = case team_id when 'palestrati' then 'a' else 'b' end;
update scores set team_id = case team_id when 'palestrati' then 'a' else 'b' end;
update game_state set
  final_winner_team_id = case final_winner_team_id when 'palestrati' then 'a' when 'divanisti' then 'b' end,
  draw_team = case draw_team when 'palestrati' then 'a' when 'divanisti' then 'b' end;

delete from teams where id in ('palestrati', 'divanisti');

alter table participants add constraint participants_team_id_fkey foreign key (team_id) references teams(id);
alter table scores add constraint scores_team_id_fkey foreign key (team_id) references teams(id);
alter table game_state add constraint game_state_final_winner_team_id_fkey
  foreign key (final_winner_team_id) references teams(id);
alter table game_state add constraint game_state_draw_team_fkey foreign key (draw_team) references teams(id);

alter table game_state rename column draw_gym_participant_id to draw_a_participant_id;
alter table game_state rename column draw_couch_participant_id to draw_b_participant_id;
alter table game_state rename column final_gym_score to final_a_score;
alter table game_state rename column final_couch_score to final_b_score;

-- Iscritti e punteggi per gioco -------------------------------------------

alter table participants add column game_id text references games(id) on delete cascade;
update participants set game_id = 'palestrati-vs-divanisti';
alter table participants alter column game_id set not null;
create index participants_game_id_idx on participants(game_id);

-- Le prove ora sono nel contenuto del gioco: la tabella challenges non serve più.
alter table scores drop constraint scores_challenge_id_fkey;
drop table challenges;

alter table scores add column game_id text references games(id) on delete cascade;
update scores set game_id = 'palestrati-vs-divanisti';
alter table scores alter column game_id set not null;
alter table scores drop constraint scores_pkey;
alter table scores add primary key (game_id, challenge_id, team_id);

-- Gioco attivo, risposta svelata, tabellone dei numeri ----------------------

alter table game_state add column game_id text references games(id);
update game_state set game_id = 'palestrati-vs-divanisti';
alter table game_state alter column game_id set not null;

-- step e set di domande ora dipendono dal gioco: via i vincoli della 0007
alter table game_state drop constraint if exists game_state_show_step_check;
alter table game_state drop constraint if exists game_state_question_set_check;

alter table game_state rename column finalissima_used to board_used;
alter table game_state
  add column question_answer_text text,
  add column question_answer_detail text;
