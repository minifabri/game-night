import type { Metadata } from "next";
import { GameStage } from "@/components/stage/GameStage";
import { ActiveGameProvider } from "@/components/game/ActiveGameProvider";

export const metadata: Metadata = {
  title: "Scoreboard — Game Night",
};

export default function DisplayPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center overflow-hidden">
      <ActiveGameProvider>
        <GameStage variant="tv" isCanonical withAudio />
      </ActiveGameProvider>
    </main>
  );
}
