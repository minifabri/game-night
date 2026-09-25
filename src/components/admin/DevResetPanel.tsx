"use client";

import { useState, useTransition } from "react";
import { resetGameData } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** Only rendered when NEXT_PUBLIC_DEV_MODE=true — wipes participants/scores/state for local testing. */
export function DevResetPanel() {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await resetGameData();
      setConfirmOpen(false);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Panel title="Dev mode" className="border-dashed">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Cancella partecipanti, azzera punteggi e riporta lo stato a REGISTRATION.
      </p>
      <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={pending}>
        Reset totale dati
      </Button>
      {error && <p className="mt-3 font-sans text-sm text-danger">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title="Reset totale?"
        description="Elimina tutti i partecipanti e azzera i punteggi. Solo per sviluppo."
        confirmLabel="Reset"
        pending={pending}
        onConfirm={run}
        onCancel={() => setConfirmOpen(false)}
      />
    </Panel>
  );
}
