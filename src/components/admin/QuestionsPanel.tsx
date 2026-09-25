"use client";

import { useState, useTransition } from "react";
import {
  hideQuestion,
  restartQuestionTimer,
  setAnswerVisible,
  setBoardUsed,
  showQuestion,
} from "@/lib/actions/show";
import { Panel } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { QuizImage } from "@/components/stage/QuizImage";
import { cn } from "@/lib/cn";
import {
  adjacentQuestion,
  getQuestion,
  getQuestionSet,
  type GameSecrets,
  type PublicQuestion,
  type QuestionSecret,
  type QuestionSet,
} from "@/lib/game";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import type { GameState } from "@/lib/types";

type Run = (action: () => Promise<{ ok: boolean; error?: string }>) => void;

/** Put the game's questions on screen, one at a time, and step through them. */
export function QuestionsPanel({ gameState, secrets }: { gameState: GameState; secrets: GameSecrets | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const content = useGameContent();
  const sets = content.questionSets;

  const live = getQuestion(content, gameState.question_set, gameState.question_index);
  const [tab, setTab] = useState<string | null>(
    live?.set.id ?? sets.find((s) => s.step === gameState.show_step)?.id ?? sets[0]?.id ?? null
  );
  const tabSet = getQuestionSet(content, tab) ?? sets[0] ?? null;
  const answerOf = (set: string, index: number): QuestionSecret | null => secrets?.answers[set]?.[index] ?? null;

  if (sets.length === 0) return null;

  const run: Run = (action) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Errore.");
    });
  };

  function show(set: string, index: number) {
    setTab(set);
    run(() => showQuestion({ set, index }));
  }

  const prev = live ? adjacentQuestion(content, live.set.id, live.index, -1) : null;
  const next = live ? adjacentQuestion(content, live.set.id, live.index, 1) : null;
  const byNumber = live?.set.pickByNumber === true;
  const liveAnswer = live ? answerOf(live.set.id, live.index) : null;

  return (
    <Panel title="Domande a schermo">
      <p className="mb-4 font-sans text-sm text-ink-dim">
        Tocca una domanda per mandarla sul display (i quadri mostrano solo l&apos;immagine). Le risposte le vedi solo
        tu finché non premi «Mostra risposta». Le domande a tempo fanno partire il timer da sole.
      </p>

      {live && (
        <div className="mb-4 rounded-xl bg-gold-400/5 p-3 ring-1 ring-gold-400/50">
          <p className="mb-2 font-sans text-[0.65rem] uppercase tracking-[0.25em] text-gold-400">
            Ora a schermo · {live.set.label}{" "}
            {byNumber ? `n° ${live.index + 1}` : `${live.index + 1}/${live.set.questions.length}`}
          </p>
          <div className="mb-3 flex gap-3">
            {live.question.image && (
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-void">
                <QuizImage src={live.question.image} small className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="whitespace-pre-line font-sans text-sm text-cream">
                {live.question.prompt ?? liveAnswer?.detail}
              </p>
              <p className="mt-1 font-sans text-sm font-medium text-gold-300">
                → <AnswerText secret={liveAnswer} loaded={secrets !== null} />
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
              {live.set.timerMs ? `Riavvia ${Math.round(live.set.timerMs / 1000)}s` : "Timer 10s"}
            </Button>
          </div>
          <Button size="md" variant="danger" disabled={pending} onClick={() => run(hideQuestion)} className="mt-2 w-full">
            Togli dal display
          </Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-plum-900/50 p-1">
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            onClick={() => setTab(set.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 font-sans text-xs transition-colors",
              tabSet?.id === set.id ? "bg-gold-400 text-void" : "text-ink-dim hover:text-cream"
            )}
          >
            {set.label}
          </button>
        ))}
      </div>

      {tabSet?.pickByNumber ? (
        <NumberBoard
          set={tabSet}
          gameState={gameState}
          answerOf={answerOf}
          secretsLoaded={secrets !== null}
          pending={pending}
          run={run}
          onShow={(i) => show(tabSet.id, i)}
        />
      ) : (
        tabSet && (
          <ol className="flex flex-col gap-1.5">
            {tabSet.questions.map((q, i) => (
              <QuestionRow
                key={i}
                question={q}
                secret={answerOf(tabSet.id, i)}
                secretsLoaded={secrets !== null}
                number={i + 1}
                live={live?.set.id === tabSet.id && live.index === i}
                pending={pending}
                onShow={() => show(tabSet.id, i)}
              />
            ))}
          </ol>
        )
      )}

      {error && <p className="mt-3 text-center font-sans text-sm text-danger">{error}</p>}
    </Panel>
  );
}

/** The answer as the admin sees it, with a reminder when only the presenter knows it. */
function AnswerText({ secret, loaded }: { secret: QuestionSecret | null; loaded: boolean }) {
  if (!loaded) return <>…</>;
  return <>{secret?.answer ?? "(risposta: la sai tu)"}</>;
}

function QuestionRow({
  question,
  secret,
  secretsLoaded,
  number,
  live,
  pending,
  onShow,
  used,
  onToggleUsed,
}: {
  question: PublicQuestion;
  secret: QuestionSecret | null;
  secretsLoaded: boolean;
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
        <p className="font-sans text-xs text-cream">{question.prompt ?? secret?.detail}</p>
        <p className="font-sans text-xs text-gold-300/90">
          <AnswerText secret={secret} loaded={secretsLoaded} />
        </p>
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

function NumberBoard({
  set,
  gameState,
  answerOf,
  secretsLoaded,
  pending,
  run,
  onShow,
}: {
  set: QuestionSet;
  gameState: GameState;
  answerOf: (set: string, index: number) => QuestionSecret | null;
  secretsLoaded: boolean;
  pending: boolean;
  run: Run;
  onShow: (index: number) => void;
}) {
  const used = gameState.board_used ?? [];
  const liveIndex = gameState.question_set === set.id ? gameState.question_index : null;
  const questions = set.questions;

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
            secret={answerOf(set.id, i)}
            secretsLoaded={secretsLoaded}
            number={i + 1}
            live={liveIndex === i}
            pending={pending}
            onShow={() => onShow(i)}
            used={used.includes(i + 1)}
            onToggleUsed={() => run(() => setBoardUsed({ number: i + 1, used: false }))}
          />
        ))}
      </ol>
    </div>
  );
}
