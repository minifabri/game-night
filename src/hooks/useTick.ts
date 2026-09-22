"use client";

import { useEffect, useState } from "react";

/** Re-renders the calling component every `intervalMs`, returning Date.now(). */
export function useTick(intervalMs = 200): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

/** Milliseconds remaining until `targetIso`, clamped to >= 0. Null if no target. */
export function msUntil(targetIso: string | null | undefined, now: number): number | null {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  return Math.max(0, target - now);
}
