"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wordmark } from "@/components/brand/Wordmark";
import { HeroImage } from "@/components/brand/HeroImage";
import { StepIntro } from "@/components/participant/steps/StepIntro";
import { StepName } from "@/components/participant/steps/StepName";
import { StepTeam } from "@/components/participant/steps/StepTeam";
import { StepBring } from "@/components/participant/steps/StepBring";
import { registerParticipant } from "@/lib/actions/participant";
import type { TeamId } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useGameContent } from "@/components/game/ActiveGameProvider";

type Step = "intro" | "name" | "team" | "bring";

interface RegistrationWizardProps {
  onRegistered: (participantId: string) => void;
}

export function RegistrationWizard({ onRegistered }: RegistrationWizardProps) {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [team, setTeam] = useState<TeamId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const content = useGameContent();
  // "Cosa porterai?" only for games that ask it.
  const asksBring = Boolean(content.registration?.bring);
  const stepOrder: Step[] = asksBring ? ["intro", "name", "team", "bring"] : ["intro", "name", "team"];

  async function register(teamId: TeamId, choice: { bringsFood: boolean; bringsDrink: boolean }) {
    setSubmitting(true);
    setError(null);
    const result = await registerParticipant({
      name,
      teamId,
      bringsFood: choice.bringsFood,
      bringsDrink: choice.bringsDrink,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onRegistered(result.participantId);
  }

  function handleBringSubmit(choice: { bringsFood: boolean; bringsDrink: boolean }) {
    if (team) register(team, choice);
  }

  const stepIndex = stepOrder.indexOf(step);

  return (
    <div className="flex min-h-dvh flex-col">
      {step === "intro" && content.heroImage ? (
        <HeroImage priority />
      ) : (
        <div className="flex justify-center px-6 pt-10">
          <Wordmark size="sm" />
        </div>
      )}

      <div className="flex w-full flex-1 flex-col items-center justify-between px-6 pb-10">
        <div className="flex w-full flex-1 items-center justify-center py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full justify-center"
            >
              {step === "intro" && <StepIntro onNext={() => setStep("name")} />}
              {step === "name" && (
                <StepName
                  initialValue={name}
                  onNext={(value) => {
                    setName(value);
                    setStep("team");
                  }}
                />
              )}
              {step === "team" && (
                <StepTeam
                  submitting={submitting}
                  error={asksBring ? null : error}
                  onNext={(value) => {
                    setTeam(value);
                    if (asksBring) setStep("bring");
                    else register(value, { bringsFood: false, bringsDrink: false });
                  }}
                />
              )}
              {step === "bring" && (
                <StepBring onSubmit={handleBringSubmit} submitting={submitting} error={error} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          {stepOrder.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i <= stepIndex ? "bg-gold-400" : "bg-ink-dim/20"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
