import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BEAT_TARGETS,
  buildBeatUrl,
  isDemoModeEnabled,
} from "./demoMode";

describe("BEAT_TARGETS", () => {
  it("maps each key 1-8 to a beat target", () => {
    for (let i = 1; i <= 8; i++) {
      expect(BEAT_TARGETS[i]).toBeDefined();
    }
  });

  it("key 6 maps to /lesson?beat=aha (the demo hero)", () => {
    expect(BEAT_TARGETS[6]).toEqual({
      path: "/lesson",
      beatQuery: "aha",
      beat: "aha",
    });
  });

  it("key 2 maps to /lesson with the skip-onboarding flag", () => {
    expect(BEAT_TARGETS[2].path).toBe("/lesson");
    expect(BEAT_TARGETS[2].beatQuery).toBe("skip=true");
  });
});

describe("buildBeatUrl", () => {
  it("returns the bare path when no beatQuery is set", () => {
    expect(buildBeatUrl(BEAT_TARGETS[1])).toBe("/");
  });

  it("appends ?beat=<value> when beatQuery is a plain string", () => {
    expect(buildBeatUrl(BEAT_TARGETS[6])).toBe("/lesson?beat=aha");
    expect(buildBeatUrl(BEAT_TARGETS[7])).toBe("/lesson?beat=check");
  });

  it("treats a beatQuery containing '=' as a raw query string", () => {
    expect(buildBeatUrl(BEAT_TARGETS[2])).toBe("/lesson?skip=true");
  });

  it("URL-encodes the beat query", () => {
    expect(
      buildBeatUrl({
        path: "/lesson",
        beatQuery: "weird value",
        beat: "splash",
      }),
    ).toBe("/lesson?beat=weird%20value");
  });
});

describe("isDemoModeEnabled", () => {
  const STORAGE_KEY = "supertutors:demoMode";

  beforeEach(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.history.replaceState({}, "", "/");
  });

  it("returns false by default", () => {
    expect(isDemoModeEnabled()).toBe(false);
  });

  it("returns true and persists when ?demo=true is in the URL", () => {
    window.history.replaceState({}, "", "/?demo=true");
    expect(isDemoModeEnabled()).toBe(true);
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe("1");
  });

  it("returns false and clears storage when ?demo=false is in the URL", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    window.history.replaceState({}, "", "/?demo=false");
    expect(isDemoModeEnabled()).toBe(false);
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("reads sessionStorage when the URL has no demo param", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    expect(isDemoModeEnabled()).toBe(true);
  });
});
