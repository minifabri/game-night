"use client";

import { createContext, useContext, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useGame } from "@/hooks/useGame";
import type { Game, GameContent } from "@/lib/game";
import type { GameState } from "@/lib/types";

interface ActiveGameValue {
  gameState: GameState | null;
  game: Game | null;
  loading: boolean;
  error: string | null;
}

const ActiveGameContext = createContext<ActiveGameValue | null>(null);

/**
 * Live game_state plus the content of the game it points at, for every
 * screen. Also paints the teams in the game's colours when it has its own.
 */
export function ActiveGameProvider({ children }: { children: React.ReactNode }) {
  const { gameState, loading: stateLoading, error: stateError } = useGameState();
  const gameId = gameState?.game_id ?? null;
  const { game, loading: gameLoading, error: gameError } = useGame(gameId);

  const teams = game?.content.teams;
  useEffect(() => {
    if (!teams) return;
    const root = document.documentElement.style;
    const vars: [string, string | undefined][] = [
      ["--color-team-a", teams.a.color],
      ["--color-team-a-soft", teams.a.colorSoft],
      ["--color-team-b", teams.b.color],
      ["--color-team-b-soft", teams.b.colorSoft],
    ];
    for (const [name, value] of vars) {
      if (value) root.setProperty(name, value);
      else root.removeProperty(name);
    }
  }, [teams]);

  const value: ActiveGameValue = {
    gameState,
    game,
    loading: stateLoading || (gameId !== null && gameLoading),
    error: stateError ?? (gameState && !gameId ? "Nessun gioco attivo." : gameError),
  };

  return <ActiveGameContext.Provider value={value}>{children}</ActiveGameContext.Provider>;
}

export function useActiveGame(): ActiveGameValue {
  const value = useContext(ActiveGameContext);
  if (!value) throw new Error("useActiveGame must be used inside <ActiveGameProvider>.");
  return value;
}

/** The active game's content, or null outside the provider / while loading. */
export function useOptionalGameContent(): GameContent | null {
  return useContext(ActiveGameContext)?.game?.content ?? null;
}

/** The active game's content; only for components rendered once it has loaded. */
export function useGameContent(): GameContent {
  const content = useOptionalGameContent();
  if (!content) throw new Error("Game content not loaded yet.");
  return content;
}
