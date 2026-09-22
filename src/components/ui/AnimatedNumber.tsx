"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { cn } from "@/lib/cn";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

/** Smoothly tweens between numeric values instead of snapping — used everywhere a score changes. */
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    if (from === value) return;
    const controls = animate(from, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className={cn("tabular-nums", className)}>{display}</span>;
}
