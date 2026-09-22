// Dev helper: populate sample participants and scores to quickly try the
// waiting room, scoreboard and admin UI without registering by hand.
// Usage: npm run seed
import { getAdminClient } from "./lib.ts";
import { CHALLENGE_ORDER } from "../src/lib/constants.ts";

const GYM_NAMES = ["Marco", "Luca", "Sara", "Giulia", "Andrea", "Elena"];
const COUCH_NAMES = ["Fabio", "Chiara", "Davide", "Martina", "Paolo", "Ilaria"];

async function main() {
  const supabase = getAdminClient();

  const rows = [
    ...GYM_NAMES.map((name) => ({
      name,
      team_id: "palestrati",
      brings_food: Math.random() > 0.5,
      brings_drink: Math.random() > 0.5 || true,
    })),
    ...COUCH_NAMES.map((name) => ({
      name,
      team_id: "divanisti",
      brings_food: Math.random() > 0.5,
      brings_drink: Math.random() > 0.3,
    })),
  ].map((r) => ({ ...r, brings_drink: r.brings_food ? r.brings_drink : true }));

  const { error: pError } = await supabase.from("participants").insert(rows);
  if (pError) throw pError;
  console.log(`Inserted ${rows.length} participants.`);

  for (const challengeId of CHALLENGE_ORDER) {
    await supabase
      .from("scores")
      .update({ points: Math.floor(Math.random() * 10) })
      .eq("challenge_id", challengeId)
      .eq("team_id", "palestrati");
    await supabase
      .from("scores")
      .update({ points: Math.floor(Math.random() * 10) })
      .eq("challenge_id", challengeId)
      .eq("team_id", "divanisti");
  }
  console.log("Randomized scores for every challenge.");

  const { error: gError } = await supabase
    .from("game_state")
    .update({ status: "GAME" })
    .eq("id", 1);
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
