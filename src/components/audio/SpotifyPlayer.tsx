"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { MusicStatus } from "@/lib/types";

// Minimal typing of Spotify's iFrame API:
// https://developer.spotify.com/documentation/embeds/references/iframe-api
interface EmbedController {
  loadUri(uri: string): void;
  play(): void;
  resume(): void;
  pause(): void;
  destroy(): void;
  addListener(event: "ready", fn: () => void): void;
  addListener(event: "playback_update", fn: (e: { data: { isPaused: boolean } }) => void): void;
}

interface IFrameAPI {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: EmbedController) => void
  ): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

let apiPromise: Promise<IFrameAPI> | null = null;

function loadIFrameApi(): Promise<IFrameAPI> {
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      window.onSpotifyIframeApiReady = resolve;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("Spotify iFrame API unavailable"));
      };
      document.body.appendChild(script);
    });
  }
  return apiPromise;
}

interface SpotifyPlayerProps {
  uri: string;
  status: MusicStatus;
  /** Bumped when the track is (re)started from the beginning. */
  nonce: number;
  muted: boolean;
  /** A long effect is playing: pause for it and pick up where it left off. */
  held?: boolean;
  floating?: boolean;
}

/**
 * Plays a Spotify playlist/album/track through the embed player, driven by the
 * console's music commands. The embed has no volume control, so "Muto" pauses it,
 * and so do long effects (instead of ducking like the file player does).
 */
export function SpotifyPlayer({ uri, status, nonce, muted, held = false, floating }: SpotifyPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const loadedUri = useRef<string | null>(null);
  const isPaused = useRef(true);
  // next "play" should start from the top (fresh load, restart or after Stop)
  const fromStart = useRef(true);
  const lastNonce = useRef(nonce);

  const desired = useRef({ uri, status, muted, held });
  desired.current = { uri, status, muted, held };

  const sync = useRef(() => {});
  sync.current = () => {
    const controller = controllerRef.current;
    if (!controller) return;
    const want = desired.current;
    if (loadedUri.current !== want.uri) {
      // playback resumes from the "ready" event once the new content is in
      loadedUri.current = want.uri;
      fromStart.current = true;
      controller.loadUri(want.uri);
      // in case "ready" doesn't fire again for the new content
      setTimeout(() => sync.current(), 1500);
      return;
    }
    if (want.status === "playing" && !want.muted && !want.held) {
      if (fromStart.current) {
        fromStart.current = false;
        controller.play();
      } else if (isPaused.current) {
        controller.resume();
      }
    } else {
      if (want.status === "stopped") fromStart.current = true;
      if (!isPaused.current) controller.pause();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    const mount = document.createElement("div");
    host.appendChild(mount);

    loadIFrameApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(mount, { uri: desired.current.uri, width: "100%", height: 80 }, (controller) => {
          if (cancelled) {
            controller.destroy();
            return;
          }
          controllerRef.current = controller;
          loadedUri.current = desired.current.uri;
          controller.addListener("ready", () => sync.current());
          controller.addListener("playback_update", (e) => {
            isPaused.current = e.data.isPaused;
          });
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      host.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (lastNonce.current !== nonce) {
      lastNonce.current = nonce;
      fromStart.current = true;
    }
    sync.current();
  }, [uri, status, nonce, muted, held]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "overflow-hidden rounded-xl",
        floating
          ? "fixed bottom-4 right-4 z-40 w-72 opacity-40 transition-opacity hover:opacity-100 focus-within:opacity-100"
          : "mb-3 w-full"
      )}
    />
  );
}
