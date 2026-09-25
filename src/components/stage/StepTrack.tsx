"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useGameContent } from "@/components/game/ActiveGameProvider";

interface StepTrackProps {
  current: string;
  variant?: "tv" | "phone";
  className?: string;
}

/** The evening's running order, with the step in progress lit up. */
export function StepTrack({ current, variant = "phone", className }: StepTrackProps) {
  const isTv = variant === "tv";
  const steps = useGameContent().steps;
  const currentIndex = steps.findIndex((s) => s.id === current);

  if (!isTv) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="flex items-center gap-1.5">
          {steps.map((step, i) => (
            <span
              key={step.id}
              className={cn(
                "block h-1.5 rounded-full transition-all duration-500",
                i === currentIndex ? "w-6 bg-gold-400" : i < currentIndex ? "w-1.5 bg-gold-400/50" : "w-1.5 bg-ink-dim/25"
              )}
            />
          ))}
        </div>
        <p className="font-sans text-[0.65rem] uppercase tracking-[0.3em] text-gold-300">
          {steps[currentIndex]?.short}
        </p>
      </div>
    );
  }

  return (
    <ol className={cn("relative mx-auto flex w-full max-w-6xl items-start justify-between px-6", className)}>
      {/* rail between the first and last node centres (px-6 + half of w-24), filled up to the current step */}
      <span aria-hidden className="absolute left-[4.5rem] right-[4.5rem] top-5 h-px bg-ink-dim/20" />
      <motion.span
        aria-hidden
        className="absolute left-[4.5rem] top-5 h-px origin-left bg-gold-400/70"
        initial={false}
        animate={{ width: `calc((100% - 9rem) * ${currentIndex / Math.max(1, steps.length - 1)})` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {steps.map((step, i) => {
        const state = i === currentIndex ? "current" : i < currentIndex ? "done" : "todo";
        return (
          <li key={step.id} className="relative z-10 flex w-24 flex-col items-center gap-2">
            <span className="relative flex h-10 w-10 items-center justify-center">
              {state === "current" && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-gold-400"
                  animate={{ scale: [1, 1.7, 1], opacity: [0.45, 0, 0.45] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full border font-numeric text-xl transition-colors duration-500",
                  state === "current" && "border-gold-300 bg-gold-400 text-void shadow-[0_0_30px_var(--color-gold-400)]",
                  state === "done" && "border-gold-400/50 bg-plum-900 text-gold-400/80",
                  state === "todo" && "border-ink-dim/25 bg-void text-ink-dim/50"
                )}
              >
                {state === "done" ? <CheckIcon /> : i + 1}
              </span>
            </span>
            <span
              className={cn(
                "text-center font-sans text-xs uppercase tracking-[0.18em] transition-colors duration-500",
                state === "current" ? "text-gold-200" : state === "done" ? "text-ink-dim" : "text-ink-dim/45"
              )}
            >
              {step.short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
