import Image from "next/image";
import { cn } from "@/lib/cn";

interface HeroImageProps {
  className?: string;
  priority?: boolean;
}

/** Top crop of the event poster — title, dumbbells, couch — fading into the app's dark background. */
export function HeroImage({ className, priority }: HeroImageProps) {
  return (
    <div className={cn("relative w-full aspect-[1024/450] overflow-hidden", className)}>
      <Image
        src="/hero-poster.jpg"
        alt="Palestrati vs Divanisti — Game Night"
        fill
        priority={priority}
        className="object-cover object-top"
        sizes="(min-width: 768px) 640px, 100vw"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-void" />
    </div>
  );
}
