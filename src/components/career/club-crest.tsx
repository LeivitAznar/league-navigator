import { clubById, type Club } from "@/lib/career-data";
import { cn } from "@/lib/utils";

interface Props {
  clubId?: string;
  club?: Club;
  size?: number;
  className?: string;
}

/**
 * Simple SVG "crest" — two-color shield with club initials.
 * Used everywhere a real crest asset would appear.
 */
export function ClubCrest({ clubId, club: clubProp, size = 40, className }: Props) {
  const club = clubProp ?? (clubId ? clubById(clubId) : undefined);
  if (!club) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("shrink-0 drop-shadow", className)}
      aria-label={club.name}
    >
      <path
        d="M24 2 L44 8 V24 C44 36 34 44 24 46 C14 44 4 36 4 24 V8 Z"
        fill={club.color}
        stroke={club.secondary}
        strokeWidth="2"
      />
      <path
        d="M24 2 L44 8 V16 L24 22 L4 16 V8 Z"
        fill={club.secondary}
        opacity="0.25"
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="Oswald, Impact, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill={club.secondary}
      >
        {club.short}
      </text>
    </svg>
  );
}
