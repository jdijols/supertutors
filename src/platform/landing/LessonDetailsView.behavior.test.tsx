import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LessonDetailsView } from "./LessonDetailsView";
import { InMemoryProgressClient } from "@/platform/progress/InMemoryProgressClient";
import { freddyFractionsLesson } from "@/lessons/freddy-fractions/index";
import { aslLesson } from "@/lessons/asl/index";

/** Read a MetricTile's value via its visible label. The tile renders the
 *  value above the label inside the same `<div>` parent. */
function metricValue(label: string): string {
  const labelEl = screen.getByText(label);
  const tile = labelEl.parentElement as HTMLElement;
  return within(tile)
    .getAllByText((_text, node) => node?.tagName === "P")
    .find((p) => p !== labelEl)!.textContent!.trim();
}

/**
 * Black-box test of the details card surface using a real
 * InMemoryProgressClient driven through the same code path the live
 * lesson uses. If recordAttempt → getMastery → details-card numbers
 * ever stops adding up, this test fails.
 */
async function recordAndLoad(opts: {
  lessonSlug: string;
  attempts: { itemId: string; result: "pass" | "fail" | "uncertain" | "skip" }[];
}) {
  const client = new InMemoryProgressClient("test-user");
  const sessionId = await client.startSession(opts.lessonSlug);
  for (const a of opts.attempts) {
    await client.recordAttempt({ sessionId, itemId: a.itemId, result: a.result });
  }
  return client.getMastery(opts.lessonSlug);
}

describe("LessonDetailsView — metrics reflect real mastery data", () => {
  it("Freddy: 2 passes + 1 fail → Mastered 2/5, Attempts 3", async () => {
    const details = freddyFractionsLesson.meta.details!;
    const mastery = await recordAndLoad({
      lessonSlug: "freddy-fractions",
      attempts: [
        { itemId: "freddy:count-halves", result: "pass" },
        { itemId: "freddy:notation-half", result: "pass" },
        { itemId: "freddy:name-quarter", result: "fail" },
      ],
    });

    render(
      <LessonDetailsView
        slug="freddy-fractions"
        eyebrow="Lesson 01"
        durationLabel="~10 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={mastery}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: () => {} }}
      />,
    );

    expect(metricValue("Mastered")).toBe("2 / 5");
    expect(metricValue("Attempts")).toBe("3");
    expect(screen.getByText(/% complete/)).toHaveTextContent("40% complete");
  });

  it("ASL: 3 passes on 'A' marks it mastered (rule: 3 in a row)", async () => {
    const details = aslLesson.meta.details!;
    const mastery = await recordAndLoad({
      lessonSlug: "asl",
      attempts: [
        { itemId: "asl:A", result: "pass" },
        { itemId: "asl:A", result: "pass" },
        { itemId: "asl:A", result: "pass" },
        { itemId: "asl:B", result: "pass" },
      ],
    });

    render(
      <LessonDetailsView
        slug="asl"
        eyebrow="Lesson 02"
        durationLabel="~15 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={mastery}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: () => {} }}
      />,
    );

    // 1 mastered out of 34 (26 letters + 8 word signs)
    expect(metricValue("Mastered")).toBe(`1 / ${details.catalog.length}`);
    // 4 attempts total (3 on A + 1 on B)
    expect(metricValue("Attempts")).toBe("4");
  });

  it("0 attempts → Mastered 0/N, Last practiced 'Never'", async () => {
    const details = freddyFractionsLesson.meta.details!;
    render(
      <LessonDetailsView
        slug="freddy-fractions"
        eyebrow="Lesson 01"
        durationLabel="~10 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={[]}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: () => {} }}
      />,
    );

    expect(metricValue("Mastered")).toBe("0 / 5");
    expect(metricValue("Last practiced")).toBe("Never");
    expect(screen.getByText(/% complete/)).toHaveTextContent("0% complete");
  });

  it("ASL: clicking an item pill fires onItemSelect with the item id", async () => {
    const details = aslLesson.meta.details!;
    const onItemSelect = vi.fn();
    render(
      <LessonDetailsView
        slug="asl"
        eyebrow="Lesson 02"
        durationLabel="~15 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={[]}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: () => {} }}
        onItemSelect={onItemSelect}
      />,
    );
    const user = userEvent.setup();
    // "C — not started" is the title attribute we render on the pill.
    await user.click(screen.getByRole("button", { name: /^C —/i }));
    expect(onItemSelect).toHaveBeenCalledWith("asl:C");
  });

  it("Freddy: pills are inert when onItemSelect is omitted", () => {
    const details = freddyFractionsLesson.meta.details!;
    render(
      <LessonDetailsView
        slug="freddy-fractions"
        eyebrow="Lesson 01"
        durationLabel="~10 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={[]}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: () => {} }}
      />,
    );
    // No item pill should expose a button role — only the CTA buttons.
    const buttons = screen.getAllByRole("button");
    const pillButtons = buttons.filter((b) =>
      /^Count the halves|Write|Name the quarter/i.test(b.getAttribute("title") ?? ""),
    );
    expect(pillButtons).toHaveLength(0);
  });

  it("primary + secondary CTAs are clickable", async () => {
    const details = freddyFractionsLesson.meta.details!;
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(
      <LessonDetailsView
        slug="freddy-fractions"
        eyebrow="Lesson 01"
        durationLabel="~10 min"
        titleLines={details.titleLines}
        subtitle="sub"
        mastery={[]}
        catalog={details.catalog}
        metaLabel="meta"
        onClose={() => {}}
        primaryCta={{ label: "Continue lesson", onClick: onPrimary }}
        secondaryCta={{ label: "Explore sandbox", onClick: onSecondary }}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /continue lesson/i }));
    await user.click(screen.getByRole("button", { name: /explore sandbox/i }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onSecondary).toHaveBeenCalledOnce();
  });
});
