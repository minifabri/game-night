"use client";

import { useState, useTransition } from "react";
import { hideAnnouncement, showAnnouncement } from "@/lib/actions/admin";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import type { GameState } from "@/lib/types";

const MAX_LENGTH = 600;

export function AnnouncementPanel({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const live = gameState.announcement_message;

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  return (
    <Panel title="Messaggio a schermo">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Una scritta che compare su TV e telefoni sopra a tutto (istruzioni di gioco, annunci…), senza
        mettere in pausa il gioco.
      </p>

      {live && (
        <div className="mb-3 rounded-xl border border-gold-400/40 bg-gold-400/5 p-3">
          <p className="mb-1 font-sans text-[0.65rem] uppercase tracking-[0.25em] text-gold-400">Ora a schermo</p>
          <p className="whitespace-pre-line font-sans text-sm text-cream">{live}</p>
        </div>
      )}

      <textarea
        value={draft}
        maxLength={MAX_LENGTH}
        rows={4}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Es. Prova di coraggio: ogni squadra sceglie un campione…"
        className="w-full resize-y rounded-xl border border-ink-dim/25 bg-transparent px-3 py-2 font-sans text-sm text-cream outline-none placeholder:text-ink-dim/60 focus:border-gold-400"
      />
      <p className="mb-3 text-right font-sans text-[0.65rem] text-ink-dim">
        {draft.length}/{MAX_LENGTH}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="md"
          disabled={pending || draft.trim().length === 0 || draft.trim() === live}
          onClick={() => run(() => showAnnouncement({ message: draft }))}
        >
          {live ? "Sostituisci" : "Mostra"}
        </Button>
        <Button size="md" variant="danger" disabled={pending || !live} onClick={() => run(hideAnnouncement)}>
          Togli
        </Button>
      </div>
      {live && (
        <Button
          size="md"
          variant="ghost"
          disabled={pending}
          onClick={() => setDraft(live)}
          className="mt-2 w-full"
        >
          Modifica il messaggio attuale
        </Button>
      )}

      {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}
    </Panel>
  );
}
