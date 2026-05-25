import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/platform/auth/useAuth";

/**
 * UserMenu — chrome avatar button + dropdown for signed-in users.
 *
 * Positioned left of the ExitButton/InfoToggle slot. Follows the
 * same sizing and visual language as MuteToggle / ExitButton.
 * "Active = dark" rule: dropdown-open → inverted.
 */
export function UserMenu() {
  const { user, status, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (status !== "signed-in" || !user) return null;

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="fixed top-4 right-36 sm:top-6 sm:right-[11rem] z-[60]">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 600, damping: 22 }}
        aria-label={open ? "Close user menu" : "Open user menu"}
        aria-expanded={open}
        data-testid="user-menu-toggle"
        data-cursor-pointing
        className={`
          w-14 h-14 sm:w-16 sm:h-16
          rounded-2xl border-2 border-sb-ink
          shadow-xl shadow-sb-accent-deep/25
          flex items-center justify-center cursor-pointer
          font-mono font-bold text-lg sm:text-xl
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
          ${
            open
              ? "bg-sb-ink text-white"
              : "bg-sb-paper text-sb-ink hover:bg-sb-paper-deep"
          }
        `}
      >
        {initial}
      </motion.button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute top-full right-0 mt-2
            w-56 rounded-xl
            bg-sb-card border border-sb-border
            shadow-xl shadow-sb-ink/20
            overflow-hidden
          "
        >
          <div className="px-4 py-3 border-b border-sb-border">
            <p className="font-mono text-sm font-bold text-sb-ink truncate">
              {displayName}
            </p>
            <p className="font-sans text-xs text-sb-muted truncate">
              {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              setOpen(false);
            }}
            className="
              w-full px-4 py-3 text-left
              font-mono text-xs uppercase tracking-[0.18em] text-sb-ink
              hover:bg-sb-surface transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-inset
            "
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
