import { describe, expect, it } from "vitest";
import { splitDialogueLine } from "./dialogueSplit";

describe("splitDialogueLine — single sentence, no {{NAME}}", () => {
  it("returns one static segment with key as filename stem", () => {
    const r = splitDialogueLine(
      "intro",
      "Beautiful — now drag those two quarters next to a half.",
    );
    expect(r.hasNameSlot).toBe(false);
    expect(r.segments).toEqual([
      {
        kind: "static",
        filenameStem: "intro",
        text: "Beautiful — now drag those two quarters next to a half.",
      },
    ]);
  });
});

describe("splitDialogueLine — multi-sentence, no {{NAME}}", () => {
  it("splits at periods and numbers the stems", () => {
    const r = splitDialogueLine(
      "intro4",
      "Deliveries go in the box. Have a play around.",
    );
    expect(r.hasNameSlot).toBe(false);
    expect(r.segments).toEqual([
      { kind: "static", filenameStem: "intro4_s0", text: "Deliveries go in the box." },
      { kind: "static", filenameStem: "intro4_s1", text: "Have a play around." },
    ]);
  });

  it("handles a mix of ?, !, . terminators", () => {
    const r = splitDialogueLine(
      "aha",
      "Want to see something cool? I just pulled this fresh pizza. Bellissimo!",
    );
    expect(r.segments.map((s) => s.kind === "static" && s.text)).toEqual([
      "Want to see something cool?",
      "I just pulled this fresh pizza.",
      "Bellissimo!",
    ]);
  });

  it("does NOT split on em-dash or comma", () => {
    const r = splitDialogueLine(
      "x",
      "Look at that — one half is the same as two quarters.",
    );
    expect(r.segments).toHaveLength(1);
  });
});

describe("splitDialogueLine — {{NAME}} only, no sentence split", () => {
  it("emits name slot only when the line is the name and a single sentence", () => {
    const r = splitDialogueLine("greet", "{{NAME}}, listen up!");
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments).toEqual([
      { kind: "name" },
      { kind: "static", filenameStem: "greet", text: ", listen up!" },
    ]);
  });

  it("places the name in the middle when text wraps it", () => {
    const r = splitDialogueLine("hi", "Hey {{NAME}}, want to see this?");
    expect(r.segments).toEqual([
      { kind: "static", filenameStem: "hi_s0", text: "Hey" },
      { kind: "name" },
      { kind: "static", filenameStem: "hi_s1", text: ", want to see this?" },
    ]);
  });

  it("omits the empty trailing segment when the line ends with {{NAME}}", () => {
    const r = splitDialogueLine("call", "Hey there, {{NAME}}");
    expect(r.segments).toEqual([
      { kind: "static", filenameStem: "call", text: "Hey there," },
      { kind: "name" },
    ]);
  });
});

describe("splitDialogueLine — {{NAME}} + multi-sentence", () => {
  it("splits the post-name text into sentence segments", () => {
    const r = splitDialogueLine(
      "onboarding_response",
      "{{NAME}}, beautiful name. Alright, lemme show ya how this works.",
    );
    expect(r.hasNameSlot).toBe(true);
    expect(r.segments).toEqual([
      { kind: "name" },
      {
        kind: "static",
        filenameStem: "onboarding_response_s0",
        text: ", beautiful name.",
      },
      {
        kind: "static",
        filenameStem: "onboarding_response_s1",
        text: "Alright, lemme show ya how this works.",
      },
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
