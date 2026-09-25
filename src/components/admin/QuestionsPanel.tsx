"use client";

import { useState, useTransition } from "react";
import {
  hideQuestion,
  restartQuestionTimer,
  setAnswerVisible,
  setFinalissimaUsed,
  showQuestion,
} from "@/lib/actions/show";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { QuizImage } from "@/components/stage/QuizImage";
import { cn } from "@/lib/cn";
import {
  QUESTION_SETS,
  QUESTION_SET_IDS,
  adjacentQuestion,
  getQuestion,
  type Question,
  type QuestionSetId,
} from "@/lib/show";
import type { GameState } from "@/lib/types";

type Run = (action: () => Promise<{ ok: boolean; error?: string }>) => void;

/** Put the quiz and Finalissima questions on screen, one at a time, and step through them. */
export function QuestionsPanel({ gameState }: { gameState: GameState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const live = getQuestion(gameState.question_set, gameState.question_index);
  const [tab, setTab] = useState<QuestionSetId>(
    live?.set.id ?? (gameState.show_step === "finalissima" ? "finalissima" : "arte")
  );

  const run: Run = (action) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  };

  function show(set: QuestionSetId, index: number) {
    setTab(set);
    run(() => showQuestion({ set, index }));
  }

  const prev = live ? adjacentQuestion(live.set.id, live.index, -1) : null;
  const next = live ? adjacentQuestion(live.set.id, live.index, 1) : null;
  const isFinalissima = live?.set.id === "finalissima";

  return (
    <Panel title="Domande a schermo">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Tocca una domanda per mandarla sul display (i quadri mostrano solo l&apos;immagine). Le risposte le vedi solo
        tu finché non premi «Mostra risposta». Il quiz fa partire da solo i 10 secondi.
      </p>

      {live && (
        <div className="mb-4 rounded-xl bg-gold-400/5 p-3 ring-1 ring-gold-400/50">
          <p className="mb-2 font-sans text-[0.65rem] uppercase tracking-[0.25em] text-gold-400">
            Ora a schermo · {live.set.label}{" "}
            {isFinalissima ? `n° ${live.index + 1}` : `${live.index + 1}/${live.set.questions.length}`}
          </p>
          <div className="mb-3 flex gap-3">
            {live.question.image && (
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-void">
                <QuizImage src={live.question.image} small className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="whitespace-pre-line font-sans text-sm text-cream">
                {live.question.prompt ?? live.question.title}
              </p>
              <p className="mt-1 font-sans text-sm font-medium text-gold-300">
                → {live.question.answer ?? "(risposta: la sai tu)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button size="md" variant="ghost" disabled={pending || !prev} onClick={() => prev && show(prev.set, prev.index)}>
              ◀ Prec
            </Button>
            <Button size="md" disabled={pending || !next} onClick={() => next && show(next.set, next.index)}>
              Succ ▶
            </Button>
            <Button
              size="md"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => setAnswerVisible({ visible: !gameState.question_answer_visible }))}
            >
              {gameState.question_answer_visible ? "Nascondi risposta" : "Mostra risposta"}
            </Button>
            <Button size="md" variant="ghost" disabled={pending} onClick={() => run(restartQuestionTimer)}>
              {live.set.timerMs ? "Riavvia 10s" : "Timer 10s"}
            </Button>
          </div>
          <Button size="md" variant="danger" disabled={pending} onClick={() => run(hideQuestion)} className="mt-2 w-full">
            Togli dal display
          </Button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-plum-900/50 p-1">
        {QUESTION_SET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-lg px-2 py-2 font-sans text-xs transition-colors",
              tab === id ? "bg-gold-400 text-void" : "text-ink-dim hover:text-cream"
            )}
          >
            {QUESTION_SETS[id].label}
          </button>
        ))}
      </div>

      {tab === "finalissima" ? (
        <FinalissimaBoard gameState={gameState} pending={pending} run={run} onShow={(i) => show("finalissima", i)} />
      ) : (
        <ol className="flex flex-col gap-1.5">
          {QUESTION_SETS[tab].questions.map((q, i) => (
            <QuestionRow
              key={i}
              question={q}
              number={i + 1}
              live={live?.set.id === tab && live.index === i}
              pending={pending}
              onShow={() => show(tab, i)}
            />
          ))}
        </ol>
      )}

      {error && <p className="mt-3 text-center font-sans text-sm text-gym">{error}</p>}
    </Panel>
  );
}

function QuestionRow({
  question,
  number,
  live,
  pending,
  onShow,
  used,
  onToggleUsed,
}: {
  question: Question;
  number: number;
  live: boolean;
  pending: boolean;
  onShow: () => void;
  used?: boolean;
  onToggleUsed?: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg border px-2.5 py-2",
        live ? "bg-gold-400/10 ring-1 ring-gold-400/70" : "border-ink-dim/10",
        used && !live && "opacity-50"
      )}
    >
      <span className="w-5 shrink-0 text-right font-numeric text-base text-ink-dim">{number}</span>
      {question.image && (
        <div className="h-10 w-12 shrink-0 overflow-hidden rounded bg-void">
          <QuizImage src={question.image} small className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {question.category && (
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.2em] text-ink-dim">{question.category}</p>
        )}
        <p className="font-sans text-xs text-cream">{question.prompt ?? question.title}</p>
        <p className="font-sans text-xs text-gold-300/90">{question.answer ?? "(risposta: la sai tu)"}</p>
      </div>
      {onToggleUsed && used && !live && (
        <button
          type="button"
          disabled={pending}
          onClick={onToggleUsed}
          className="shrink-0 font-sans text-[0.6rem] uppercase tracking-[0.15em] text-ink-dim hover:text-cream"
        >
          Libera
        </button>
      )}
      <button
        type="button"
        disabled={pending || live}
        onClick={onShow}
        className={cn(
          "shrink-0 rounded-full border px-3 py-1.5 font-sans text-xs disabled:opacity-60",
          live ? "border-gold-400 text-gold-300" : "border-ink-dim/30 text-cream hover:border-gold-400/70 hover:text-gold-300"
        )}
      >
        {live ? "A schermo" : "Mostra"}
      </button>
    </li>
  );
}

function FinalissimaBoard({
  gameState,
  pending,
  run,
  onShow,
}: {
  gameState: GameState;
  pending: boolean;
  run: Run;
  onShow: (index: number) => void;
}) {
  const used = gameState.finalissima_used ?? [];
  const liveIndex = gameState.question_set === "finalissima" ? gameState.question_index : null;
  const questions = QUESTION_SETS.finalissima.questions;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-sans text-xs text-ink-dim">
        Tocca il numero scelto dal concorrente: la domanda va a schermo e il numero si spegne sul tabellone.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((_, i) => {
          const n = i + 1;
          const isLive = liveIndex === i;
          const isUsed = used.includes(n);
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() => onShow(i)}
              className={cn(
                "relative aspect-[5/4] rounded-xl border font-numeric text-2xl transition-colors disabled:opacity-60",
                isLive
                  ? "border-gold-300 bg-gold-400 text-void"
                  : isUsed
                    ? "border-ink-dim/15 text-ink-dim/50 line-through"
                    : "border-gold-400/50 text-gold-200 hover:bg-gold-400/10"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <ol className="flex flex-col gap-1.5">
        {questions.map((q, i) => (
          <QuestionRow
            key={i}
            question={q}
            number={i + 1}
            live={liveIndex === i}
            pending={pending}
            onShow={() => onShow(i)}
            used={used.includes(i + 1)}
            onToggleUsed={() => run(() => setFinalissimaUsed({ number: i + 1, used: false }))}
          />
        ))}
      </ol>
    </div>
  );
}
