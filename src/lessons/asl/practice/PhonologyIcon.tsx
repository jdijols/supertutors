/**
 * PhonologyIcon — small SVG illustrations for phonological categories.
 *
 * Used inside HintCard's four-quadrant grid. Each icon is a simple,
 * cohesive line illustration matching the SuperTutors brand.
 */

export function HandshapeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Simplified open hand */}
      <path d="M8 14 L8 8 Q8 6 10 6 Q12 6 12 8 L12 11" />
      <path d="M12 11 L12 5 Q12 3 14 3 Q16 3 16 5 L16 12" />
      <path d="M16 12 L16 6 Q16 4 18 4 Q20 4 20 6 L20 14 Q20 20 14 21 Q8 22 6 18 L6 14 Q6 12 8 14" />
    </svg>
  );
}

export function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Body silhouette with target marker */}
      <circle cx="12" cy="5" r="3" />
      <path d="M8 10 H16 Q18 10 18 13 L18 20 H6 L6 13 Q6 10 8 10" />
      <circle cx="12" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function MovementIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Curved arrow showing movement */}
      <path d="M4 12 Q4 4 12 4 Q20 4 20 12" />
      <path d="M17 9 L20 12 L17 15" />
    </svg>
  );
}

export function PalmOrientationIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Palm with direction arrow */}
      <rect x="6" y="4" width="12" height="14" rx="3" />
      <path d="M12 21 L12 18" />
      <path d="M9 18 L12 21 L15 18" />
    </svg>
  );
}
