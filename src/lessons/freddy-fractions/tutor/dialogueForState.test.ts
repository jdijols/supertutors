import { describe, expect, it } from "vitest";
import { dialogueKeyForState } from "./dialogueForState";

describe("dialogueKeyForState", () => {
  it("maps aha.setup to aha_setup", () => {
    expect(dialogueKeyForState({ aha: "setup" })).toBe("aha_setup");
  });

  it("returns null for idle wait states", () => {
    expect(dialogueKeyForState({ aha: "waiting_for_slice" })).toBeNull();
    expect(dialogueKeyForState({ aha: "waiting_for_compare" })).toBeNull();
  });

  it("maps recovery states to their dialogue keys", () => {
    expect(dialogueKeyForState({ aha: "wrong_slice" })).toBe("aha_wrong_slice");
    expect(dialogueKeyForState({ aha: "stuck" })).toBe("aha_stuck");
    expect(dialogueKeyForState({ aha: "not_equal" })).toBe("aha_not_equal");
    expect(dialogueKeyForState({ aha: "stuck_compare" })).toBe(
      "aha_stuck_compare",
    );
  });

  it("maps celebrating to aha_reveal (the hero line)", () => {
    expect(dialogueKeyForState({ aha: "celebrating" })).toBe("aha_reveal");
  });

  it("returns null for aha_triggered (animation, not dialogue)", () => {
    expect(dialogueKeyForState({ aha: "aha_triggered" })).toBeNull();
  });

  it("returns null for terminal done", () => {
    expect(dialogueKeyForState({ aha: "done" })).toBeNull();
  });

  it("returns null for top-level beats with no dialogue map yet", () => {
    expect(dialogueKeyForState("check")).toBeNull();
    expect(dialogueKeyForState("win")).toBeNull();
  });

  it("returns null for unknown sub-states (defensive)", () => {
    expect(dialogueKeyForState({ aha: "lol_what" })).toBeNull();
  });
});
