import { useMemo } from "react";
import { useAuth } from "@/platform/auth/useAuth";
import { SupabaseProgressClient } from "./SupabaseProgressClient";
import type { ProgressHandle } from "./types";

/**
 * React hook returning a ProgressHandle bound to the current user.
 * Returns undefined when not signed in.
 */
export function useProgress(): ProgressHandle | undefined {
  const { user, status } = useAuth();

  return useMemo(() => {
    if (status !== "signed-in" || !user) return undefined;
    return new SupabaseProgressClient(user.id);
  }, [status, user]);
}
