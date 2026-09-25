"use client";

import { useState, useTransition } from "react";
import { clearShow, setShowCard, setShowSubstep, startShowStep } from "@/lib/actions/show";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { SHOW_STEPS, activeSubstep, getShowStep } from "@/lib/show";
import type { GameState } from "@/lib/types";

/** The evening's running order: start each step and light it up on every screen. */
export function ShowPanel({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = getShowStep(gameState.show_step);
  const currentIndex = current ? SHOW_STEPS.indexOf(current) : -1;
  const next = SHOW_STEPS[currentIndex + 1] ?? null;
  const cardOn = gameState.show_card === true;
  const questionOn = gameState.question_set != null && gameState.question_index != null;
  const blocked =
    gameState.status === "TIMER" || gameState.status === "PAUSED" || gameState.status === "FINAL_REVEAL";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  }

  return (
    <Panel title="Scaletta della serata">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        «Avvia» accende lo step su TV e telefoni e mostra la sua scheda a tutto schermo. Da lì puoi tornare al
        tabellone: lo step resta illuminato nella barra in alto.
      </p>

      {blocked && (
        <p className="mb-3 rounded-xl border border-gym/40 bg-gym/5 px-3 py-2 font-sans text-xs text-gym-soft">
          {gameState.status === "TIMER"
            ? "C'è un timer a schermo: torna al tabellone per cambiare step."
            : gameState.status === "PAUSED"
              ? "Il gioco è in pausa."
              : "Reveal finale in corso."}
        </p>
      )}

      <div className="mb-4 flex flex-col gap-2">
        {next && (
          <Button size="lg" disabled={pending} onClick={() => run(() => startShowStep({ stepId: next.id }))}>
            {current ? `Avanti: ${next.title}` : `Inizia: ${next.title}`}
          </Button>
        )}
        {current && (
          <Button
            size="md"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => setShowCard({ visible: !cardOn }))}
          >
            {cardOn || questionOn ? "Torna al tabellone" : `Mostra scheda «${current.title}»`}
          </Button>
        )}
      </div>

      <ol className="flex flex-col gap-2">
        {SHOW_STEPS.map((step, i) => {
          const isCurrent = step.id === current?.id;
          const done = i < currentIndex;
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border p-3 transition-colors",
                isCurrent ? "bg-gold-400/5 ring-1 ring-gold-400/70" : "border-ink-dim/15",
                done && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-numeric text-base",
                    isCurrent ? "border-gold-300 bg-gold-400 text-void" : "border-ink-dim/30 text-ink-dim"
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                    {step.time} · {step.duration} · {step.kicker}
                  </p>
                  <p className="truncate font-sans text-sm font-medium text-cream">{step.title}</p>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 font-sans text-[0.65rem] uppercase tracking-[0.2em] text-gold-400">
                    In corso
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => startShowStep({ stepId: step.id }))}
                    className="shrink-0 rounded-full border border-ink-dim/30 px-3 py-1.5 font-sans text-xs text-cream hover:border-gold-400/70 hover:text-gold-300 disabled:opacity-40"
                  >
                    Avvia
                  </button>
                )}
              </div>

              {isCurrent && <CurrentStepDetails gameState={gameState} pending={pending} run={run} />}
            </li>
          );
        })}
      </ol>

      {current && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(clearShow)}
          className="mt-3 w-full font-sans text-xs uppercase tracking-[0.2em] text-ink-dim hover:text-gym disabled:opacity-40"
        >
          Azzera scaletta
        </button>
      )}

      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}
    </Panel>
  );
}

function CurrentStepDetails({
  gameState,
  pending,
  run,
}: {
  gameState: GameState;
  pending: boolean;
  run: (action: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const step = getShowStep(gameState.show_step);
  if (!step) return null;
  const active = activeSubstep(step, gameState.show_substep);
  const activeSub = step.substeps?.[active];

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-ink-dim/15 pt-3">
      {step.substeps && (
        <div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${step.substeps.length}, minmax(0, 1fr))` }}>
            {step.substeps.map((sub, i) => (
              <button
                key={sub.title}
                type="button"
                disabled={pending}
                onClick={() => run(() => setShowSubstep({ index: i }))}
                className={cn(
                  "rounded-lg border px-2 py-2 text-left font-sans text-xs transition-colors disabled:opacity-40",
                  i === active
                    ? "border-gold-300 bg-gold-400 text-void"
                    : "border-ink-dim/25 text-cream hover:border-gold-400/70"
                )}
              >
                <span className="block text-[0.6rem] uppercase tracking-[0.15em] opacity-70">
                  {step.secretSubsteps && i > active ? "Svela · " : ""}
                  {step.substepLabel} {i + 1}
                </span>
                {sub.title}
              </button>
            ))}
          </div>
          {step.secretSubsteps && (
            <p className="mt-2 font-sans text-xs text-ink-dim">
              {active < 0
                ? "A schermo sono tutti coperti da «?»: tocca il primo per svelarlo."
                : "Quelli dopo restano coperti finché non li tocchi."}
            </p>
          )}
          {activeSub?.script && <Script label={`Lancio — ${activeSub.title}`} text={activeSub.script} />}
        </div>
      )}

      {step.script && <Script label="Da dire" text={step.script} />}

      {step.id === "quiz" && (
        <p className="font-sans text-xs text-ink-dim">Le domande si lanciano dal pannello «Domande a schermo».</p>
      )}
      {step.id === "finalissima" && (
        <p className="font-sans text-xs text-ink-dim">
          A schermo c&apos;è il tabellone dei 20 numeri: tocca il numero scelto in «Domande a schermo».
        </p>
      )}
      {step.id === "proclamation" && (
        <p className="font-sans text-xs text-ink-dim">
          Per svelare i vincitori premi «Termina gioco» nel pannello «Stato del gioco».
        </p>
      )}
    </div>
  );
}

function Script({ label, text }: { label: string; text: string }) {
  return (
    <details open className="mt-2 rounded-lg bg-plum-900/50 px-3 py-2">
      <summary className="cursor-pointer font-sans text-[0.65rem] uppercase tracking-[0.2em] text-gold-400">
        {label}
      </summary>
      <p className="mt-1.5 font-sans text-sm italic leading-relaxed text-cream/90">«{text}»</p>
    </details>
  );
}
