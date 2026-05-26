import { describe, it, expect } from "vitest";
import { computeMasteryStatus, getLessonForItem, MASTERY_LOOKBACK } from "./mastery";
import type { AttemptResult } from "./types";

describe("getLessonForItem", () => {
  it("recognizes ASL items by `asl:` prefix", () => {
    expect(getLessonForItem("asl:A")).toBe("asl");
    expect(getLessonForItem("asl:HELLO")).toBe("asl");
  });

  it("recognizes Freddy items by `freddy:` prefix", () => {
    expect(getLessonForItem("freddy:half")).toBe("freddy-fractions");
    expect(getLessonForItem("freddy:fractions-equivalence")).toBe(
      "freddy-fractions",
    );
  });

  it("returns null for unknown prefixes", () => {
    expect(getLessonForItem("unknown:thing")).toBe(null);
    expect(getLessonForItem("no-colon-here")).toBe(null);
  });
});

describe("MASTERY_LOOKBACK", () => {
  it("is at least 6 so both ASL rules can be evaluated", () => {
    expect(MASTERY_LOOKBACK).toBeGreaterThanOrEqual(6);
  });
});

// Helper: recent attempts list. First item is NEWEST.
function attempts(...results: AttemptResult[]): AttemptResult[] {
  return results;
}

describe("computeMasteryStatus — sticky mastery", () => {
  it("returns mastered if existing status is mastered, regardless of new attempts", () => {
    expect(
      computeMasteryStatus("asl:A", attempts("fail", "fail", "fail"), "mastered"),
    ).toBe("mastered");
  });

  it("returns mastered for sticky even when no attempts at all", () => {
    expect(computeMasteryStatus("asl:A", [], "mastered")).toBe("mastered");
  });
});

describe("computeMasteryStatus — ASL rules", () => {
  it("returns not_started with no attempts", () => {
    expect(computeMasteryStatus("asl:A", [], null)).toBe("not_started");
  });

  it("returns practicing after a single pass", () => {
    expect(computeMasteryStatus("asl:A", attempts("pass"), null)).toBe(
      "practicing",
    );
  });

  it("returns practicing after a single fail", () => {
    expect(computeMasteryStatus("asl:A", attempts("fail"), null)).toBe(
      "practicing",
    );
  });

  it("returns mastered after 3 consecutive passes (Rule A)", () => {
    expect(
      computeMasteryStatus("asl:A", attempts("pass", "pass", "pass"), null),
    ).toBe("mastered");
  });

  it("does NOT trigger Rule A if last 3 include a fail", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "fail", "pass", "pass"),
        null,
      ),
    ).toBe("practicing");
  });

  it("returns mastered when 5 of last 6 are pass (Rule B)", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "fail", "pass", "pass", "pass", "pass"),
        null,
      ),
    ).toBe("mastered");
  });

  it("returns mastered when 6 of last 6 are pass (Rule B, trivially)", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "pass", "pass", "pass", "pass", "pass"),
        null,
      ),
    ).toBe("mastered");
  });

  it("does NOT trigger Rule B with only 4/6 passes", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "fail", "pass", "fail", "pass", "pass"),
        null,
      ),
    ).toBe("practicing");
  });

  it("does NOT trigger Rule B with fewer than 6 scored attempts", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "pass", "fail", "pass", "pass"),
        null,
      ),
    ).toBe("practicing");
  });

  it("ignores skip and uncertain when applying the rules", () => {
    // 3 passes with skips/uncertains in between should still pass Rule A
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("pass", "skip", "pass", "uncertain", "pass"),
        null,
      ),
    ).toBe("mastered");
  });

  it("flags newest skip as needs_practice", () => {
    expect(
      computeMasteryStatus("asl:A", attempts("skip", "pass"), null),
    ).toBe("needs_practice");
  });

  it("does not regress mastered when a fail follows (sticky)", () => {
    expect(
      computeMasteryStatus(
        "asl:A",
        attempts("fail", "pass", "pass", "pass"),
        "mastered",
      ),
    ).toBe("mastered");
  });
});

describe("computeMasteryStatus — Freddy Fractions rules", () => {
  it("returns not_started with no attempts", () => {
    expect(computeMasteryStatus("freddy:half", [], null)).toBe(
      "not_started",
    );
  });

  it("returns mastered after a single pass", () => {
    expect(
      computeMasteryStatus("freddy:half", attempts("pass"), null),
    ).toBe("mastered");
  });

  it("returns practicing after a fail with no passes", () => {
    expect(
      computeMasteryStatus("freddy:half", attempts("fail"), null),
    ).toBe("practicing");
  });

  it("returns mastered even with fails after the first pass", () => {
    expect(
      computeMasteryStatus(
        "freddy:half",
        attempts("fail", "fail", "pass"),
        null,
      ),
    ).toBe("mastered");
  });

  it("flags newest skip as needs_practice", () => {
    expect(
      computeMasteryStatus("freddy:half", attempts("skip"), null),
    ).toBe("needs_practice");
  });
});

describe("computeMasteryStatus — unknown lessons", () => {
  it("falls back to any-pass-mastered for unknown prefixes", () => {
    expect(
      computeMasteryStatus("unknown:item", attempts("pass"), null),
    ).toBe("mastered");
  });

  it("returns practicing with a fail and no pass on unknown lessons", () => {
    expect(
      computeMasteryStatus("unknown:item", attempts("fail"), null),
    ).toBe("practicing");
  });
});
