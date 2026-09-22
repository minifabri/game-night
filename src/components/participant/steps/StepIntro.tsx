"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-10 text-center">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="font-display text-3xl font-medium text-cream sm:text-4xl"
      >
        Parteciperai?
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <Button size="lg" onClick={onNext}>
          Sì
        </Button>
      </motion.div>
    </div>
  );
}
