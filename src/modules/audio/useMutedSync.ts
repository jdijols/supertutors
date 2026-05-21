import { useEffect } from "react";
import { Howler } from "howler";
import { useAppStore } from "@/store/appStore";

/**
 * useMutedSync — mirrors the appStore's `muted` flag onto Howler's global
 * mute. Howler.mute(true) silences all current and future Howl instances at
 * the library level, so the AudioEngine doesn't need any plumbing of its own.
 *
 * Mount once near the top of the React tree (App.tsx) so the sync follows the
 * app lifetime, independent of which route is rendered.
 */
export function useMutedSync(): void {
  const muted = useAppStore((s) => s.muted);
  useEffect(() => {
    Howler.mute(muted);
  }, [muted]);
}
