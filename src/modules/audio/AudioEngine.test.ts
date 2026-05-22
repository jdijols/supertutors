import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine, type HowlLike } from "./AudioEngine";

interface FakeHowl extends HowlLike {
  url: string;
  finish: () => void;
  fail: () => void;
}

function makeHowlFactory() {
  const created: FakeHowl[] = [];
  const factory = (
    src: string,
    onend: () => void,
    onError: () => void,
  ): HowlLike => {
    const howl: FakeHowl = {
      url: src,
      play: vi.fn(),
      stop: vi.fn(),
      finish: onend,
      fail: onError,
    };
    created.push(howl);
    return howl;
  };
  return { factory, created };
}

/**
 * Make an engine with a stubbed dialogue lookup so each test can declare
 * the exact line text it needs to exercise. `interSegmentGapMs: 0` skips
 * the timer-based mouth-close gap so the segment chain plays in a tight
 * synchronous burst — keeps tests free of fake-timer plumbing.
 */
function makeEngine(
  factory: ReturnType<typeof makeHowlFactory>["factory"],
  lines: Record<string, string>,
  extras: { resolveNameUrl?: (n: string) => Promise<string> } = {},
) {
  return new AudioEngine({
    createHowl: factory,
    lineLookup: (key) => lines[key],
    interSegmentGapMs: 0,
    resolveNameUrl: extras.resolveNameUrl,
  });
}

describe("AudioEngine — single-sentence static line", () => {
  it("plays /audio/<key>.mp3 once and calls onDone after it ends", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, { test: "Just one sentence." });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "test", onDone });

    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/test.mp3");
    expect(created[0].play).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();

    created[0].finish();
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("AudioEngine — multi-sentence static line", () => {
  it("plays one MP3 per sentence in order, only fires onDone after the last", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, {
      tour: "Here's the tool picker. Here is the add pizza button. Here's the delivery box.",
    });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "tour", onDone });

    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/tour_s0.mp3");
    created[0].finish();

    expect(created).toHaveLength(2);
    expect(created[1].url).toBe("/audio/tour_s1.mp3");
    created[1].finish();

    expect(created).toHaveLength(3);
    expect(created[2].url).toBe("/audio/tour_s2.mp3");
    expect(onDone).not.toHaveBeenCalled();
    created[2].finish();

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("fires onSpeakingChange(false) at every period (mouth-close beat)", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, {
      x: "First sentence. Second sentence. Third sentence.",
    });
    const speakingLog: boolean[] = [];

    await engine.play({
      dialogueKey: "x",
      onDone: vi.fn(),
      onSpeakingChange: (b) => speakingLog.push(b),
    });

    created[0].finish();
    created[1].finish();
    created[2].finish();

    // Expected pattern: true (s0) → false (gap) → true (s1) → false (gap)
    // → true (s2) → false (done).
    expect(speakingLog).toEqual([true, false, true, false, true, false]);
  });
});

describe("AudioEngine — name-injected line", () => {
  it("queues static + name + static in order, name MP3 resolved at runtime", async () => {
    const { factory, created } = makeHowlFactory();
    const resolveNameUrl = vi.fn(async () => "blob:name-mp3");
    const engine = makeEngine(
      factory,
      { hi: "Hey {{NAME}}, want to see this?" },
      { resolveNameUrl },
    );
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "hi",
      name: "Jason",
      onDone,
    });

    expect(resolveNameUrl).toHaveBeenCalledWith("Jason");
    // Three segments: "Hey", name, ", want to see this?"
    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/hi_s0.mp3");
    created[0].finish();

    expect(created).toHaveLength(2);
    expect(created[1].url).toBe("blob:name-mp3");
    created[1].finish();

    expect(created).toHaveLength(3);
    expect(created[2].url).toBe("/audio/hi_s1.mp3");
    created[2].finish();

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("plays the static segments without the name when name resolution rejects", async () => {
    // When /api/voice is unavailable (vite dev with no shim, prod hiccup),
    // the engine still plays the static halves so the kid hears
    // everything except the personalization — better than silence.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { factory, created } = makeHowlFactory();
    const resolveNameUrl = vi.fn(async () => {
      throw new Error("503");
    });
    const engine = makeEngine(
      factory,
      { greet: "Hey {{NAME}}, welcome!" },
      { resolveNameUrl },
    );
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "greet",
      name: "Jason",
      onDone,
    });

    // Two static segments, no name in between.
    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/greet_s0.mp3");
    created[0].finish();
    expect(created).toHaveLength(2);
    expect(created[1].url).toBe("/audio/greet_s1.mp3");
    created[1].finish();

    expect(onDone).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("throws via onDone when name slot needs a name and none was supplied", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, { greet: "Hey {{NAME}}!" });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "greet", onDone });

    expect(created).toHaveLength(0);
    expect(onDone).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe("AudioEngine — failure tolerance", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it("skips a failing segment and proceeds to the next", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, {
      x: "First. Second. Third.",
    });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "x", onDone });

    created[0].fail();
    created[1].finish();
    created[2].finish();

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("fires onDone even if every segment fails", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, { x: "Just one." });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "x", onDone });
    created[0].fail();

    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("AudioEngine — stop()", () => {
  it("stops the active segment and prevents onDone from a stale playback", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, { x: "Single." });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "x", onDone });
    engine.stop();
    expect(created[0].stop).toHaveBeenCalled();

    created[0].finish();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("a new play() cancels the previous sequence", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = makeEngine(factory, {
      first: "First line.",
      second: "Second line.",
    });
    const firstDone = vi.fn();
    const secondDone = vi.fn();

    await engine.play({ dialogueKey: "first", onDone: firstDone });
    await engine.play({ dialogueKey: "second", onDone: secondDone });

    created[0].finish();
    expect(firstDone).not.toHaveBeenCalled();

    const second = created.find((c) => c.url === "/audio/second.mp3");
    expect(second).toBeDefined();
    second?.finish();
    expect(secondDone).toHaveBeenCalledOnce();
  });
});

describe("AudioEngine — preloadDialogue()", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
  });
  afterEach(() => fetchSpy.mockRestore());

  it("fetches each static MP3 of a multi-sentence line", () => {
    const { factory } = makeHowlFactory();
    const engine = makeEngine(factory, { tour: "Sentence one. Sentence two." });
    engine.preloadDialogue("tour");
    expect(fetchSpy).toHaveBeenCalledWith("/audio/tour_s0.mp3", {
      cache: "force-cache",
    });
    expect(fetchSpy).toHaveBeenCalledWith("/audio/tour_s1.mp3", {
      cache: "force-cache",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("fetches static segments of a name-slotted line, skips the name slot", () => {
    const { factory } = makeHowlFactory();
    const engine = makeEngine(factory, { greet: "Hey {{NAME}}, welcome!" });
    engine.preloadDialogue("greet");
    expect(fetchSpy).toHaveBeenCalledWith("/audio/greet_s0.mp3", {
      cache: "force-cache",
    });
    expect(fetchSpy).toHaveBeenCalledWith("/audio/greet_s1.mp3", {
      cache: "force-cache",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not fetch the same URL twice (deduplication)", () => {
    const { factory } = makeHowlFactory();
    const engine = makeEngine(factory, { x: "One sentence." });
    engine.preloadDialogue("x");
    engine.preloadDialogue("x");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("swallows fetch errors silently (best-effort preload)", async () => {
    fetchSpy.mockRejectedValue(new Error("network error"));
    const { factory } = makeHowlFactory();
    const engine = makeEngine(factory, { x: "One sentence." });
    expect(() => engine.preloadDialogue("x")).not.toThrow();
  });
});
