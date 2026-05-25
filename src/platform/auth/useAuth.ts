import { supabase } from "@/lib/supabase";
import { usePlatformStore } from "@/platform/stores/platformStore";

/** Imperative auth actions — usable from hooks and from useActionState form actions. */

export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return {};
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) return { error: error.message };
  return {};
}

export async function signOut(): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signOut();
  if (error) return { error: error.message };
  return {};
}

/**
 * React hook — reads auth state from the platform store.
 * Actions are plain async functions (not hooks) so they work
 * inside React 19 useActionState form actions too.
 */
export function useAuth() {
  const user = usePlatformStore((s) => s.user);
  const session = usePlatformStore((s) => s.session);
  const status = usePlatformStore((s) => s.authStatus);

  return { user, session, status, signIn, signUp, signOut };
}
