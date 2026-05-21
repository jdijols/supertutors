import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getInspectorOption, isInspectorEnabled } from "./inspector";

describe("Stately inspector flag", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("isInspectorEnabled is false by default", () => {
    expect(isInspectorEnabled()).toBe(false);
  });

  it("isInspectorEnabled is true with ?inspect=true", () => {
    window.history.replaceState({}, "", "/?inspect=true");
    expect(isInspectorEnabled()).toBe(true);
  });

  it("getInspectorOption returns undefined when disabled", () => {
    expect(getInspectorOption()).toBeUndefined();
  });

  // We don't actually invoke createBrowserInspector here — that opens a real
  // popup window pointed at stately.ai/inspect, which isn't appropriate for
  // a Vitest jsdom environment. The behavior is small enough that the
  // wiring above is the entire test surface; live verification happens in
  // the browser with ?inspect=true.
});
