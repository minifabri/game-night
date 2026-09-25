"use client";

import { useState, useTransition } from "react";
import { resetScoresKeepParticipants } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** Azzera i punteggi e riporta il gioco a prima dell'inizio per rifare un test, senza toccare i partecipanti registrati. */
export function ResetScoresPanel() {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const result = await resetScoresKeepParticipants();
      setConfirmOpen(false);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Panel title="Reset punteggi" className="border-dashed">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Azzera tutti i punteggi e riporta il gioco a prima dell&apos;inizio, come se dovesse ancora
        partire. I partecipanti registrati non vengono toccati.
      </p>
      <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={pending}>
        Azzera punteggi
      </Button>
      {error && <p className="mt-3 font-sans text-sm text-gym">{error}</p>}
      <ConfirmDialog
        open={confirmOpen}
        title="Azzerare tutti i punteggi?"
        description="I punteggi torneranno a 0 e il gioco tornerà a prima dell'inizio, da far partire di nuovo. I partecipanti registrati non saranno toccati."
        confirmLabel="Azzera"
        pending={pending}
        onConfirm={run}
        onCancel={() => setConfirmOpen(false)}
      />
    </Panel>
  );
}
