"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { getGamePack, saveGamePack } from "@/lib/actions/games";
import { useGameState } from "@/hooks/useGameState";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Panel } from "@/components/admin/Panel";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { ColorField, ImageField, TextField } from "@/components/admin/editor/fields";
import { StepEditor } from "@/components/admin/editor/StepEditor";
import { normalizeForSave, type Pack } from "@/components/admin/editor/pack-ops";
import { PreviewModal } from "@/components/admin/preview/PreviewModal";
import { TEAM_ORDER } from "@/lib/constants";
import type { TeamId } from "@/lib/types";

/** The default team colours of globals.css, shown when a game has none. */
const DEFAULT_COLORS: Record<TeamId, string> = { a: "#ff6a45", b: "#57d3c8" };

/** Lighter shade for numbers and glows, derived from the team colour. */
function softOf(color: string): string {
  return `color-mix(in srgb, ${color} 55%, white)`;
}

/**
 * /admin/giochi/[id]/contenuti: everything that makes a game — title, poster,
 * teams, the texts of each step, sub-steps and their questions. Edits stay
 * local until "Salva", which validates the whole game on the server.
 */
export function GameEditor({ gameId }: { gameId: string }) {
  const [pack, setPackState] = useState<Pack | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ message: string; details?: string[] } | null>(null);
  const [pending, startTransition] = useTransition();
  /** Scene the preview opens on; null = preview closed. */
  const [preview, setPreview] = useState<string | null>(null);
  const { gameState } = useGameState();
  const onAir = gameState?.game_id === gameId;

  useEffect(() => {
    getGamePack({ gameId }).then((result) => {
      if (result.ok) setPackState(result.pack);
      else setLoadError(result.error);
    });
  }, [gameId]);

  // Don't lose unsaved edits to a stray back swipe.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function setPack(next: Pack) {
    setPackState(next);
    setDirty(true);
    setSaved(false);
  }

  function update(fn: (draft: Pack) => void) {
    if (!pack) return;
    const next = structuredClone(pack);
    fn(next);
    setPack(next);
  }

  function save() {
    if (!pack) return;
    setErrors(null);
    startTransition(async () => {
      const normalized = normalizeForSave(pack);
      const result = await saveGamePack(normalized);
      if (!result.ok) {
        setErrors({ message: result.error, details: "details" in result ? result.details : undefined });
        return;
      }
      setPackState(normalized);
      setDirty(false);
      setSaved(true);
    });
  }

  if (loadError) return <StatusScreen kind="error" message={loadError} />;
  if (!pack) return <StatusScreen kind="loading" />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 pb-40 pt-8 sm:px-6">
      <AdminHeader back={{ href: "/admin", label: "Giochi" }} title={pack.title || "Senza titolo"} subtitle="Contenuti" />

      {onAir && (
        <p className="rounded-xl border border-gold-400/40 bg-gold-400/5 px-4 py-3 font-sans text-sm text-cream">
          Questo gioco è in onda: quando salvi, le modifiche arrivano subito su TV e telefoni.{" "}
          <Link href={`/admin/giochi/${gameId}`} className="text-gold-300 underline underline-offset-4">
            Vai alla console
          </Link>
        </p>
      )}

      <Panel title="Identità">
        <div className="flex flex-col gap-3">
          <TextField label="Titolo" hint="nell'elenco dei giochi" maxLength={80} value={pack.title} onChange={(v) => update((p) => void (p.title = v))} />
          <TextField
            label="Sottotitolo"
            hint="sotto «Squadra A vs Squadra B»"
            value={pack.subtitle}
            onChange={(v) => update((p) => void (p.subtitle = v))}
          />
          <ImageField
            gameId={gameId}
            label="Poster (iscrizione e sala d'attesa)"
            aspect="aspect-[1024/450]"
            value={pack.heroImage}
            onChange={(url) => update((p) => void (p.heroImage = url))}
          />
        </div>
      </Panel>

      <Panel title="Squadre">
        <div className="grid gap-5 sm:grid-cols-2">
          {TEAM_ORDER.map((team) => {
            const t = pack.teams[team];
            return (
              <div key={team} className="flex flex-col gap-3">
                <p className="font-display text-lg font-medium" style={{ color: t.color ?? DEFAULT_COLORS[team] }}>
                  {t.name || `Squadra ${team.toUpperCase()}`}
                </p>
                <TextField label="Nome" hint="plurale" maxLength={30} value={t.name} onChange={(v) => update((p) => void (p.teams[team].name = v))} />
                <TextField
                  label="Un componente"
                  hint="singolare, per l'estrazione"
                  maxLength={30}
                  value={t.member}
                  onChange={(v) => update((p) => void (p.teams[team].member = v))}
                />
                <ColorField
                  label="Colore"
                  value={t.color}
                  fallback={DEFAULT_COLORS[team]}
                  onChange={(color) =>
                    update((p) => {
                      p.teams[team].color = color;
                      p.teams[team].colorSoft = color ? softOf(color) : undefined;
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-xs font-medium uppercase tracking-[0.3em] text-gold-400">Scaletta</h2>
        <p className="font-sans text-sm text-ink-dim">
          Tocca uno step per aprirlo. Nei giochi puoi aggiungere sotto-step e, in ognuno, un round di domande.
        </p>
        {pack.steps.map((step, i) => (
          <StepEditor
            key={step.id}
            gameId={gameId}
            pack={pack}
            step={step}
            index={i}
            setPack={setPack}
            onPreview={() => setPreview(`step:${step.id}`)}
          />
        ))}
      </section>

      {preview !== null && <PreviewModal pack={pack} startKey={preview} onClose={() => setPreview(null)} />}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-plum-700/80 bg-void/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {errors && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-danger/40 bg-danger/5 p-3 font-sans text-xs text-danger-soft">
              <p className="font-medium">{errors.message}</p>
              {errors.details && (
                <ul className="mt-1 list-disc pl-4">
                  {errors.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <p className="flex-1 font-sans text-xs text-ink-dim">
              {pending ? "Salvo…" : dirty ? "Modifiche non salvate" : saved ? "Salvato ✓" : "Nessuna modifica"}
            </p>
            <button
              type="button"
              onClick={() => setPreview("waiting")}
              className="rounded-full border border-ink-dim/30 px-5 py-3 font-sans text-sm text-cream hover:border-gold-400/70"
            >
              Anteprima
            </button>
            <button
              type="button"
              disabled={pending || !dirty}
              onClick={save}
              className="rounded-full bg-gold-400 px-8 py-3 font-sans text-sm font-medium text-void hover:bg-gold-300 disabled:opacity-40"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
