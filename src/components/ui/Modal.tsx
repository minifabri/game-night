"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-void/80 backdrop-blur-sm sm:items-center sm:px-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-t-3xl border border-gold-400/30 bg-plum-900 p-6 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-xl font-medium text-cream">{title}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="shrink-0 text-lg text-ink-dim hover:text-gold-300"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
