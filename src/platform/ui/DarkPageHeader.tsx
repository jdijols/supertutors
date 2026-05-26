import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LaurelMark } from "@/platform/landing/LaurelMark";
import { UserMenu } from "@/platform/ui/UserMenu";

interface DarkPageHeaderProps {
  /**
   * Page-specific controls rendered before the always-present
   * UserMenu + MuteToggle pair on the right. Use the shared dark-surface
   * control vocabulary (border-white/15, bg-white/5, rounded-xl,
   * font-mono uppercase tracking, focus-visible:ring-sb-accent) so the
   * extended controls read as one system with the global ones.
   */
  rightSlot?: ReactNode;
}

/**
 * Shared chrome for the dark-surface secondary pages (/workflow,
 * /lessons/acutis). The Laurel mark is the back-to-home affordance —
 * clicking it navigates to /. No separate text/icon back button; the
 * logo carries the wayfinding the way it does in most product chrome.
 * App.tsx skips its global fixed chrome on these routes, so this
 * header owns navigation for them.
 */
export function DarkPageHeader({ rightSlot }: DarkPageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-5 md:py-6 shrink-0 border-b border-white/10">
      <Link
        to="/"
        aria-label="Back to SuperTutors home"
        data-cursor-pointing
        className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink"
      >
        <motion.span
          className="inline-flex"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
        >
          <LaurelMark className="w-11 h-11 shrink-0" variant="onDark" title="SuperTutors" />
        </motion.span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        {rightSlot}
        <UserMenu inline />
      </div>
    </header>
  );
}
