"use client";

import { IconButton, TextArea, TextField, Toggle } from "@/components/admin/editor/fields";
import { RoundEditor } from "@/components/admin/editor/RoundEditor";
import {
  addRound,
  addSubstep,
  boardOf,
  moveSubstep,
  removeSet,
  removeSubstep,
  roundOf,
  updateSet,
  type Pack,
  type PackStep,
} from "@/components/admin/editor/pack-ops";

/**
 * One step of the running order: its texts and, for the games, the name on
 * the scoreboard, the sub-steps (each optionally with a round of questions)
 * or the numbers board.
 */
export function StepEditor({
  gameId,
  pack,
  step,
  index,
  setPack,
  onPreview,
}: {
  gameId: string;
  pack: Pack;
  step: PackStep;
  index: number;
  setPack: (next: Pack) => void;
  /** Opens the display preview on this step's card. */
  onPreview: () => void;
}) {
  const board = boardOf(pack, step);
  const challenge = pack.challenges.find((c) => c.id === step.challengeId);
  const canHaveSubsteps = Boolean(step.challengeId) && !step.board;

  function updateStep(fn: (s: PackStep) => void) {
    const next = structuredClone(pack);
    fn(next.steps.find((s) => s.id === step.id)!);
    setPack(next);
  }

  return (
    <details className="group rounded-2xl border border-plum-700/60 bg-plum-900/40">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-400/50 font-numeric text-base text-gold-300">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-sans text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">{step.kicker}</span>
          <span className="block truncate font-sans text-sm font-medium text-cream">{step.title}</span>
        </span>
        <span className="font-sans text-xs text-ink-dim transition-transform group-open:rotate-180">▾</span>
      </summary>

      <div className="flex flex-col gap-4 border-t border-plum-700/60 p-4">
        <button
          type="button"
          onClick={onPreview}
          className="self-end rounded-full border border-ink-dim/30 px-3 py-1.5 font-sans text-xs text-cream hover:border-gold-400/70"
        >
          Vedi in anteprima
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Titolo" value={step.title} onChange={(v) => updateStep((s) => void (s.title = v))} />
          <TextField
            label="Sopra il titolo"
            hint="es. Gioco 1"
            value={step.kicker}
            onChange={(v) => updateStep((s) => void (s.kicker = v))}
          />
          <TextField
            label="Nome nella barra degli step"
            hint="max 16"
            maxLength={16}
            value={step.short}
            onChange={(v) => updateStep((s) => void (s.short = v))}
          />
          {challenge && (
            <TextField
              label="Nome sul tabellone"
              value={challenge.name}
              onChange={(v) => {
                const next = structuredClone(pack);
                next.challenges.find((c) => c.id === challenge.id)!.name = v;
                setPack(next);
              }}
            />
          )}
        </div>
        <TextField label="Sottotitolo sul display" value={step.tagline} onChange={(v) => updateStep((s) => void (s.tagline = v))} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Orario" hint="solo per te" value={step.time} placeholder="21:00" onChange={(v) => updateStep((s) => void (s.time = v || undefined))} />
          <TextField label="Durata" hint="solo per te" value={step.duration} placeholder="15 min" onChange={(v) => updateStep((s) => void (s.duration = v || undefined))} />
        </div>
        <TextArea
          label="Da dire"
          hint="lo vedi solo tu in console"
          rows={3}
          value={step.script}
          onChange={(v) => updateStep((s) => void (s.script = v.trim() ? v : undefined))}
        />

        {board && (
          <section className="flex flex-col gap-3">
            <h3 className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-gold-400">
              Tabellone dei numeri
            </h3>
            <p className="font-sans text-xs text-ink-dim">
              I concorrenti scelgono un numero: ogni numero è una domanda.
            </p>
            <RoundEditor gameId={gameId} set={board} onChange={(fn) => setPack(updateSet(pack, board.id, fn))} />
          </section>
        )}

        {canHaveSubsteps && (
          <section className="flex flex-col gap-3">
            <h3 className="font-sans text-xs font-medium uppercase tracking-[0.25em] text-gold-400">Sotto-step</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Come si chiamano"
                hint="es. Round, Livello"
                value={step.substepLabel}
                onChange={(v) => updateStep((s) => void (s.substepLabel = v || undefined))}
              />
              <Toggle
                label="A sorpresa"
                hint="sul display restano «?» finché non li sveli"
                checked={step.secretSubsteps === true}
                onChange={(v) => updateStep((s) => void (s.secretSubsteps = v || undefined))}
              />
            </div>

            {(step.substeps ?? []).map((sub, i) => {
              const round = roundOf(pack, step.id, i);
              const count = step.substeps?.length ?? 0;
              return (
                <div key={i} className="rounded-xl border border-ink-dim/20 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold-300">
                      {step.substepLabel || "Parte"} {i + 1}
                    </span>
                    <span className="flex-1" />
                    <IconButton label="Sposta su" disabled={i === 0} onClick={() => setPack(moveSubstep(pack, step.id, i, -1))}>
                      ↑
                    </IconButton>
                    <IconButton label="Sposta giù" disabled={i === count - 1} onClick={() => setPack(moveSubstep(pack, step.id, i, 1))}>
                      ↓
                    </IconButton>
                    <IconButton
                      label="Elimina sotto-step"
                      danger
                      onClick={() => {
                        const n = round?.questions.length ?? 0;
                        if (n > 0 && !window.confirm(`Eliminare «${sub.title}» e le sue ${n} domande?`)) return;
                        setPack(removeSubstep(pack, step.id, i));
                      }}
                    >
                      ×
                    </IconButton>
                  </div>
                  <div className="flex flex-col gap-3">
                    <TextField label="Titolo" value={sub.title} onChange={(v) => updateStep((s) => void (s.substeps![i].title = v))} />
                    <TextArea
                      label="Regola sul display"
                      rows={2}
                      value={sub.description}
                      onChange={(v) => updateStep((s) => void (s.substeps![i].description = v))}
                    />
                    <TextArea
                      label="Lancio"
                      hint="lo vedi solo tu"
                      rows={2}
                      value={sub.script}
                      onChange={(v) => updateStep((s) => void (s.substeps![i].script = v.trim() ? v : undefined))}
                    />

                    {round ? (
                      <div className="rounded-xl bg-plum-900/50 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-400">Domande</p>
                          <button
                            type="button"
                            onClick={() => {
                              const n = round.questions.length;
                              if (n > 0 && !window.confirm(`Togliere le ${n} domande di «${sub.title}»?`)) return;
                              setPack(removeSet(pack, round.id));
                            }}
                            className="font-sans text-xs text-ink-dim underline underline-offset-4 hover:text-danger"
                          >
                            Togli le domande
                          </button>
                        </div>
                        <RoundEditor gameId={gameId} set={round} onChange={(fn) => setPack(updateSet(pack, round.id, fn))} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPack(addRound(pack, step.id, i))}
                        className="self-start rounded-full border border-ink-dim/30 px-3 py-1.5 font-sans text-xs text-cream hover:border-gold-400/70"
                      >
                        + Domande in questo sotto-step
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPack(addSubstep(pack, step.id))}
              className="rounded-xl border border-dashed border-ink-dim/30 py-2.5 font-sans text-sm text-cream hover:border-gold-400/70"
            >
              + Aggiungi sotto-step
            </button>
          </section>
        )}
      </div>
    </details>
  );
}
