-- Estrazione separata per squadra: the admin now draws one team at a time.
-- `draw_team` says which team the current DRAW run is shuffling; the other
-- team's pick (if any) stays on screen as the already-drawn opponent.
-- NULL means a legacy "both teams at once" draw.

alter table game_state
  add column draw_team text references teams(id);

-- Messaggio a schermo: free text (game instructions, announcements…) the admin
-- shows on every screen on top of whatever phase is running, without pausing
-- the game. NULL means nothing is shown.

alter table game_state
  add column announcement_message text check (char_length(announcement_message) <= 600);
