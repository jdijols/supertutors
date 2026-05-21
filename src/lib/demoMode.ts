import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Beat } from "@/store/appStore";

/**
 * Demo mode (CC.1) — keyboard shortcuts for jumping between beats during
 * dev/QA + demo-video recording. Enabled by `?demo=true` on any URL, then
 * persisted to sessionStorage so it survives navigation. Disable with
 * `?demo=false` or by closing the tab.
 *
 * Keys (active globally while enabled):
 *   0 — CV preview (/preview/cv — hand tracking demo)
 *   1 — Beat 1 (Splash / landing CTA)
 *   2 — Beat 2 (Sandbox preview)
 *   3 — Beat 3 (Vocab — TBD; lands on lesson placeholder)
 *   4 — Beat 4 (First Guest — TBD)
 *   5 — Beat 5 (Two Guests — TBD)
 *   6 — Beat 6 (AHA — vertical-slice target)
 *   7 — Beat 7 (Check for Understanding — TBD)
 *   8 — Beat 8 (Win — TBD)
 *   C — Sandbox with CV mode (/preview/sandbox?cv=true)
 *   Shift+R — reload current page
 *
 * Beat 6 wiring (the only one with a state machine today) reads `?beat=aha`
 * from the URL and seeds the actor accordingly. The other targets are
 * scaffolded routes — they'll respect their own beat query param once
 * authored in Stately.
 */

const STORAGE_KEY = "supertutors:demoMode";

interface BeatTarget {
  /** Where to navigate. */
  path: string;
  /** Optional `?beat=` query param to seed the lesson state machine. */
  beatQuery?: string;
  /** Matching `Beat` from the app store, used for the indicator copy. */
  beat: Beat;
}

export const BEAT_TARGETS: Record<number, BeatTarget> = {
  1: { path: "/", beat: "splash" },
  2: { path: "/preview/sandbox", beat: "sandbox" },
  3: { path: "/lesson", beatQuery: "welcomeTour", beat: "welcomeTour" },
  4: { path: "/lesson", beatQuery: "firstGuest", beat: "firstGuest" },
  5: { path: "/lesson", beatQuery: "twoGuests", beat: "twoGuests" },
  6: { path: "/lesson", beatQuery: "aha", beat: "aha" },
  7: { path: "/lesson", beatQuery: "check", beat: "check" },
  8: { path: "/lesson", beatQuery: "win", beat: "win" },
};

/** Reads the demo-mode flag from `?demo=…` and persists it across navigation. */
export function isDemoModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get("demo");
  if (explicit === "true") {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    return true;
  }
  if (explicit === "false") {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return false;
  }
  return window.sessionStorage.getItem(STORAGE_KEY) === "1";
}

/** Builds the URL string for a beat target (path + optional ?beat=… ). */
export function buildBeatUrl(target: BeatTarget): string {
  if (!target.beatQuery) return target.path;
  return `${target.path}?beat=${encodeURIComponent(target.beatQuery)}`;
}

/**
 * React hook: installs the global keyboard shortcuts when demo mode is on.
 * Safe to mount in app root — no-ops when disabled. Returns `{ enabled }`
 * so the indicator badge can render conditionally.
 */
export function useDemoMode(): { enabled: boolean } {
  const [enabled, setEnabled] = useState<boolean>(isDemoModeEnabled);
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs / contenteditable / textareas.
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      // Shift+R → hard reload current page.
      if (e.shiftKey && (e.key === "R" || e.key === "r")) {
        e.preventDefault();
        window.location.reload();
        return;
      }
      // Key 0 → CV preview; key C → sandbox with CV mode
      if (e.key === '0') {
        e.preventDefault();
        navigate('/preview/cv');
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        navigate('/preview/sandbox?cv=true');
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 8) {
        const target = BEAT_TARGETS[n];
        if (!target) return;
        e.preventDefault();
        navigate(buildBeatUrl(target));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, navigate]);

  // Re-check the flag on each render so toggling `?demo=false` mid-session
  // takes effect immediately on next route change.
  useEffect(() => {
    const next = isDemoModeEnabled();
    if (next !== enabled) setEnabled(next);
  });

  return { enabled };
}
