"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RegistrationWizard } from "@/components/participant/RegistrationWizard";
import { GameStage } from "@/components/stage/GameStage";
import { StatusScreen } from "@/components/ui/StatusScreen";

const STORAGE_KEY = "gn_participant_id";

type Status = "checking" | "wizard" | "registered";

export default function ParticipantPage() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!storedId) {
      setStatus("wizard");
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("participants")
      .select("id")
      .eq("id", storedId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          setStatus("registered");
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setStatus("wizard");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleRegistered(participantId: string) {
    localStorage.setItem(STORAGE_KEY, participantId);
    setStatus("registered");
  }

  if (status === "checking") return <StatusScreen kind="loading" />;
  if (status === "wizard") return <RegistrationWizard onRegistered={handleRegistered} />;
  return <GameStage variant="phone" isCanonical={false} />;
}
