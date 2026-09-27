# Giochi

Ogni file qui è un gioco completo: squadre (nomi e colori), prove del tabellone, scaletta, domande, testi da dire e risposte. È la fonte da cui si carica il gioco nel database; una volta caricato, l'app legge tutto da lì.

- `palestrati-vs-divanisti.ts` — la prima serata (già inserita dalla migration `0008`).

## Creare un gioco nuovo

1. Copia `palestrati-vs-divanisti.ts` in `games/<id>.ts` (id: minuscole, numeri, trattini) e cambia i contenuti. Il formato è descritto e validato in `src/lib/game-pack.ts`; i campi principali:
   - `teams.a` / `teams.b`: `name` (plurale), `member` (singolare, per l'estrazione), `color`/`colorSoft` opzionali.
   - `challenges`: le righe del tabellone (`icon`: quiz, creativity, physical, courage, finalissima, star).
   - `steps`: la scaletta. `substeps` per round/prove/livelli, `secretSubsteps: true` per tenerli coperti finché non li sveli, `showTeams` / `showScoreboard` / `board` (id di un set «scegli un numero») per cosa mostra la scheda, `finale: true` sull'ultimo step, `script` per i testi da dire.
   - `questionSets`: `step` e `substep` che accende, `ask` (la domanda ripetuta sopra), `timerMs` (o `null`), `pickByNumber: true` per il tabellone dei numeri. Ogni domanda ha `prompt` e/o `image`, `answer` (`null` = la sa solo chi conduce) e `detail` opzionale.
   - `registration.bring`: se c'è, chi si iscrive sceglie cosa portare; se manca, lo step non compare.
   - `heroImage`: poster opzionale in `public/games/<id>/`.
2. Immagini in `public/games/<id>/`.
3. Carica: `npm run game:load -- games/<id>.ts` (con `--activate` diventa subito il gioco attivo; senza, lo attivi dal pannello «Giochi» dell'admin). Il comando valida il file e dice cosa non va. Si può rilanciare per aggiornare i contenuti: iscritti e punteggi restano.
   Senza la service role key in `.env.local`: `npm run game:sql -- games/<id>.ts` stampa l'SQL da incollare nell'SQL Editor di Supabase.

Testi da dire e risposte finiscono in `game_secrets`, che solo l'admin può leggere: dal telefono non si possono sbirciare.

## Rigiocare lo stesso gioco

Dal pannello «Giochi»: «Rigioca da capo» crea una copia senza iscritti né punti e la attiva; la partita di prima resta salvata ed è consultabile lì.
