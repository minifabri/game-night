import { cn } from "@/lib/cn";

interface WordmarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: {
    title: "text-lg sm:text-xl tracking-[0.14em]",
    sub: "text-[0.6rem] tracking-[0.5em]",
    gap: "gap-1",
  },
  md: {
    title: "text-2xl sm:text-3xl tracking-[0.12em]",
    sub: "text-[0.65rem] tracking-[0.55em]",
    gap: "gap-1.5",
  },
  lg: {
    title: "text-4xl sm:text-5xl tracking-[0.1em]",
    sub: "text-xs sm:text-sm tracking-[0.6em]",
    gap: "gap-2",
  },
  xl: {
    title: "text-6xl sm:text-7xl lg:text-8xl tracking-[0.08em]",
    sub: "text-sm sm:text-base tracking-[0.7em]",
    gap: "gap-3",
  },
};

/** The persistent "PALESTRATI VS DIVANISTI / GAME NIGHT" identity mark. */
export function Wordmark({ size = "md", className }: WordmarkProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex flex-col items-center text-center", s.gap, className)}>
      <p
        className={cn(
          "font-display font-medium text-cream leading-none text-balance",
          s.title
        )}
      >
        Palestrati <span className="text-gold-400 italic">vs</span> Divanisti
      </p>
      <p className={cn("font-sans uppercase text-gold-400/90", s.sub)}>Game Night</p>
    </div>
  );
}
