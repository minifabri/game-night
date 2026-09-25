// Uploads a game from its pack file (games/<id>.ts) to the database: creates
// it, or updates its content if it already exists (participants and scores
// are kept). With --activate it also becomes the game being played.
// Usage: npm run game:load -- games/<id>.ts [--activate]
import { LIVE_STATE_RESET } from "../src/lib/constants.ts";
import { readPack } from "./game-lib.ts";
import { getAdminClient } from "./lib.ts";

const args = process.argv.slice(2);
const activate = args.includes("--activate");
const file = args.find((a) => !a.startsWith("--"));

async function main() {
  const { id, title, content, secrets } = await readPack(file);
  const supabase = getAdminClient();

  const { error } = await supabase.from("games").upsert({ id, title, content }, { onConflict: "id" });
  if (error) throw error;
  const { error: secretsError } = await supabase
    .from("game_secrets")
    .upsert({ game_id: id, content: secrets }, { onConflict: "game_id" });
  if (secretsError) throw secretsError;

  const questions = content.questionSets.reduce((n, s) => n + s.questions.length, 0);
  console.log(`Gioco «${title}» (${id}) caricato: ${content.steps.length} step, ${questions} domande.`);

  if (activate) {
    const { count } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("game_id", id);
    const { error: stateError } = await supabase
      .from("game_state")
      .update({ ...LIVE_STATE_RESET, game_id: id, status: count ? "GAME" : "REGISTRATION" })
      .eq("id", 1);
    if (stateError) throw stateError;
    console.log("Ora è il gioco attivo.");
  } else {
    console.log("Per giocarlo: «Attiva» nel pannello Giochi dell'admin (o rilancia con --activate).");
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
