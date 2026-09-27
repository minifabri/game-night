import type { GamePack } from "@/lib/game-pack";

/**
 * Pure edits on a GamePack for the content editor. Question rounds are tied
 * to a step's sub-step by index, so adding, moving or removing a sub-step
 * keeps its round attached to it.
 */

export type Pack = GamePack;
export type PackStep = Pack["steps"][number];
export type PackSet = Pack["questionSets"][number];
export type PackQuestion = PackSet["questions"][number];

export function roundOf(pack: Pack, stepId: string, substep: number): PackSet | undefined {
  return pack.questionSets.find((s) => s.step === stepId && s.substep === substep && !s.pickByNumber);
}

export function boardOf(pack: Pack, step: PackStep): PackSet | undefined {
  return step.board ? pack.questionSets.find((s) => s.id === step.board) : undefined;
}

function uniqueSetId(pack: Pack, base: string): string {
  const taken = new Set(pack.questionSets.map((s) => s.id));
  let n = 1;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function addSubstep(pack: Pack, stepId: string): Pack {
  const next = structuredClone(pack);
  const step = next.steps.find((s) => s.id === stepId)!;
  const count = step.substeps?.length ?? 0;
  step.substeps = [
    ...(step.substeps ?? []),
    { title: `${step.substepLabel || "Parte"} ${count + 1}`, description: "" },
  ];
  return next;
}

export function removeSubstep(pack: Pack, stepId: string, index: number): Pack {
  const next = structuredClone(pack);
  const step = next.steps.find((s) => s.id === stepId)!;
  step.substeps = step.substeps?.filter((_, i) => i !== index);
  if (step.substeps?.length === 0) step.substeps = undefined;
  next.questionSets = next.questionSets
    .filter((s) => !(s.step === stepId && s.substep === index))
    .map((s) =>
      s.step === stepId && s.substep !== null && s.substep > index ? { ...s, substep: s.substep - 1 } : s
    );
  return next;
}

export function moveSubstep(pack: Pack, stepId: string, index: number, dir: -1 | 1): Pack {
  const next = structuredClone(pack);
  const step = next.steps.find((s) => s.id === stepId)!;
  const subs = step.substeps ?? [];
  const other = index + dir;
  if (other < 0 || other >= subs.length) return pack;
  [subs[index], subs[other]] = [subs[other], subs[index]];
  for (const set of next.questionSets) {
    if (set.step !== stepId) continue;
    if (set.substep === index) set.substep = other;
    else if (set.substep === other) set.substep = index;
  }
  return next;
}

export function addRound(pack: Pack, stepId: string, substep: number): Pack {
  const next = structuredClone(pack);
  const step = next.steps.find((s) => s.id === stepId)!;
  next.questionSets.push({
    id: uniqueSetId(next, stepId),
    label: step.substeps?.[substep]?.title ?? step.title,
    step: stepId,
    substep,
    ask: null,
    timerMs: null,
    questions: [],
  });
  return next;
}

export function removeSet(pack: Pack, setId: string): Pack {
  return { ...pack, questionSets: pack.questionSets.filter((s) => s.id !== setId) };
}

export function updateSet(pack: Pack, setId: string, fn: (set: PackSet) => void): Pack {
  const next = structuredClone(pack);
  const set = next.questionSets.find((s) => s.id === setId);
  if (set) fn(set);
  return next;
}

export function moveItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const other = index + dir;
  if (other < 0 || other >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[other]] = [copy[other], copy[index]];
  return copy;
}

/** Before saving: rounds take their sub-step's title as label (it names the tab in the console). */
export function normalizeForSave(pack: Pack): Pack {
  const next = structuredClone(pack);
  for (const set of next.questionSets) {
    if (set.substep === null || set.pickByNumber) continue;
    const title = next.steps.find((s) => s.id === set.step)?.substeps?.[set.substep]?.title;
    if (title) set.label = title;
  }
  return next;
}
