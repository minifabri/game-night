"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function StepName({
  initialValue,
  onNext,
}: {
  initialValue: string;
  onNext: (name: string) => void;
}) {
  const [name, setName] = useState(initialValue);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onNext(trimmed);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl font-medium text-cream sm:text-4xl"
      >
        Inserisci il tuo nome
      </motion.p>
      <motion.input
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="Il tuo nome"
        className="w-full rounded-full border border-ink-dim/30 bg-plum-900/50 px-6 py-4 text-center font-sans text-lg text-cream placeholder:text-ink-dim/60 outline-none focus:border-gold-400"
      />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
        <Button type="submit" size="lg" disabled={!name.trim()}>
          Continua
        </Button>
      </motion.div>
    </form>
  );
}
