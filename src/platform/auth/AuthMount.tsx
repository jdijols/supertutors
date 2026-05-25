import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePlatformStore } from "@/platform/stores/platformStore";

/**
 * AuthMount — effect-only component mounted once in App.
 *
 * 1. Reads the current session synchronously on mount.
 * 2. Subscribes to onAuthStateChange for the lifetime of the app.
 * 3. Pushes session changes into platformStore so all subscribers
 *    (UserMenu, landing branches, LessonHost) re-render together.
 */
export function AuthMount() {
  const setSession = usePlatformStore((s) => s.setSession);

  useEffect(() => {
    // Hydrate from existing session (persisted in localStorage by Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Live subscription — covers sign-in, sign-out, token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return null;
}
