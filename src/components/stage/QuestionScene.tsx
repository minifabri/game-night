"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useTick, msUntil } from "@/hooks/useTick";
import { getQuestion, getShowStep } from "@/lib/show";
import { QuizImage } from "@/components/stage/QuizImage";
import type { GameState } from "@/lib/types";

interface QuestionSceneProps {
  gameState: GameState;
  variant?: "tv" | "phone";
}

/**
 * The question on screen. Paintings show only the image; everything else
 * shows its text. The answer appears only when the admin reveals it.
 */
export function QuestionScene({ gameState, variant = "phone" }: QuestionSceneProps) {
  const isTv = variant === "tv";
  const current = getQuestion(gameState.question_set, gameState.question_index);
  if (!current) return null;

  const { set, question, index } = current;
  const step = getShowStep(set.step);
  const isFinalissima = set.id === "finalissima";
  const showAnswer = gameState.question_answer_visible === true;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex min-h-dvh w-full flex-col items-center",
        isTv ? "gap-6 px-12 py-8" : "gap-4 px-5 py-6"
      )}
    >
      {/* header: step · round, position */}
      <div className={cn("flex w-full items-center justify-between", isTv ? "max-w-6xl" : "max-w-md")}>
        <p className={cn("font-sans uppercase tracking-[0.35em] text-gold-400", isTv ? "text-lg" : "text-[0.6rem]")}>
          {step?.title}
          {!isFinalissima && <span className="text-gold-200"> · {set.label}</span>}
        </p>
        {isFinalissima ? (
          question.category && (
            <span
              className={cn(
                "rounded-full border border-gold-400/50 font-sans uppercase tracking-[0.25em] text-gold-300",
                isTv ? "px-4 py-1.5 text-base" : "px-2.5 py-1 text-[0.55rem]"
              )}
            >
              {question.category}
            </span>
          )
        ) : (
          <p className={cn("font-numeric text-ink-dim", isTv ? "text-3xl" : "text-lg")}>
            <span className="text-cream">{index + 1}</span> / {set.questions.length}
          </p>
        )}
      </div>

      {/* body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${set.id}:${index}`}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full flex-1 flex-col items-center justify-center gap-6 text-center"
        >
          {isFinalissima && (
            <p className={cn("font-numeric leading-none text-gold-400", isTv ? "text-8xl" : "text-5xl")}>
              N° {index + 1}
            </p>
          )}

          {question.image ? (
            <div className="rounded-lg bg-void p-1.5 shadow-[0_0_60px_rgba(221,179,103,0.18)] ring-4 ring-gold-500/70">
              <QuizImage
                src={question.image}
                className={cn("block w-auto object-contain", isTv ? "max-h-[62dvh] max-w-[80vw]" : "max-h-[50dvh] max-w-full")}
              />
            </div>
          ) : (
            <>
              {set.ask && (
                <p className={cn("font-sans uppercase tracking-[0.3em] text-ink-dim", isTv ? "text-xl" : "text-xs")}>
                  {set.ask}
                </p>
              )}
              <p
                className={cn(
                  "text-balance whitespace-pre-line font-display font-medium leading-tight text-cream",
                  isTv
                    ? (question.prompt?.length ?? 0) > 70
                      ? "max-w-6xl text-6xl"
                      : "max-w-6xl text-7xl"
                    : "max-w-md text-3xl"
                )}
              >
                {question.prompt}
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* footer: timer or answer */}
      <div className={cn("flex w-full flex-col items-center", isTv ? "min-h-36 max-w-5xl" : "min-h-24 max-w-md")}>
        <AnimatePresence mode="wait">
          {showAnswer ? (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex w-full flex-col items-center rounded-2xl bg-gold-400/10 text-center ring-1 ring-gold-400/60",
                isTv ? "gap-1 px-10 py-5" : "gap-0.5 px-4 py-3"
              )}
            >
              <p className={cn("font-sans uppercase tracking-[0.35em] text-gold-400", isTv ? "text-base" : "text-[0.55rem]")}>
                Risposta
              </p>
              <p className={cn("font-display font-medium text-gold-200", isTv ? "text-6xl" : "text-2xl")}>
                {question.answer ?? "Ve la dice la presentatrice!"}
              </p>
              {question.title && (
                <p className={cn("font-display italic text-cream/80", isTv ? "text-2xl" : "text-sm")}>
                  {question.title}
                </p>
              )}
            </motion.div>
          ) : gameState.question_timer_ends_at ? (
            <QuestionTimer
              key={`timer:${gameState.question_nonce ?? 0}`}
              endsAt={gameState.question_timer_ends_at}
              totalMs={set.timerMs ?? 10_000}
              isTv={isTv}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function QuestionTimer({ endsAt, totalMs, isTv }: { endsAt: string; totalMs: number; isTv: boolean }) {
  const now = useTick(100);
  const remaining = msUntil(endsAt, now) ?? 0;
  const seconds = Math.ceil(remaining / 1000);
  const fraction = Math.max(0, Math.min(1, remaining / totalMs));
  const over = remaining <= 0;
  const urgent = !over && seconds <= 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("flex w-full flex-col items-center", isTv ? "gap-3" : "gap-2")}
    >
      {over ? (
        <motion.p
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn("font-display font-medium tracking-[0.08em] text-gym", isTv ? "text-7xl" : "text-4xl")}
        >
          Tempo!
        </motion.p>
      ) : (
        <p
          className={cn(
            "font-numeric leading-none transition-colors",
            urgent ? "text-gym" : "text-cream",
            isTv ? "text-8xl" : "text-5xl"
          )}
        >
          {seconds}
        </p>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-ink-dim/15", isTv ? "h-3" : "h-2")}>
        <div
          className={cn("h-full rounded-full transition-[width] duration-100 ease-linear", urgent || over ? "bg-gym" : "bg-gold-400")}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </motion.div>
  );
}
