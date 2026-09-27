-- Immagini dei giochi (poster, immagini delle domande) caricate dall'editor
-- dei contenuti in /admin. Bucket pubblico in lettura, come `sounds`: gli
-- upload passano da URL firmati creati da una server action admin, quindi non
-- serve nessuna policy di scrittura. Percorsi: <game_id>/<uuid>.<ext>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-assets', 'game-assets', true, 10485760, array['image/*'])
on conflict (id) do nothing;
