-- Palestrati vs Divanisti — Game Night
-- Core schema: teams, challenges, participants, scores, and a singleton
-- game_state row used to orchestrate the live experience.

create table teams (
  id text primary key,
  name text not null,
  sort_order smallint not null default 0
);

insert into teams (id, name, sort_order) values
  ('palestrati', 'Palestrati', 0),
  ('divanisti', 'Divanisti', 1);

create table challenges (
  id text primary key,
  name text not null,
  sort_order smallint not null default 0
);

insert into challenges (id, name, sort_order) values
  ('quiz', 'Quiz culturale', 0),
  ('creativity', 'Prova di creatività', 1),
  ('physical', 'Prova fisica', 2),
  ('courage', 'Prova di coraggio', 3),
  ('finalissima', 'La Finalissima', 4);

create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  team_id text not null references teams(id),
  brings_food boolean not null default false,
  brings_drink boolean not null default false,
  created_at timestamptz not null default now()
);

create index participants_team_id_idx on participants(team_id);

-- One row per (challenge, team); the grand total is always SUM(points),
-- never stored separately, so it can't drift out of sync.
create table scores (
  challenge_id text not null references challenges(id),
  team_id text not null references teams(id),
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (challenge_id, team_id)
);

insert into scores (challenge_id, team_id, points)
select c.id, t.id, 0 from challenges c cross join teams t;

-- Singleton row driving every screen's current phase. Timer/draw/reveal
-- fields store absolute timestamps so every connected client (phones, TV,
-- admin) derives an identical countdown independently, refresh-safe.
create table game_state (
  id smallint primary key default 1 check (id = 1),
  status text not null default 'REGISTRATION'
    check (status in ('REGISTRATION','GAME','TIMER','DRAW','FINAL_REVEAL','FINISHED')),

  timer_label text,
  timer_duration_ms integer,
  timer_phase text not null default 'idle' check (timer_phase in ('idle','active','paused')),
  timer_countdown_ends_at timestamptz,
  timer_ends_at timestamptz,
  timer_remaining_ms integer,
  timer_nonce integer not null default 0,

  draw_gym_participant_id uuid references participants(id) on delete set null,
  draw_couch_participant_id uuid references participants(id) on delete set null,
  draw_started_at timestamptz,
  draw_nonce integer not null default 0,

  final_started_at timestamptz,
  final_gym_score integer,
  final_couch_score integer,
  final_winner_team_id text references teams(id),
  final_is_draw boolean not null default false,
  final_nonce integer not null default 0,

  updated_at timestamptz not null default now()
);

insert into game_state (id) values (1);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

create trigger game_state_set_updated_at
  before update on game_state
  for each row execute function set_updated_at();

create trigger scores_set_updated_at
  before update on scores
  for each row execute function set_updated_at();
