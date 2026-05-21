/**
 * Stately Inspector wiring (CC.4).
 *
 * The inspector opens a separate browser tab showing the actor's state +
 * transitions in real time — invaluable while authoring Stately exports
 * and verifying that the wired-up machine behaves as drawn.
 *
 * Enabled only when `?inspect=true` is in the URL. Auto-off in production
 * builds (the inspector spawns a window pointed at stately.ai/inspect).
 *
 * Usage in a component:
 *
 *   const [state, send] = useMachine(tutorMachine, {
 *     input: { name },
 *     inspect: getInspectorOption(),
 *   });
 *
 * `getInspectorOption()` returns `undefined` when disabled so the call is
 * always safe to thread through. The inspector itself is lazily created on
 * first use; subsequent calls return the cached instance.
 */

import { createBrowserInspector } from "@statelyai/inspect";

type InspectFunction = ReturnType<typeof createBrowserInspector>["inspect"];

let cachedInspect: InspectFunction | null = null;

export function isInspectorEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("inspect") === "true";
}

export function getInspectorOption(): InspectFunction | undefined {
  if (!isInspectorEnabled()) return undefined;
  if (cachedInspect) return cachedInspect;
  const inspector = createBrowserInspector({ autoStart: true });
  cachedInspect = inspector.inspect;
  return cachedInspect;
}
