"use client";

import { useEffect, useState } from "react";
import { getActiveGameSecrets } from "@/lib/actions/show";
import type { GameSecrets } from "@/lib/game";

/**
 * Presenter's lines and answers of the active game, fetched through an
 * admin-only server action (they're not readable with the public key).
 * Null while loading or if the admin session has expired. `version` (the
 * game row) refetches them when the game is reloaded with game:load.
 */
export function useGameSecrets(gameId: string | null, version?: unknown): GameSecrets | null {
  const [loaded, setLoaded] = useState<{ gameId: string; secrets: GameSecrets } | null>(null);

  useEffect(() => {
    if (!gameId) return;
    let active = true;
    getActiveGameSecrets().then((result) => {
      if (active && result.ok) setLoaded({ gameId: result.gameId, secrets: result.secrets });
    });
    return () => {
      active = false;
    };
  }, [gameId, version]);

  return loaded?.gameId === gameId ? loaded.secrets : null;
}
