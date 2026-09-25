"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** How long the controls (and the mouse cursor) stay visible after the last movement. */
const IDLE_MS = 3000;

type WakeStatus = "on" | "off" | "unsupported";

/**
 * TV-only helpers for /display: a fullscreen toggle (also on the "F" key) and a
 * screen wake lock so the laptop/TV doesn't dim or go to standby mid-show.
 * The controls fade out with the cursor after a few idle seconds.
 */
export function DisplayControls() {
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [wake, setWake] = useState<WakeStatus>("off");
  const [active, setActive] = useState(true);

  // --- Wake lock -----------------------------------------------------------
  // The browser drops the lock whenever the tab is hidden, so it is requested
  // again when the page comes back, and on any interaction as a fallback.
  const lockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!("wakeLock" in navigator)) {
      setWake("unsupported");
      return;
    }
    let disposed = false;
    const acquire = async () => {
      if (disposed || document.visibilityState !== "visible" || (lockRef.current && !lockRef.current.released)) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (disposed) {
          void lock.release();
          return;
        }
        lockRef.current = lock;
        setWake("on");
        lock.addEventListener("release", () => {
          if (lockRef.current === lock) setWake("off");
        });
      } catch {
        // Not allowed right now (e.g. not a secure context, battery saver): retry on the next interaction.
        setWake("off");
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    window.addEventListener("pointerdown", acquire);
    window.addEventListener("keydown", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      window.removeEventListener("pointerdown", acquire);
      window.removeEventListener("keydown", acquire);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);

  // --- Fullscreen ----------------------------------------------------------
  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled);
    const sync = () => setFullscreen(document.fullscreenElement !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen]);

  // --- Auto-hide controls and cursor ----------------------------------------
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const poke = () => {
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), IDLE_MS);
    };
    poke();
    window.addEventListener("pointermove", poke);
    window.addEventListener("pointerdown", poke);
    window.addEventListener("keydown", poke);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", poke);
      window.removeEventListener("pointerdown", poke);
      window.removeEventListener("keydown", poke);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.cursor = active ? "" : "none";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, [active]);

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 flex items-center gap-2 font-sans text-sm transition-opacity duration-500",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <span
        title={
          wake === "on"
            ? "Lo schermo resta acceso"
            : wake === "unsupported"
              ? "Questo browser non può bloccare lo standby: disattivalo dalle impostazioni"
              : "Standby non bloccato: tocca lo schermo per riprovare"
        }
        className={cn(
          "flex items-center gap-1.5 rounded-full border bg-void/90 px-3 py-2 backdrop-blur",
          wake === "on" ? "border-plum-600 text-ink-dim" : "border-gym/60 text-gym-soft"
        )}
      >
        <EyeIcon />
        {wake === "on" ? "Schermo sempre acceso" : "Standby non bloccato"}
      </span>
      {canFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex items-center gap-2 rounded-full border border-gold-400/60 bg-void/90 px-4 py-2 text-gold-300 shadow-lg backdrop-blur"
        >
          <FullscreenIcon exit={fullscreen} />
          {fullscreen ? "Esci da schermo intero" : "Schermo intero"}
        </button>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {exit ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
