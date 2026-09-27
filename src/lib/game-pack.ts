import { z } from "zod";
import type { GameContent, GameSecrets } from "./game";

/**
 * Authoring format for a game: one file in `games/<id>.ts` with everything,
 * lines and answers included. `splitPack` turns it into the public content
 * and the admin-only secrets stored in the database; `npm run game:load`
 * does the upload. Imports here stay type-only (plus zod) so the Node
 * scripts can load this file directly.
 */

const icon = z.enum(["quiz", "creativity", "physical", "courage", "finalissima", "star"]);

const team = z.object({
  name: z.string().min(1).max(30),
  member: z.string().min(1).max(30),
  color: z.string().optional(),
  colorSoft: z.string().optional(),
});

const substep = z.object({
  title: z.string().min(1),
  description: z.string(),
  /** Presenter's line when launching this sub-step (admin only). */
  script: z.string().optional(),
});

const step = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  short: z.string().min(1).max(16),
  kicker: z.string(),
  title: z.string().min(1),
  tagline: z.string(),
  time: z.string().optional(),
  duration: z.string().optional(),
  challengeId: z.string().optional(),
  /** Presenter's lines for the step (admin only). */
  script: z.string().optional(),
  substeps: z.array(substep).min(1).optional(),
  substepLabel: z.string().optional(),
  secretSubsteps: z.boolean().optional(),
  showTeams: z.boolean().optional(),
  showScoreboard: z.boolean().optional(),
  board: z.string().optional(),
  finale: z.boolean().optional(),
});

const question = z
  .object({
    prompt: z.string().optional(),
    image: z.string().startsWith("/").optional(),
    category: z.string().optional(),
    /** null = only the presenter knows (admin sees a reminder). */
    answer: z.string().nullable(),
    detail: z.string().optional(),
  })
  .refine((q) => q.prompt || q.image, "Ogni domanda ha bisogno di un testo o di un'immagine.");

const questionSet = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  step: z.string(),
  substep: z.number().int().min(0).nullable(),
  ask: z.string().nullable(),
  timerMs: z.number().int().min(1000).nullable(),
  pickByNumber: z.boolean().optional(),
  questions: z.array(question).min(1),
});

export const gamePackSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, "id: solo lettere minuscole, numeri e trattini"),
    title: z.string().min(1).max(80),
    subtitle: z.string(),
    heroImage: z.string().startsWith("/").optional(),
    teams: z.object({ a: team, b: team }),
    challenges: z
      .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1), icon: icon.optional() }))
      .min(1),
    registration: z
      .object({
        bring: z
          .object({
            note: z.string().optional(),
            ideas: z.object({ food: z.array(z.string()), drink: z.array(z.string()) }).optional(),
          })
          .optional(),
      })
      .optional(),
    steps: z.array(step).min(1),
    questionSets: z.array(questionSet),
  })
  .superRefine((pack, ctx) => {
    const unique = (ids: string[], what: string) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) ctx.addIssue({ code: "custom", message: `${what} duplicato: ${id}` });
        seen.add(id);
      }
      return seen;
    };
    const challenges = unique(pack.challenges.map((c) => c.id), "challenge");
    unique(pack.steps.map((s) => s.id), "step");
    unique(pack.questionSets.map((s) => s.id), "question set");

    for (const s of pack.steps) {
      if (s.challengeId && !challenges.has(s.challengeId)) {
        ctx.addIssue({ code: "custom", message: `step ${s.id}: challenge ${s.challengeId} non esiste` });
      }
      if (s.board && !pack.questionSets.some((q) => q.id === s.board && q.pickByNumber)) {
        ctx.addIssue({ code: "custom", message: `step ${s.id}: board ${s.board} non è un set pickByNumber` });
      }
    }
    for (const q of pack.questionSets) {
      const owner = pack.steps.find((s) => s.id === q.step);
      if (!owner) {
        ctx.addIssue({ code: "custom", message: `set ${q.id}: step ${q.step} non esiste` });
      } else if (q.substep !== null && q.substep >= (owner.substeps?.length ?? 0)) {
        ctx.addIssue({ code: "custom", message: `set ${q.id}: lo step ${q.step} non ha il sotto-step ${q.substep}` });
      }
    }
  });

export type GamePack = z.input<typeof gamePackSchema>;

/** Splits a validated pack into what every screen may read and what only the admin may. */
export function splitPack(input: GamePack): {
  id: string;
  title: string;
  content: GameContent;
  secrets: GameSecrets;
} {
  const pack = gamePackSchema.parse(input);
  const secrets: GameSecrets = { steps: {}, answers: {} };

  const steps = pack.steps.map(({ script, substeps, ...rest }) => {
    const substepScripts = substeps?.map((s) => s.script ?? null);
    if (script || substepScripts?.some(Boolean)) secrets.steps[rest.id] = { script, substepScripts };
    return {
      ...rest,
      substeps: substeps?.map(({ title, description }) => ({ title, description })),
    };
  });

  const questionSets = pack.questionSets.map(({ questions, ...rest }) => {
    secrets.answers[rest.id] = questions.map(({ answer, detail }) => (detail ? { answer, detail } : { answer }));
    return {
      ...rest,
      questions: questions.map(({ prompt, image, category }) => ({ prompt, image, category })),
    };
  });

  const content: GameContent = {
    subtitle: pack.subtitle,
    heroImage: pack.heroImage,
    teams: pack.teams,
    challenges: pack.challenges,
    registration: pack.registration,
    steps,
    questionSets,
  };

  // JSON round-trip drops the `undefined` keys so the stored rows stay tidy.
  return {
    id: pack.id,
    title: pack.title,
    content: JSON.parse(JSON.stringify(content)),
    secrets: JSON.parse(JSON.stringify(secrets)),
  };
}
