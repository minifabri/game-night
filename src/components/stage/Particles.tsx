"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ParticlesProps {
  /** Gold, or a team slot's colour. */
  color: "gold" | "a" | "b";
  count?: number;
}

const colorClass: Record<ParticlesProps["color"], string> = {
  gold: "bg-gold-300",
  a: "bg-team-a-soft",
  b: "bg-team-b-soft",
};

/** A handful of soft drifting dots — restrained, not a confetti cannon. */
export function Particles({ color, count = 22 }: ParticlesProps) {
  const [dots] = useState(() =>
    Array.from({ length: count }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 4 + Math.random() * 3,
      size: 2 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 60,
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className={cn("absolute rounded-full opacity-0", colorClass[color])}
          style={{ left: `${d.left}%`, width: d.size, height: d.size, bottom: "-5%" }}
          animate={{
            y: [0, -420 - Math.random() * 200],
            x: [0, d.drift],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
