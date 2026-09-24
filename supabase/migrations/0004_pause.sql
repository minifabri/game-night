-- "Gioco in pausa": a new PAUSED status the admin can toggle from GAME or
-- TIMER. We remember where we came from so resuming restores it, and whether
-- the pause froze a running timer so resuming can restart it automatically.

alter table game_state drop constraint if exists game_state_status_check;
alter table game_state add constraint game_state_status_check
  check (status in ('REGISTRATION','GAME','TIMER','DRAW','FINAL_REVEAL','FINISHED','PAUSED'));

alter table game_state
  add column pause_previous_status text
    check (pause_previous_status in ('GAME','TIMER')),
  add column pause_message text check (char_length(pause_message) <= 80),
  add column pause_resumes_timer boolean not null default false;
