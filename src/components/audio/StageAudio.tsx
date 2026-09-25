"use client";

import { useAudioState } from "@/hooks/useAudioState";
import { useSounds } from "@/hooks/useSounds";
import { AudioDirector } from "@/components/audio/AudioDirector";
import type { GameState, TeamTotals } from "@/lib/types";

/** Audio output for the TV: subscribes to the console state and plays it here. */
export function StageAudio({ gameState, totals }: { gameState: GameState; totals: TeamTotals }) {
  const { audioState } = useAudioState();
  const { sounds } = useSounds();
  return <AudioDirector gameState={gameState} totals={totals} audioState={audioState} sounds={sounds} showUnlock floatingPlayer />;
}
