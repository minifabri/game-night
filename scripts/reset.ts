// Dev helper: wipe the active game's participants and scores and put it back
// to REGISTRATION. Other (archived) games are left alone.
// Usage: npm run reset-data
import { LIVE_STATE_RESET } from "../src/lib/constants.ts";
import { getAdminClient, getActiveGame } from "./lib.ts";

async function main() {
  const supabase = getAdminClient();
  const { gameId } = await getActiveGame(supabase);

  // game_state points at drawn participants: clear it before deleting them.
  const { error } = await supabase
    .from("game_state")
    .update({ ...LIVE_STATE_RESET, status: "REGISTRATION" })
    .eq("id", 1);
  if (error) throw error;

  await supabase.from("participants").delete().eq("game_id", gameId);
  await supabase.from("scores").delete().eq("game_id", gameId);

  console.log(`Data reset for ${gameId}: no participants, no scores, status REGISTRATION.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
