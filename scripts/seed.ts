// Dev helper: populate sample participants and scores in the active game to
// quickly try the waiting room, scoreboard and admin UI without registering
// by hand. Usage: npm run seed
import { getAdminClient, getActiveGame } from "./lib.ts";

const A_NAMES = ["Marco", "Luca", "Sara", "Giulia", "Andrea", "Elena"];
const B_NAMES = ["Fabio", "Chiara", "Davide", "Martina", "Paolo", "Ilaria"];

async function main() {
  const supabase = getAdminClient();
  const { gameId, content } = await getActiveGame(supabase);

  const rows = [
    ...A_NAMES.map((name) => ({ name, team_id: "a" })),
    ...B_NAMES.map((name) => ({ name, team_id: "b" })),
  ].map((r) => {
    const food = Math.random() > 0.5;
    return { ...r, game_id: gameId, brings_food: food, brings_drink: !food || Math.random() > 0.5 };
  });

  const { error: pError } = await supabase.from("participants").insert(rows);
  if (pError) throw pError;
  console.log(`Inserted ${rows.length} participants in ${gameId}.`);

  const scores = content.challenges.flatMap((c) =>
    (["a", "b"] as const).map((team) => ({
      game_id: gameId,
      challenge_id: c.id,
      team_id: team,
      points: Math.floor(Math.random() * 10),
    }))
  );
  const { error: sError } = await supabase
    .from("scores")
    .upsert(scores, { onConflict: "game_id,challenge_id,team_id" });
  if (sError) throw sError;
  console.log("Randomized scores for every challenge.");

  const { error: gError } = await supabase.from("game_state").update({ status: "GAME" }).eq("id", 1);
  if (gError) throw gError;
  console.log("Game status set to GAME.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
