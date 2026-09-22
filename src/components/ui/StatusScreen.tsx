"use client";

import { motion } from "framer-motion";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";

interface StatusScreenProps {
  kind?: "loading" | "error" | "empty";
  message?: string;
  onRetry?: () => void;
}

export function StatusScreen({ kind = "loading", message, onRetry }: StatusScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Wordmark size="md" />
      <div className="flex flex-col items-center gap-4">
        {kind === "loading" && (
          <motion.div
            className="h-2 w-2 rounded-full bg-gold-400"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <p className="max-w-xs font-sans text-sm text-ink-dim">
          {message ??
            (kind === "error"
              ? "Qualcosa è andato storto. Controlla la connessione."
              : "Un attimo…")}
        </p>
        {onRetry && (
          <Button variant="ghost" size="md" onClick={onRetry}>
            Riprova
          </Button>
        )}
      </div>
    </div>
  );
}
