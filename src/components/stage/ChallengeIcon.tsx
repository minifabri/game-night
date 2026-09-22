import type { ChallengeId } from "@/lib/types";

interface ChallengeIconProps {
  id: ChallengeId;
  className?: string;
}

/** Minimal line icons echoing the event poster's per-challenge glyphs. */
export function ChallengeIcon({ id, className }: ChallengeIconProps) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    case "quiz":
      return (
        <svg {...props} aria-hidden="true">
          <path d="M9 4.5a4 4 0 0 1 5.6 3.6c0 2-1.8 2.4-2.3 3.7-.2.5-.3 1-.3 1.7" />
          <path d="M12 17.5h.01" />
          <path d="M7.5 8.5a4.5 4.5 0 0 1 .6-2.2M16.5 8.5a4.5 4.5 0 0 1-.6-2.2" />
        </svg>
      );
    case "creativity":
      return (
        <svg {...props} aria-hidden="true">
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.2 2.2h4.8c.1-.9.6-1.7 1.2-2.2A6 6 0 0 0 12 3Z" />
        </svg>
      );
    case "physical":
      return (
        <svg {...props} aria-hidden="true">
          <path d="M4 12h1.5M18.5 12H20" />
          <rect x="2" y="9.5" width="2.5" height="5" rx="0.8" />
          <rect x="19.5" y="9.5" width="2.5" height="5" rx="0.8" />
          <rect x="5.5" y="8" width="2" height="8" rx="0.6" />
          <rect x="16.5" y="8" width="2" height="8" rx="0.6" />
          <path d="M7.5 12h9" />
        </svg>
      );
    case "courage":
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="12" cy="9" r="1.6" />
          <ellipse cx="12" cy="13.8" rx="2.4" ry="3.1" />
          <path d="M9.6 11.3 5 9.3M9.3 13.8H4M9.6 16.3 5 18.5M14.4 11.3 19 9.3M14.7 13.8H20M14.4 16.3 19 18.5" />
        </svg>
      );
    case "finalissima":
      return (
        <svg {...props} aria-hidden="true">
          <path d="M4 20V13a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7" />
          <path d="M15 20V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v11" />
          <path d="M3 20h18" />
        </svg>
      );
  }
}
