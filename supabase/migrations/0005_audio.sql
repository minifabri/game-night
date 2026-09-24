-- Sound console: a library of uploaded soundtracks / sound effects plus a
-- singleton audio_state row the admin writes to and the TV (/display) plays
-- back over realtime. Same model as game_state: public read, writes only via
-- server actions with the service_role key.

create table sounds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  kind text not null check (kind in ('music','sfx')),
  url text not null,
  -- set when the file lives in our own storage bucket, so deleting the row
  -- can also delete the object
  storage_path text,
  created_at timestamptz not null default now()
);

create table audio_state (
  id smallint primary key default 1 check (id = 1),

  music_sound_id uuid references sounds(id) on delete set null,
  music_status text not null default 'stopped'
    check (music_status in ('playing','paused','stopped')),
  music_loop boolean not null default true,
  -- bumped whenever a track is (re)started from the beginning
  music_nonce integer not null default 0,
  music_volume real not null default 0.6 check (music_volume between 0 and 1),

  -- last one-shot effect fired from the console: 'builtin:<id>' or a sounds.id
  sfx_ref text,
  sfx_nonce integer not null default 0,
  sfx_volume real not null default 0.9 check (sfx_volume between 0 and 1),

  -- bumped by "Stop tutto" to cut every effect currently playing
  stop_nonce integer not null default 0,
  muted boolean not null default false,

  -- automatic effects on game events (countdown, draw, points, winner…)
  auto_enabled boolean not null default true,
  -- per-event overrides: { "<event>": "builtin:<id>" | "<sounds.id>" | "off" }
  auto_map jsonb not null default '{}'::jsonb,

  updated_at timestamptz not null default now()
);

insert into audio_state (id) values (1);

create trigger audio_state_set_updated_at
  before update on audio_state
  for each row execute function set_updated_at();

alter table sounds enable row level security;
alter table audio_state enable row level security;
create policy "public read sounds" on sounds for select using (true);
create policy "public read audio_state" on audio_state for select using (true);

alter publication supabase_realtime add table sounds;
alter publication supabase_realtime add table audio_state;

-- Public bucket for the audio files. Uploads go through signed upload URLs
-- minted by an admin-only server action, so no insert policy is needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sounds', 'sounds', true, 52428800, array['audio/*'])
on conflict (id) do nothing;
