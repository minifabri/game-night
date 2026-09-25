"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface QuizImageProps {
  src: string;
  className?: string;
  /** Compact fallback (admin thumbnails). */
  small?: boolean;
}

/**
 * A painting from public/quiz/arte. Plain <img> rather than next/image: the
 * files are dropped in by hand at any size and must just fit the frame. If a
 * file is missing the frame says which one, so it's caught before the party.
 */
export function QuizImage({ src, className, small }: QuizImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // A server-rendered <img> can fail before React attaches onError: catch that too.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  if (failedSrc === src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-dashed border-danger/50 bg-danger/5 text-center font-sans text-danger-soft",
          // the image's own classes only fit the tiny thumbnail frame
          small ? cn("h-full w-full p-1 text-[0.55rem]", className) : "aspect-[4/3] w-[60vw] max-w-3xl p-6 text-lg"
        )}
      >
        {small ? "manca" : `Immagine mancante: public${src}`}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={imgRef} src={src} alt="" draggable={false} onError={() => setFailedSrc(src)} className={className} />
  );
}
