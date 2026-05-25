import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryProgressClient } from "./InMemoryProgressClient";
import type { ProgressHandle } from "./types";

/**
 * Contract test suite — runs against InMemoryProgressClient.
 * The same suite can be pointed at SupabaseProgressClient via
 * an env-gated factory (SUPABASE_TEST=true) once local Supabase
 * is set up.
 */
function createClient(): ProgressHandle {
  return new InMemoryProgressClient("user-1");
}

describe("ProgressClient contract", () => {
  let client: ProgressHandle;

  beforeEach(() => {
    client = createClient();
  });

  it("startSession returns a sessionId", async () => {
    const id = await client.startSession("asl");
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("endSession sets outcome", async () => {
    const id = await client.startSession("asl");
    // Should not throw
    await client.endSession(id, "win");
  });

  it("ending an already-ended session is idempotent", async () => {
    const id = await client.startSession("asl");
    await client.endSession(id, "win");
    // Second call should not throw or overwrite
    await client.endSession(id, "exit");
  });

  it("recordAttempt persists and updates mastery counters", async () => {
    const sessionId = await client.startSession("asl");
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "pass",
    });

    const mastery = await client.getMastery("asl");
    expect(mastery.length).toBe(1);
    expect(mastery[0].itemId).toBe("asl:HELLO");
    expect(mastery[0].passCount).toBe(1);
    expect(mastery[0].failCount).toBe(0);
    expect(mastery[0].status).toBe("practicing");
  });

  it("recordAttempt updates mastery to mastered after 3 passes", async () => {
    const sessionId = await client.startSession("asl");
    for (let i = 0; i < 3; i++) {
      await client.recordAttempt({
        sessionId,
        itemId: "asl:HELLO",
        result: "pass",
      });
    }

    const mastery = await client.getMastery("asl");
    expect(mastery[0].status).toBe("mastered");
    expect(mastery[0].passCount).toBe(3);
  });

  it("recordAttempt with skip sets needs_practice", async () => {
    const sessionId = await client.startSession("asl");
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "skip",
    });

    const mastery = await client.getMastery("asl");
    expect(mastery[0].status).toBe("needs_practice");
  });

  it("recordAttempt tracks hintFired and referenceVideoShown", async () => {
    const sessionId = await client.startSession("asl");
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "fail",
      hintFired: true,
      referenceVideoShown: true,
    });

    const recent = await client.getRecentActivity(1);
    expect(recent[0].hintFired).toBe(true);
    expect(recent[0].referenceVideoShown).toBe(true);
  });

  it("getRecentActivity returns attempts ordered by createdAt desc", async () => {
    const sessionId = await client.startSession("asl");
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "fail",
    });
    await client.recordAttempt({
      sessionId,
      itemId: "asl:THANK-YOU",
      result: "pass",
    });

    const recent = await client.getRecentActivity(10);
    expect(recent.length).toBe(2);
    // Most recent first
    expect(recent[0].itemId).toBe("asl:THANK-YOU");
    expect(recent[1].itemId).toBe("asl:HELLO");
  });

  it("getRecentActivity respects limit", async () => {
    const sessionId = await client.startSession("asl");
    for (let i = 0; i < 5; i++) {
      await client.recordAttempt({
        sessionId,
        itemId: `asl:SIGN-${i}`,
        result: "pass",
      });
    }

    const recent = await client.getRecentActivity(3);
    expect(recent.length).toBe(3);
  });

  it("getMastery filters by lesson slug", async () => {
    const aslSession = await client.startSession("asl");
    await client.recordAttempt({
      sessionId: aslSession,
      itemId: "asl:HELLO",
      result: "pass",
    });

    const freddySession = await client.startSession("freddy-fractions");
    await client.recordAttempt({
      sessionId: freddySession,
      itemId: "freddy:fractions-equivalence",
      result: "pass",
    });

    const aslMastery = await client.getMastery("asl");
    expect(aslMastery.length).toBe(1);
    expect(aslMastery[0].itemId).toBe("asl:HELLO");

    const freddyMastery = await client.getMastery("freddy-fractions");
    expect(freddyMastery.length).toBe(1);
    expect(freddyMastery[0].itemId).toBe("freddy:fractions-equivalence");
  });

  it("getMastery returns one entry per attempted item", async () => {
    const sessionId = await client.startSession("asl");
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "fail",
    });
    await client.recordAttempt({
      sessionId,
      itemId: "asl:HELLO",
      result: "pass",
    });
    await client.recordAttempt({
      sessionId,
      itemId: "asl:YES",
      result: "pass",
    });

    const mastery = await client.getMastery("asl");
    expect(mastery.length).toBe(2);
  });
});
