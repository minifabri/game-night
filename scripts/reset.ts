// Dev helper: wipe participants, zero every score and put the game back to
// REGISTRATION. Usage: npm run reset-data
import { getAdminClient } from "./lib.ts";

async function main() {
  const supabase = getAdminClient();

  await supabase.from("participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("scores").update({ points: 0 }).in("team_id", ["palestrati", "divanisti"]);
  const { error } = await supabase
    .from("game_state")
    .update({
      status: "REGISTRATION",
      timer_label: null,
      timer_duration_ms: null,
      timer_phase: "idle",
      timer_countdown_ends_at: null,
      timer_ends_at: null,
      timer_remaining_ms: null,
      draw_gym_participant_id: null,
      draw_couch_participant_id: null,
      draw_started_at: null,
      final_started_at: null,
      final_gym_score: null,
      final_couch_score: null,
      final_winner_team_id: null,
      final_is_draw: false,
    })
    .eq("id", 1);
  if (error) throw error;

  console.log("Data reset: no participants, scores at 0, status REGISTRATION.");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
