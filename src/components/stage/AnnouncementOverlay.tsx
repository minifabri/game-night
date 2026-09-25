"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface AnnouncementOverlayProps {
  message: string;
  variant?: "tv" | "phone";
}

/** Full-screen card with the admin's message, laid over whatever scene is running underneath. */
export function AnnouncementOverlay({ message, variant = "phone" }: AnnouncementOverlayProps) {
  const isTv = variant === "tv";
  const long = message.length > 220;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-void/95 px-6 py-10 backdrop-blur-sm"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        animate={{ opacity: [0.1, 0.22, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--color-plum-600), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: -12, scale: 0.99 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn("flex w-full flex-col items-center text-center", isTv ? "max-w-6xl gap-10" : "max-w-xl gap-6")}
      >
        <span aria-hidden className={cn("block rounded-full bg-gold-400", isTv ? "h-1.5 w-32" : "h-1 w-16")} />
        <p
          className={cn(
            "whitespace-pre-line break-words font-display font-medium leading-snug text-cream",
            isTv ? (long ? "text-5xl" : "text-7xl") : long ? "text-xl" : "text-3xl"
          )}
        >
          {message}
        </p>
        <span aria-hidden className={cn("block rounded-full bg-gold-400", isTv ? "h-1.5 w-32" : "h-1 w-16")} />
      </motion.div>
    </motion.div>
  );
}
