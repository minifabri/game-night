"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { splitPackUnchecked } from "@/lib/game-pack";
import { cn } from "@/lib/cn";
import { boardOf, normalizeForSave, roundOf, type Pack } from "@/components/admin/editor/pack-ops";
import { PREVIEW_READY, type PreviewMessage, type PreviewScene } from "@/components/admin/preview/types";

interface SceneEntry {
  key: string;
  label: string;
  scene: PreviewScene;
  /** The question's answer, shown on screen when "Mostra risposta" is on. */
  answer?: { text: string | null; detail?: string };
}

const NBSP = "   ";

/** Everything the display can show for this game, in running order. */
export function previewScenes(pack: Pack): SceneEntry[] {
  const entries: SceneEntry[] = [
    { key: "waiting", label: "Sala d'attesa", scene: { kind: "waiting" } },
    { key: "scoreboard", label: "Tabellone", scene: { kind: "scoreboard", stepId: null } },
  ];

  pack.steps.forEach((step, i) => {
    entries.push({
      key: `step:${step.id}`,
      label: `${i + 1}. ${step.title || "(senza titolo)"}${step.secretSubsteps && step.substeps?.length ? " — tutto coperto" : ""}`,
      scene: { kind: "step", stepId: step.id, substep: null },
    });

    step.substeps?.forEach((sub, j) => {
      entries.push({
        key: `step:${step.id}:${j}`,
        label: `${NBSP}${step.substepLabel || "Parte"} ${j + 1} · ${sub.title}`,
        scene: { kind: "step", stepId: step.id, substep: j },
      });
      const round = roundOf(pack, step.id, j);
      round?.questions.forEach((q, k) => {
        entries.push({
          key: `q:${round.id}:${k}`,
          label: `${NBSP}${NBSP}Domanda ${k + 1}${q.prompt ? ` · ${q.prompt.slice(0, 30)}` : q.image !== undefined ? " · immagine" : ""}`,
          scene: { kind: "question", setId: round.id, index: k, answer: null },
          answer: { text: q.answer, detail: q.detail },
        });
      });
    });

    const board = boardOf(pack, step);
    board?.questions.forEach((q, k) => {
      entries.push({
        key: `q:${board.id}:${k}`,
        label: `${NBSP}N° ${k + 1}${q.prompt ? ` · ${q.prompt.slice(0, 30)}` : ""}`,
        scene: { kind: "question", setId: board.id, index: k, answer: null },
        answer: { text: q.answer, detail: q.detail },
      });
    });
  });

  return entries;
}

const FRAMES = {
  tv: { width: 1920, height: 1080 },
  phone: { width: 390, height: 844 },
} as const;

/**
 * Full-screen preview of the display with the editor's unsaved content: the
 * real /display scenes run in a frame sized like a TV (or a phone) and
 * scaled down to fit. Nothing reaches the live screens.
 */
export function PreviewModal({
  pack,
  startKey,
  onClose,
}: {
  pack: Pack;
  startKey?: string;
  onClose: () => void;
}) {
  const entries = useMemo(() => previewScenes(pack), [pack]);
  const [index, setIndex] = useState(() => Math.max(0, entries.findIndex((e) => e.key === startKey)));
  const [variant, setVariant] = useState<"tv" | "phone">("tv");
  const [showAnswer, setShowAnswer] = useState(false);
  const [scale, setScale] = useState(0.3);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const entry = entries[Math.min(index, entries.length - 1)];
  const content = useMemo(() => splitPackUnchecked(normalizeForSave(pack)).content, [pack]);
  const frame = FRAMES[variant];

  const send = useCallback(() => {
    if (!entry) return;
    const scene: PreviewScene =
      entry.scene.kind === "question" ? { ...entry.scene, answer: showAnswer ? entry.answer ?? null : null } : entry.scene;
    const message: PreviewMessage = { type: "gn-preview", title: pack.title, content, scene, variant };
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [entry, showAnswer, pack.title, content, variant]);

  // (Re)send whenever the scene changes, and when the frame says it's ready.
  useEffect(() => send(), [send]);
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin === window.location.origin && e.data?.type === PREVIEW_READY) send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Fit the frame in the available area.
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const fit = () => setScale(Math.min(area.clientWidth / frame.width, area.clientHeight / frame.height));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(area);
    return () => observer.disconnect();
  }, [frame.width, frame.height]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(entries.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entries.length, onClose]);

  const isQuestion = entry?.scene.kind === "question";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void" role="dialog" aria-modal="true" aria-label="Anteprima display">
      <div className="flex items-center gap-3 border-b border-plum-700/60 px-4 py-3">
        <p className="font-sans text-xs uppercase tracking-[0.25em] text-gold-400">Anteprima</p>
        <div className="flex rounded-lg bg-plum-900/70 p-0.5">
          {(["tv", "phone"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={variant === v}
              onClick={() => setVariant(v)}
              className={cn("rounded-md px-3 py-1 font-sans text-xs", variant === v ? "bg-gold-400 text-void" : "text-ink-dim")}
            >
              {v === "tv" ? "TV" : "Telefono"}
            </button>
          ))}
        </div>
        <span className="flex-1 truncate text-right font-sans text-[0.65rem] text-ink-dim">
          contenuti non salvati inclusi · nessuno schermo vero viene toccato
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi anteprima"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-plum-900/70 text-lg text-cream"
        >
          ×
        </button>
      </div>

      <div ref={areaRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
        <div
          className="overflow-hidden rounded-lg ring-1 ring-plum-700"
          style={{ width: frame.width * scale, height: frame.height * scale }}
        >
          <iframe
            ref={frameRef}
            src="/admin/anteprima"
            title="Anteprima display"
            style={{
              width: frame.width,
              height: frame.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              border: 0,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-plum-700/60 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Scena precedente"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="h-11 w-11 shrink-0 rounded-xl bg-plum-900/70 text-cream disabled:opacity-30"
          >
            ◀
          </button>
          <select
            value={entry?.key}
            onChange={(e) => setIndex(entries.findIndex((x) => x.key === e.target.value))}
            aria-label="Cosa vedere"
            className="h-11 min-w-0 flex-1 rounded-xl border border-ink-dim/25 bg-plum-900 px-3 font-sans text-sm text-cream"
          >
            {entries.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Scena successiva"
            disabled={index >= entries.length - 1}
            onClick={() => setIndex((i) => Math.min(entries.length - 1, i + 1))}
            className="h-11 w-11 shrink-0 rounded-xl bg-gold-400 text-void disabled:opacity-30"
          >
            ▶
          </button>
        </div>
        {isQuestion && (
          <label className="flex items-center gap-2 font-sans text-xs text-ink-dim">
            <input type="checkbox" checked={showAnswer} onChange={(e) => setShowAnswer(e.target.checked)} />
            Mostra la risposta
          </label>
        )}
      </div>
    </div>
  );
}
