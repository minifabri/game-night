"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

interface StepBringProps {
  onSubmit: (choice: { bringsFood: boolean; bringsDrink: boolean }) => void;
  submitting: boolean;
  error: string | null;
}

export function StepBring({ onSubmit, submitting, error }: StepBringProps) {
  const [food, setFood] = useState(false);
  const [drink, setDrink] = useState(false);
  const canSubmit = (food || drink) && !submitting;

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl font-medium text-cream sm:text-4xl"
      >
        Cosa porterai?
      </motion.p>

      <div className="flex w-full flex-col gap-3">
        <Choice label="Da mangiare" checked={food} onToggle={() => setFood((v) => !v)} delay={0.1} />
        <Choice label="Da bere" checked={drink} onToggle={() => setDrink((v) => !v)} delay={0.18} />
      </div>

      {error && <p className="font-sans text-sm text-gym">{error}</p>}

      <motion.div animate={{ opacity: canSubmit ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
        <Button size="lg" disabled={!canSubmit} onClick={() => onSubmit({ bringsFood: food, bringsDrink: drink })}>
          {submitting ? "Un attimo…" : "Sono pronto"}
        </Button>
      </motion.div>
    </div>
  );
}

function Choice({
  label,
  checked,
  onToggle,
  delay,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-6 py-4 font-sans text-base transition-colors",
        checked
          ? "border-gold-400 bg-gold-400/10 text-cream"
          : "border-ink-dim/25 text-ink-dim hover:border-ink-dim/50"
      )}
    >
      {label}
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          checked ? "border-gold-400 bg-gold-400" : "border-ink-dim/40"
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-void" />}
      </span>
    </motion.button>
  );
}
