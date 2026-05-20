import { LaurelMark } from "./LaurelMark";

type LockupVariant = "onDark" | "onLight";

interface SuperTutorsLockupProps {
  variant?: LockupVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Render the EDU/ACC subtag below the wordmark. Off by default. */
  showSubtag?: boolean;
}

const SIZE_CLASSES: Record<
  NonNullable<SuperTutorsLockupProps["size"]>,
  { line1: string; line2: string; mark: string; gap: string }
> = {
  sm: {
    line1: "text-[28px] sm:text-[32px]",
    line2: "text-[14px] sm:text-[16px]",
    mark: "w-10 h-10 sm:w-12 sm:h-12",
    gap: "gap-3 sm:gap-4",
  },
  md: {
    line1: "text-[44px] sm:text-[56px] md:text-[68px]",
    line2: "text-[22px] sm:text-[28px] md:text-[34px]",
    mark: "w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24",
    gap: "gap-5 sm:gap-7 md:gap-9",
  },
  lg: {
    line1: "text-[36px] sm:text-[64px] md:text-[88px] lg:text-[100px]",
    line2: "text-[18px] sm:text-[32px] md:text-[44px] lg:text-[50px]",
    mark: "w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-28 lg:h-28",
    gap: "gap-3 sm:gap-6 md:gap-8 lg:gap-10",
  },
};

export function SuperTutorsLockup({
  variant = "onDark",
  className,
  size = "lg",
  showSubtag = false,
}: SuperTutorsLockupProps) {
  const isOnDark = variant === "onDark";
  const inkHex = isOnDark ? "#FFFFFF" : "#1A1A1A";
  const textClass = isOnDark ? "text-white" : "text-sb-ink";
  const sizes = SIZE_CLASSES[size];

  // Thinner stroke + paint-order keeps the outline crisp without doubling the
  // interior contours as visibly as a heavier stroke would.
  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "1px",
    WebkitTextStrokeColor: inkHex,
    WebkitTextFillColor: "transparent",
    paintOrder: "stroke fill",
  };

  return (
    <div
      className={`flex items-center ${sizes.gap} ${className ?? ""}`}
      aria-label="SuperTutors"
    >
      <LaurelMark className={`shrink-0 ${sizes.mark}`} variant={variant} />
      <div className={`font-mono font-bold leading-[0.92] tracking-[-0.02em] ${textClass}`}>
        <div className={sizes.line1}>
          <span>SUPER</span>
          <span style={outlineStyle}>TUTORS</span>
        </div>
        {showSubtag && (
          <div className={`${sizes.line2} mt-[0.15em]`}>
            <span>EDU/</span>
            <span style={outlineStyle}>ACC</span>
          </div>
        )}
      </div>
    </div>
  );
}
