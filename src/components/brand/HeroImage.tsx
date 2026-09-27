"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { useGameContent } from "@/components/game/ActiveGameProvider";

interface HeroImageProps {
  className?: string;
  priority?: boolean;
}

/** Top crop of the active game's poster, fading into the app's dark background. */
export function HeroImage({ className, priority }: HeroImageProps) {
  const content = useGameContent();
  if (!content.heroImage) return null;
  return (
    <div className={cn("relative w-full aspect-[1024/450] overflow-hidden", className)}>
      <Image
        src={content.heroImage}
        alt={`${content.teams.a.name} vs ${content.teams.b.name}`}
        fill
        priority={priority}
        className="object-cover object-top"
        sizes="(min-width: 768px) 640px, 100vw"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-void" />
    </div>
  );
}
