"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useGameContent } from "@/components/game/ActiveGameProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface StepBringProps {
  onSubmit: (choice: { bringsFood: boolean; bringsDrink: boolean }) => void;
  submitting: boolean;
  error: string | null;
}

export function StepBring({ onSubmit, submitting, error }: StepBringProps) {
  const [food, setFood] = useState(false);
  const [drink, setDrink] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const bring = useGameContent().registration?.bring;
  const ideas = bring?.ideas;
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.26, duration: 0.5 }}
        className="flex flex-col items-center gap-1.5"
      >
        {bring?.note && <p className="font-sans text-xs italic text-ink-dim">{bring.note}</p>}
        {ideas && (
          <button
            type="button"
            onClick={() => setIdeasOpen(true)}
            className="font-sans text-xs uppercase tracking-[0.2em] text-gold-400 underline underline-offset-4 hover:text-gold-300"
          >
            Ti serve un&apos;idea?
          </button>
        )}
      </motion.div>

      {error && <p className="font-sans text-sm text-danger">{error}</p>}

      <motion.div animate={{ opacity: canSubmit ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
        <Button size="lg" disabled={!canSubmit} onClick={() => onSubmit({ bringsFood: food, bringsDrink: drink })}>
          {submitting ? "Un attimo…" : "Sono pronto"}
        </Button>
      </motion.div>

      <Modal open={ideasOpen} title="Qualche idea" onClose={() => setIdeasOpen(false)}>
        {bring?.note && <p className="-mt-2 font-sans text-xs italic text-ink-dim">{bring.note}</p>}
        <IdeaList label="Da mangiare" items={ideas?.food ?? []} />
        <IdeaList label="Da bere" items={ideas?.drink ?? []} />
        <Button variant="ghost" size="md" onClick={() => setIdeasOpen(false)} className="mt-1 self-center">
          Ho capito
        </Button>
      </Modal>
    </div>
  );
}

function IdeaList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-gold-400">{label}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="font-sans text-sm text-ink">
            {item}
          </li>
        ))}
      </ul>
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
