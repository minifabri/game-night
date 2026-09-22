-- Broadcast changes on these tables to subscribed realtime clients.
alter publication supabase_realtime add table game_state;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table scores;
