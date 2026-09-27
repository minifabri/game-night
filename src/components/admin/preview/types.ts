import type { GameContent } from "@/lib/game";

/** What the editor's preview shows on the fake display. */
export type PreviewScene =
  | { kind: "waiting" }
  | { kind: "scoreboard"; stepId: string | null }
  | { kind: "step"; stepId: string; substep: number | null }
  | { kind: "question"; setId: string; index: number; answer: { text: string | null; detail?: string } | null };

/** Editor → preview frame. */
export interface PreviewMessage {
  type: "gn-preview";
  title: string;
  content: GameContent;
  scene: PreviewScene;
  variant: "tv" | "phone";
}

/** Preview frame → editor, once it can receive content. */
export const PREVIEW_READY = "gn-preview-ready";
