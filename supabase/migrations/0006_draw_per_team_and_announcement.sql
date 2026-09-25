-- Estrazione separata per squadra: each team is drawn on its own.
-- `draw_team` says which team the current DRAW screen is showing.

alter table game_state
  add column draw_team text references teams(id);

-- Messaggio a schermo: free text (game instructions, announcements…) the admin
-- shows on every screen on top of whatever phase is running, without pausing
-- the game. NULL means nothing is shown.

alter table game_state
  add column announcement_message text check (char_length(announcement_message) <= 600);
