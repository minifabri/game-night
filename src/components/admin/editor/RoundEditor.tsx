"use client";

import { cn } from "@/lib/cn";
import { IconButton, ImageField, TextArea, TextField } from "@/components/admin/editor/fields";
import { moveItem, type PackQuestion, type PackSet } from "@/components/admin/editor/pack-ops";

/**
 * The questions of one round (or of the pick-a-number board): each is a text
 * or an image, with its answer (only the admin sees it until it's revealed).
 */
export function RoundEditor({
  gameId,
  set,
  onChange,
}: {
  gameId: string;
  set: PackSet;
  onChange: (fn: (set: PackSet) => void) => void;
}) {
  const board = set.pickByNumber === true;

  function updateQuestion(index: number, fn: (q: PackQuestion) => void) {
    onChange((s) => fn(s.questions[index]));
  }

  return (
    <div className="flex flex-col gap-3">
      {!board && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <TextField
            label="Domanda sopra ogni item"
            hint="facoltativa"
            value={set.ask ?? ""}
            placeholder="Es. Chi l'ha dipinto?"
            onChange={(v) => onChange((s) => void (s.ask = v.trim() ? v : null))}
          />
          <TextField
            label="Secondi per rispondere"
            hint="vuoto = nessun timer"
            value={set.timerMs ? String(set.timerMs / 1000) : ""}
            placeholder="10"
            onChange={(v) =>
              onChange((s) => {
                const seconds = Number(v.replace(/[^0-9]/g, ""));
                s.timerMs = seconds > 0 ? Math.max(1, Math.min(600, seconds)) * 1000 : null;
              })
            }
            className="sm:w-44"
          />
        </div>
      )}

      {set.questions.length === 0 && (
        <p className="font-sans text-xs italic text-ink-dim">Ancora nessuna domanda.</p>
      )}

      <ol className="flex flex-col gap-3">
        {set.questions.map((q, i) => {
          const isImage = q.image !== undefined;
          return (
            <li key={i} className="rounded-xl border border-ink-dim/20 bg-void/40 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-numeric text-lg text-gold-300">{board ? `N° ${i + 1}` : i + 1}</span>
                <div className="ml-2 flex rounded-lg bg-plum-900/70 p-0.5">
                  {(["text", "image"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={(kind === "image") === isImage}
                      onClick={() =>
                        updateQuestion(i, (x) => {
                          if (kind === "image") {
                            x.image = x.image ?? "";
                            x.prompt = undefined;
                          } else {
                            x.image = undefined;
                            x.prompt = x.prompt ?? "";
                          }
                        })
                      }
                      className={cn(
                        "rounded-md px-2.5 py-1 font-sans text-xs",
                        (kind === "image") === isImage ? "bg-gold-400 text-void" : "text-ink-dim"
                      )}
                    >
                      {kind === "text" ? "Testo" : "Immagine"}
                    </button>
                  ))}
                </div>
                <span className="flex-1" />
                <IconButton label="Sposta su" disabled={i === 0} onClick={() => onChange((s) => void (s.questions = moveItem(s.questions, i, -1)))}>
                  ↑
                </IconButton>
                <IconButton
                  label="Sposta giù"
                  disabled={i === set.questions.length - 1}
                  onClick={() => onChange((s) => void (s.questions = moveItem(s.questions, i, 1)))}
                >
                  ↓
                </IconButton>
                <IconButton label="Elimina domanda" danger onClick={() => onChange((s) => void s.questions.splice(i, 1))}>
                  ×
                </IconButton>
              </div>

              <div className="flex flex-col gap-3">
                {board && (
                  <TextField
                    label="Categoria"
                    hint="facoltativa"
                    value={q.category}
                    placeholder="Es. Geografia"
                    onChange={(v) => updateQuestion(i, (x) => void (x.category = v.trim() ? v : undefined))}
                  />
                )}
                {isImage ? (
                  <ImageField
                    gameId={gameId}
                    label="Immagine (sul display si vede solo questa)"
                    value={q.image || undefined}
                    onChange={(url) => updateQuestion(i, (x) => void (x.image = url ?? ""))}
                  />
                ) : (
                  <TextArea
                    label="Testo a schermo"
                    rows={2}
                    value={q.prompt}
                    placeholder="La domanda, il titolo, la frase del film…"
                    onChange={(v) => updateQuestion(i, (x) => void (x.prompt = v))}
                  />
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Risposta"
                    value={q.answer ?? ""}
                    placeholder={q.answer === null ? "La sai solo tu" : ""}
                    onChange={(v) => updateQuestion(i, (x) => void (x.answer = v))}
                  />
                  <TextField
                    label="Dettaglio con la risposta"
                    hint="facoltativo"
                    value={q.detail}
                    placeholder={isImage ? "Es. il titolo dell'opera" : ""}
                    onChange={(v) => updateQuestion(i, (x) => void (x.detail = v.trim() ? v : undefined))}
                  />
                </div>
                <label className="flex items-center gap-2 font-sans text-xs text-ink-dim">
                  <input
                    type="checkbox"
                    checked={q.answer === null}
                    onChange={(e) => updateQuestion(i, (x) => void (x.answer = e.target.checked ? null : ""))}
                  />
                  La risposta la so solo io (sul display compare «Ve la dice chi conduce!»)
                </label>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => onChange((s) => void s.questions.push({ prompt: "", answer: "" }))}
        className="rounded-xl border border-dashed border-ink-dim/30 py-2.5 font-sans text-sm text-cream hover:border-gold-400/70"
      >
        + Aggiungi {board ? "numero" : "domanda"}
      </button>
    </div>
  );
}
