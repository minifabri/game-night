"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RegistrationWizard } from "@/components/participant/RegistrationWizard";
import { GameStage } from "@/components/stage/GameStage";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { ActiveGameProvider, useActiveGame } from "@/components/game/ActiveGameProvider";

const STORAGE_KEY = "gn_participant_id";

type Status = "checking" | "wizard" | "registered";

export default function ParticipantPage() {
  return (
    <ActiveGameProvider>
      <ParticipantApp />
    </ActiveGameProvider>
  );
}

function ParticipantApp() {
  const { game, loading, error } = useActiveGame();
  const gameId = game?.id ?? null;
  const [checked, setChecked] = useState<{ gameId: string; status: Status } | null>(null);

  // A registration only counts for the game it was made in: when the admin
  // switches game, phones go back to the wizard.
  useEffect(() => {
    if (!gameId) return;
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setChecked({ gameId, status: "wizard" });
      return;
    }

    let active = true;
    getSupabaseBrowserClient()
      .from("participants")
      .select("id")
      .eq("id", storedId)
      .eq("game_id", gameId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data) localStorage.removeItem(STORAGE_KEY);
        setChecked({ gameId, status: data ? "registered" : "wizard" });
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  function handleRegistered(participantId: string) {
    localStorage.setItem(STORAGE_KEY, participantId);
    if (gameId) setChecked({ gameId, status: "registered" });
  }

  if (error) return <StatusScreen kind="error" />;
  if (loading || !gameId || checked?.gameId !== gameId) return <StatusScreen kind="loading" />;
  if (checked.status === "wizard") return <RegistrationWizard onRegistered={handleRegistered} />;
  return <GameStage variant="phone" isCanonical={false} />;
}
