"use server";

import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TeamId } from "@/lib/types";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il tuo nome").max(60),
  teamId: z.enum(["palestrati", "divanisti"]),
  bringsFood: z.boolean(),
  bringsDrink: z.boolean(),
});

export interface RegisterParticipantInput {
  name: string;
  teamId: TeamId;
  bringsFood: boolean;
  bringsDrink: boolean;
}

export type RegisterParticipantResult =
  | { ok: true; participantId: string }
  | { ok: false; error: string };

export async function registerParticipant(
  input: RegisterParticipantInput
): Promise<RegisterParticipantResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }
  if (!parsed.data.bringsFood && !parsed.data.bringsDrink) {
    return { ok: false, error: "Scegli almeno una cosa da portare." };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("participants")
    .insert({
      name: parsed.data.name,
      team_id: parsed.data.teamId,
      brings_food: parsed.data.bringsFood,
      brings_drink: parsed.data.bringsDrink,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Registrazione non riuscita. Riprova." };
  }

  return { ok: true, participantId: data.id as string };
}
