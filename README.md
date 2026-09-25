# Palestrati vs Divanisti — Game Night

Web app per una serata a squadre: registrazione partecipanti da telefono, scoreboard live pensata per la TV, e un pannello admin per condurre la serata (punteggi, timer, estrazioni, reveal finale).

Tre esperienze, tre route:

- **`/`** — partecipante: wizard di registrazione guidato, poi scoreboard live sullo stesso telefono.
- **`/display`** — scoreboard pubblica, pensata per essere proiettata su una TV (16:9, landscape).
- **`/admin`** — regia della serata, protetta da password condivisa.

## Architettura

- **Next.js 15 (App Router) + TypeScript + Tailwind v4** per UI e routing.
- **Supabase (Postgres + Realtime)** come unico backend: niente server custom, niente WebSocket da gestire a mano.
- **Server Actions** (`src/lib/actions/*.ts`) per ogni scrittura: usano un client Supabase server-only con la `service_role` key, che bypassa la Row Level Security. Il browser usa invece la `anon` key, che ha accesso in **sola lettura** (vedi sotto).
- **Realtime**: ogni schermata (partecipante, display, admin) apre una subscription Postgres Changes su `game_state`, `participants`, `scores`. Qualsiasi scrittura fatta dall'admin arriva a tutti i client connessi senza refresh.
- **Stato derivato dal tempo, non da timer lato server**: countdown, timer, estrazione e reveal finale salvano solo timestamp assoluti (es. `timer_ends_at`). Ogni client calcola in autonomia "quanto manca" a partire da quei timestamp, quindi restano sincronizzati anche tra dispositivi diversi e sopravvivono a un refresh. La TV (`/display`) è l'unico client "canonico": è lei a richiamare le server action che chiudono una sequenza transitoria (timer scaduto, estrazione mostrata abbastanza, reveal finale concluso) e a far tornare tutti sulla scoreboard — quelle action riverificano comunque i timestamp lato server, quindi nessun client può forzare una chiusura anticipata.
- **Autenticazione admin "semplice"**: una password condivisa (`ADMIN_PASSWORD`) protegge `/admin`. Il login imposta un cookie `httpOnly` con l'hash della password; niente tabella utenti, niente Supabase Auth — volutamente minimale per una serata privata.
- **Animazioni**: Framer Motion per transizioni tra step, cambio punteggi, countdown, sorteggio e reveal finale.

### Perché niente totale salvato

Il punteggio totale di ogni squadra non è mai salvato: è sempre `SUM(points)` calcolato al volo dalla tabella `scores`. Meno stato da tenere sincronizzato, zero rischio che il totale diverga dalle singole prove.

## Schema database

```
teams          (id, name, sort_order)                     — 'palestrati' | 'divanisti', seed fisso
challenges     (id, name, sort_order)                      — le 5 prove, seed fisso
participants   (id, name, team_id, brings_food, brings_drink, created_at)
scores         (challenge_id, team_id, points, updated_at) — PK composita, una riga per prova×squadra
game_state     (id=1, status, campi timer_*, draw_*, final_*, pause_*, announcement_message, show_*, question_*, finalissima_used, updated_at) — riga singola (singleton)
sounds         (id, name, kind 'music'|'sfx', url, storage_path, created_at) — libreria della console audio
audio_state    (id=1, music_*, sfx_*, stop_nonce, muted, auto_enabled, auto_map) — comandi audio (singleton)
```

`game_state` è una riga sola e guida l'intera esperienza pubblica tramite `status`:

```
REGISTRATION → GAME → TIMER → DRAW → FINAL_REVEAL → FINISHED
                 ↑_______________|
        (timer/estrazione tornano a GAME da soli)

GAME / TIMER ⇄ PAUSED   (pausa manuale dall'admin; un timer in corso viene congelato e riparte alla ripresa)
```

**Estrazione per squadra**: "Estrai Palestrato" ed "Estrai Divanista" sono indipendenti (si può estrarre anche una sola squadra). `draw_team` dice quale squadra è a schermo e la scena mostra solo quella. Il nome estratto resta a schermo fino a "Torna al tabellone" dall'admin (o, al massimo, 5 minuti); da lì si può anche estrarre subito l'altra squadra.

**Messaggio a schermo**: `announcement_message` non è uno stato ma un overlay: quando è valorizzato, TV e telefoni mostrano la scritta sopra qualunque scena (la scena sotto continua, es. un timer). "Togli" lo rimette a `NULL`.

**Scaletta e domande a schermo**: la scaletta della serata (Apertura → Quiz → Pubblicità → Triathlon → Coraggio → Classifica pre-finale → Finalissima → Proclamazione) e tutte le domande sono in `src/lib/show.ts`. Dal pannello admin «Scaletta della serata» ogni step si avvia con un tap: su TV e telefoni compare la sua scheda a tutto schermo e lo step resta illuminato nella barra degli step, anche tornando al tabellone. Gli step con sotto-prove (round del quiz, prove del triathlon, livelli di coraggio — questi restano coperti finché non ci si arriva) si scorrono dallo stesso pannello, che mostra anche i testi "da dire". Dal pannello «Domande a schermo» si manda una domanda sul display e si va avanti/indietro: i quadri mostrano **solo l'immagine** (file in `public/quiz/arte/`, vedi `LEGGIMI.md` lì), il quiz fa partire da solo 10 secondi, la risposta compare solo con «Mostra risposta». La Finalissima mostra il tabellone dei 20 numeri: il numero scelto va a schermo e si spegne. Tutto vive nelle colonne `show_*` / `question_*` / `finalissima_used` di `game_state` (migration `0007`) e viene mostrato solo quando lo stato è `GAME`: timer, estrazione e pausa hanno la precedenza.

Le migration SQL sono in `supabase/migrations/` (schema, RLS, realtime) — vedi [Setup database](#setup-database).

## Sicurezza / RLS

Tutte le tabelle hanno **Row Level Security** attiva con una sola policy: lettura pubblica (`select using (true)`). Nessuna policy di scrittura per `anon`/`authenticated`: tutte le scritture passano dalle Server Action con la `service_role` key, che bypassa RLS. Questo significa che la `anon` key — che finisce comunque nel bundle del browser, è normale — non può mai essere usata per modificare punteggi o stato del gioco, nemmeno da chi la trova nel network tab.

## Console audio

L'audio esce **solo dalla TV** (`/display`): i telefoni dei partecipanti restano muti. L'admin comanda tutto dal pannello "Console audio":

- **Colonna sonora**: tracce in loop con play/pausa/stop, volume dedicato. La musica si abbassa da sola (ducking) quando parte un effetto.
- **Pad effetti**: un tap e l'effetto parte sulla TV (oppure "Anteprima qui" per sentirlo solo sul telefono dell'admin). "Stop tutto" e "Muto" per le emergenze.
- **Effetti automatici** sulle azioni di gioco: avvio gioco, countdown 3-2-1, partenza timer, ultimi 5 secondi, time out, estrazione (shuffle + reveal), assegnazione punti, suspense finale, vincita/pareggio, pausa/ripresa. Di default usano effetti **sintetizzati con la Web Audio API** (nessun file necessario); ogni evento si può riassegnare a un suono della libreria o disattivare.
- **Libreria**: upload di file audio (bucket Supabase Storage `sounds`, pubblico, max 50 MB, caricati dal browser con un signed upload URL generato da una server action admin) oppure link diretto a un mp3.
- **Catalogo Ciao Darwin**: la lista dei suoni del programma da procurarsi (sigla "Matti", Adiemus/Madre Natura, Genodrome, cilindroni, Laurenti…), con link di ricerca e un pulsante per assegnarli all'evento automatico adatto. I clip già raccolti per la serata sono in `public/sounds/ciao-darwin/` e registrati nella tabella `sounds` con URL relativi (es. `/sounds/ciao-darwin/no-no-no.mp3`), quindi vengono serviti dal deploy stesso; gli altri si caricano dalla console. Sono clip protetti da copyright, tenuti qui solo per uso privato alla festa.

Come per il resto, lo stato vive in una riga singleton (`audio_state`) scritta solo dalle server action e propagata via Realtime; la TV la traduce in suono. Gli effetti automatici sono ricavati dagli stessi timestamp delle scene, quindi partono in sincrono con quello che si vede — e non partono per uno stato già in corso quando la pagina viene caricata.

> **Autoplay**: i browser bloccano l'audio finché non c'è un'interazione. Sulla TV compare "Tocca per attivare l'audio": basta un click/tap (o un tasto del telecomando) una volta dopo aver aperto `/display`.

## Setup locale

Requisiti: Node.js ≥ 22.6 (usa `--experimental-strip-types` per gli script di dev), un progetto Supabase.

```bash
npm install
cp .env.local.example .env.local   # poi compila le variabili, vedi sotto
npm run dev                        # http://localhost:3000
```

## Variabili d'ambiente

| Variabile | Dove si trova | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | pubblica |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | pubblica, sola lettura grazie a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API ("service_role") | **segreta**, solo server, bypassa RLS |
| `ADMIN_PASSWORD` | a tua scelta | password condivisa per `/admin` |
| `NEXT_PUBLIC_DEV_MODE` | `true` in locale, assente/`false` in produzione | mostra il pulsante "Reset totale dati" nell'admin |

## Setup database

1. Crea un progetto Supabase (o riusa uno esistente — consigliato uno dedicato).
2. Esegui le migration in `supabase/migrations/` in ordine, con [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started):
   ```bash
   supabase link --project-ref <il-tuo-project-ref>
   supabase db push
   ```
   In alternativa incolla il contenuto dei file, in ordine, nell'SQL Editor della dashboard.
3. In **Settings → API** copia URL, `anon` key e `service_role` key in `.env.local`.

Le migration fanno anche il seed dei dati fissi (le 2 squadre, le 5 prove, i punteggi a 0) e abilitano la realtime publication sulle tabelle che devono propagare i cambiamenti.

## Comandi di sviluppo

```bash
npm run dev          # server di sviluppo
npm run lint          # ESLint
npx tsc --noEmit      # type-check
npm run seed          # popola partecipanti finti + punteggi casuali, utile per provare la UI
npm run reset-data    # svuota partecipanti, azzera punteggi, stato → REGISTRATION
```

`seed`/`reset-data` sono script Node standalone (`scripts/`) che usano `SUPABASE_SERVICE_ROLE_KEY` direttamente — utili anche senza passare dall'admin.

## Build

```bash
npm run build
npm run start
```

## Deploy

Pensata per **Vercel** (zero config oltre alle env var):

1. Importa il repo su Vercel.
2. Imposta le variabili d'ambiente della tabella sopra (con `NEXT_PUBLIC_DEV_MODE` assente o `false`).
3. Deploy. `/display` va aperto sul browser della TV (o su un Chromecast/mini-PC collegato), `/admin` dal telefono di chi conduce la serata.

Va bene anche qualunque altro host Node.js (Next.js standalone output), dato che l'app non usa funzionalità specifiche di Vercel a parte l'hosting stesso.

## Verifica prima della serata

Checklist consigliata, da fare con `/`, `/display` e `/admin` aperti insieme (anche solo su due finestre del browser):

- [ ] Registrazione: tutti gli step, nome vuoto bloccato, squadra obbligatoria, almeno una scelta tra mangiare/bere.
- [ ] La sala d'attesa mostra i nomi giusti nella squadra giusta, contatori corretti, senza punteggi.
- [ ] "Avvia gioco" dall'admin fa passare `/` e `/display` alla scoreboard **senza refresh**.
- [ ] Modificare un punteggio nell'admin aggiorna `/display` in tempo reale, con l'animazione del numero.
- [ ] Ogni preset del timer (5s, 10s, 30s, 1m, 3m, 5m) e il timer personalizzato: countdown 3-2-1 → timer grande → TIME OUT che resta a schermo finché non premi "Torna al tabellone" (ritorno automatico solo dopo 5 minuti).
- [ ] Pausa / Riprendi mantengono il tempo corretto; "Torna al tabellone" ferma il timer e torna subito alla scoreboard; Reset ricarica lo stesso preset pronto a ripartire.
- [ ] "Estrai Palestrato": a schermo solo i Palestrati, shuffle, reveal, il nome resta finché non premi "Torna al tabellone". Stesso per "Estrai Divanista", anche direttamente dalla schermata dell'altra estrazione.
- [ ] Estrazione di una squadra vuota: errore gestito, nessun crash.
- [ ] "Messaggio a schermo": Mostra / Sostituisci / Togli, anche durante un timer (il timer continua sotto e riappare quando il messaggio viene tolto).
- [ ] Scaletta: «Inizia: Apertura» dalla sala d'attesa avvia il gioco e mostra la scheda; «Avanti» accende lo step dopo nella barra; «Torna al tabellone» lascia lo step illuminato sopra la scoreboard; sotto-step del triathlon e del coraggio (quelli futuri coperti da «?»).
- [ ] Domande: un quadro mostra solo l'immagine (nessun file mancante segnalato in admin), countdown 10s con tic e buzzer, «Succ» dall'ultima di Arte passa a Libri, «Mostra risposta», «Togli dal display». Finalissima: tabellone dei 20 numeri, il numero scelto si spegne.
- [ ] "Termina gioco" chiede conferma, poi mostra la sequenza finale e il/la vincitore/vincitrice.
- [ ] Pareggio: azzera i punteggi delle due squadre e rilancia "Termina gioco" per vedere la schermata PAREGGIO dedicata.
- [ ] "Metti in pausa" (con e senza messaggio) dalla scoreboard e durante un timer: tutti gli schermi mostrano PAUSA; "Riprendi il gioco" torna dove si era e il timer riparte dal tempo rimasto.
- [ ] Audio: su `/display` tocca "Attiva l'audio", poi prova pad, musica (play/pausa/stop/loop/volume) e "Stop tutto" dalla console.
- [ ] Effetti automatici su countdown, ultimi 5 secondi, time out, estrazione, punti, finale e pausa; riassegna un evento a un suono caricato e verifica che cambi.
- [ ] `/` su viewport da telefono (verticale) e `/admin` sia da telefono che da desktop.
- [ ] `/display` a piena larghezza in orientamento landscape (16:9), leggibile da qualche metro di distanza.

> **Nota sull'ambiente in cui è stato sviluppato questo progetto**: la sandbox usata per questa build ha accesso di rete in uscita limitato a una allowlist e non può raggiungere l'host `*.supabase.co` del progetto (né via HTTPS né via WebSocket). Type-check, lint e `next build` sono stati eseguiti con successo, la UI statica è stata verificata visivamente con Playwright, e l'intera catena di scritture (registrazione, punteggi, timer con il controllo anti-anticipazione, estrazione, reveal finale, vincolo di integrità referenziale) è stata validata direttamente sul database via SQL. Non è stato però possibile eseguire un giro end-to-end nel browser con Supabase Realtime collegato: fai la checklist qui sopra come primo test reale, idealmente qualche giorno prima della serata.

## Struttura del progetto

```
src/
  app/                    # route: / (partecipante), /display, /admin
  components/
    brand/                # Wordmark
    ui/                   # Button, AnimatedNumber, ConfirmDialog, StatusScreen
    participant/steps/    # i 4 step della registrazione
    stage/                # GameStage + tutte le scene pubbliche (Scoreboard, Timer, Draw, FinalReveal…)
    admin/                # pannelli del pannello di regia
    audio/                # AudioDirector (riproduzione + effetti automatici), StageAudio
  hooks/                  # useGameState / useParticipants / useScores / useAudioState / useSounds (realtime) + useTick
  lib/
    actions/              # Server Actions (participant.ts, admin.ts, audio.ts)
    audio/                # catalogo suoni/eventi, sintetizzatore Web Audio, engine di riproduzione
    supabase/              # client browser (anon) e admin (service role)
    auth.ts, constants.ts, types.ts, format.ts, cn.ts
scripts/                  # seed.ts, reset.ts (CLI, service role key)
supabase/migrations/      # schema, RLS, realtime publication, pausa, audio, estrazione per squadra + messaggio a schermo, scaletta + domande
public/quiz/arte/         # le immagini dei quadri del quiz (da aggiungere, vedi LEGGIMI.md)
```
