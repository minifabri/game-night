import type { Metadata } from "next";
import { GameStage } from "@/components/stage/GameStage";

export const metadata: Metadata = {
  title: "Scoreboard — Palestrati vs Divanisti",
};

export default function DisplayPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center overflow-hidden">
      <GameStage variant="tv" isCanonical withAudio />
    </main>
  );
}
