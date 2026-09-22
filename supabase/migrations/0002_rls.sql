-- Every table is public-read (phones, TV display and admin all read
-- directly with the anon key over realtime). All writes go exclusively
-- through Next.js server actions using the service_role key, which bypasses
-- RLS entirely — so no insert/update/delete policy is defined for anon here
-- on purpose. Never add permissive write policies to this project.

alter table teams enable row level security;
alter table challenges enable row level security;
alter table participants enable row level security;
alter table scores enable row level security;
alter table game_state enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public read challenges" on challenges for select using (true);
create policy "public read participants" on participants for select using (true);
create policy "public read scores" on scores for select using (true);
create policy "public read game_state" on game_state for select using (true);
