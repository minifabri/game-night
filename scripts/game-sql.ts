// Prints the SQL that inserts/updates a game from its pack file, for when
// the service role key isn't at hand (paste it in the Supabase SQL Editor).
// Usage: npm run game:sql -- games/<id>.ts
import { readPack } from "./game-lib.ts";

const { id, title, content, secrets } = await readPack(process.argv[2]);

const tag = "$game$";
const lit = (value: unknown) => {
  const json = JSON.stringify(value, null, 2);
  if (json.includes(tag)) throw new Error("Il contenuto contiene il delimitatore SQL $game$.");
  return `${tag}${json}${tag}::jsonb`;
};
const text = (value: string) => `'${value.replaceAll("'", "''")}'`;

console.log(`insert into games (id, title, content) values (
  ${text(id)},
  ${text(title)},
  ${lit(content)}
) on conflict (id) do update set title = excluded.title, content = excluded.content;

insert into game_secrets (game_id, content) values (
  ${text(id)},
  ${lit(secrets)}
) on conflict (game_id) do update set content = excluded.content;`);
