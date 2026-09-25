-- Scaletta della serata + domande a schermo.
--
-- show_*: lo step della scaletta in corso (acceso nella barra degli step sul
-- display), il sotto-step (round del quiz, prova del triathlon, livello di
-- coraggio) e se la scheda dello step è a tutto schermo al posto del tabellone.
-- question_*: la domanda a schermo (set + indice nel catalogo in src/lib/show.ts),
-- se la risposta è svelata e quando scade il timer della domanda.
-- Come il resto di game_state: sola lettura pubblica, scritture solo via
-- server action con la service_role key.

alter table game_state
  add column show_step text check (show_step in
    ('opening','quiz','creativity','physical','courage','prefinal','finalissima','proclamation')),
  add column show_substep smallint check (show_substep >= 0),
  add column show_card boolean not null default false,
  add column show_nonce integer not null default 0,
  add column question_set text check (question_set in ('arte','libri','cinema','finalissima')),
  add column question_index smallint check (question_index >= 0),
  add column question_answer_visible boolean not null default false,
  add column question_timer_ends_at timestamptz,
  add column question_nonce integer not null default 0,
  -- numeri della Finalissima già scelti, spenti sul tabellone dei 20 numeri
  add column finalissima_used smallint[] not null default '{}';
