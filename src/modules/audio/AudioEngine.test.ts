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

describe("AudioEngine — static line (no name slot)", () => {
  it("plays /audio/<key>.mp3 once and calls onDone after it ends", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = new AudioEngine({ createHowl: factory });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "aha_compare_prompt", onDone });

    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/aha_compare_prompt.mp3");
    expect(created[0].play).toHaveBeenCalledOnce();
    expect(onDone).not.toHaveBeenCalled();

    created[0].finish();
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("AudioEngine — name-injected line", () => {
  it("queues A → name → B in order and onDone fires only after B ends", async () => {
    const { factory, created } = makeHowlFactory();
    const resolveNameUrl = vi.fn(async () => "blob:name-mp3");
    const engine = new AudioEngine({ createHowl: factory, resolveNameUrl });
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "aha_setup",
      hasNameSlot: true,
      name: "Jason",
      onDone,
    });

    expect(resolveNameUrl).toHaveBeenCalledWith("Jason");
    expect(created).toHaveLength(1);
    expect(created[0].url).toBe("/audio/aha_setup_a.mp3");

    created[0].finish();
    expect(created).toHaveLength(2);
    expect(created[1].url).toBe("blob:name-mp3");
    expect(onDone).not.toHaveBeenCalled();

    created[1].finish();
    expect(created).toHaveLength(3);
    expect(created[2].url).toBe("/audio/aha_setup_b.mp3");
    expect(onDone).not.toHaveBeenCalled();

    created[2].finish();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("falls through to onDone if name resolution rejects", async () => {
    const { factory, created } = makeHowlFactory();
    const resolveNameUrl = vi.fn(async () => {
      throw new Error("503");
    });
    const engine = new AudioEngine({ createHowl: factory, resolveNameUrl });
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "aha_setup",
      hasNameSlot: true,
      name: "Jason",
      onDone,
    });

    expect(created).toHaveLength(0);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("throws via onDone when hasNameSlot is true but no name supplied", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = new AudioEngine({ createHowl: factory });
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "aha_setup",
      hasNameSlot: true,
      onDone,
    });

    expect(created).toHaveLength(0);
    expect(onDone).toHaveBeenCalledOnce();
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
    const engine = new AudioEngine({
      createHowl: factory,
      resolveNameUrl: async () => "blob:n",
    });
    const onDone = vi.fn();

    await engine.play({
      dialogueKey: "aha_setup",
      hasNameSlot: true,
      name: "Jason",
      onDone,
    });

    created[0].fail();
    created[1].finish();
    created[2].finish();

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("fires onDone even if every segment fails", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = new AudioEngine({ createHowl: factory });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "aha_reveal", onDone });
    created[0].fail();

    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe("AudioEngine — stop()", () => {
  it("stops the active segment and prevents onDone from a stale playback", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = new AudioEngine({ createHowl: factory });
    const onDone = vi.fn();

    await engine.play({ dialogueKey: "aha_reveal", onDone });
    engine.stop();
    expect(created[0].stop).toHaveBeenCalled();

    created[0].finish();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("a new play() cancels the previous sequence", async () => {
    const { factory, created } = makeHowlFactory();
    const engine = new AudioEngine({
      createHowl: factory,
      resolveNameUrl: async () => "blob:n",
    });
    const firstDone = vi.fn();
    const secondDone = vi.fn();

    await engine.play({
      dialogueKey: "aha_setup",
      hasNameSlot: true,
      name: "Jason",
      onDone: firstDone,
    });
    await engine.play({ dialogueKey: "aha_reveal", onDone: secondDone });

    created[0].finish();
    expect(firstDone).not.toHaveBeenCalled();

    const reveal = created.find((c) => c.url === "/audio/aha_reveal.mp3");
    expect(reveal).toBeDefined();
    reveal?.finish();
    expect(secondDone).toHaveBeenCalledOnce();
  });
});
