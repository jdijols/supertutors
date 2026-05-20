import { describe, expect, it } from "vitest";
import { splitDialogueLine } from "./dialogueSplit";

describe("splitDialogueLine — no {{NAME}}", () => {
  it("returns one segment with key as filename stem", () => {
    const r = splitDialogueLine(
      "aha_compare_prompt",
      "Beautiful! Now drag those two quarters next to a half.",
    );
    expect(r.hasNameSlot).toBe(false);
    expect(r.segments).toEqual([
      {
        filenameStem: "aha_compare_prompt",
        text: "Beautiful! Now drag those two quarters next to a half.",
      },
    ]);
  });
});

describe("splitDialogueLine — single {{NAME}} mid-line", () => {
  it("emits <key>_a and <key>_b for the surrounding text", () => {
    const r = splitDialogueLine(
      "aha_setup",
      "Hey {{NAME}}, want to see something cool?",
    );
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments).toEqual([
      { filenameStem: "aha_setup_a", text: "Hey" },
      { filenameStem: "aha_setup_b", text: ", want to see something cool?" },
    ]);
  });

  it("matches the real Beat 5 reveal shape", () => {
    const r = splitDialogueLine(
      "aha_reveal",
      "Whoa, {{NAME}}! Look at that — one half is the SAME as two quarters!",
    );
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments[0].filenameStem).toBe("aha_reveal_a");
    expect(r.segments[0].text).toBe("Whoa,");
    expect(r.segments[1].filenameStem).toBe("aha_reveal_b");
    expect(r.segments[1].text).toMatch(/^! Look at that/);
  });
});

describe("splitDialogueLine — {{NAME}} at edges", () => {
  it("omits the empty leading segment when line starts with {{NAME}}", () => {
    const r = splitDialogueLine("greet", "{{NAME}}, listen up!");
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments).toEqual([
      { filenameStem: "greet_b", text: ", listen up!" },
    ]);
  });

  it("omits the empty trailing segment when line ends with {{NAME}}", () => {
    const r = splitDialogueLine("call", "Hey there, {{NAME}}");
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments).toEqual([
      { filenameStem: "call_a", text: "Hey there," },
    ]);
  });
});

describe("splitDialogueLine — error cases", () => {
  it("throws on multiple {{NAME}} placeholders", () => {
    expect(() =>
      splitDialogueLine("oops", "Hi {{NAME}} and also {{NAME}} again"),
    ).toThrow(/more than one/);
  });
});
