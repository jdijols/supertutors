import { describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";
import {
  createTutorMachine,
  type AudioEngineLike,
} from "./tutorMachine";
import type { PlayOptions } from "../audio/AudioEngine";

interface RecordedPlay {
  opts: PlayOptions;
  finish: () => void;
}

/** Fake AudioEngine that records each play() invocation and lets the test
 *  control when `onDone` fires — simulating Howler `onend` at our pace. */
function makeFakeEngine() {
  const calls: RecordedPlay[] = [];
  const engine: AudioEngineLike = {
    play(opts) {
      calls.push({ opts, finish: () => opts.onDone() });
    },
    stop: vi.fn(),
  };
  return { engine, calls };
}

describe("tutorMachine — playDialogue action", () => {
  it("calls audioEngine.play with the dialogue key on entry to setup", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({
      audioEngine: engine,
      // Stub: force hasNameSlot true regardless of actual line content,
      // so this test stays focused on the play() call shape (key, slot
      // flag, name passthrough) rather than coupling to the global
      // {{NAME}}-vs-"kid" choice in dialogue.json.
      hasNameSlot: () => true,
    });
    const actor = createActor(machine, { input: { name: "Jason" } }).start();

    expect(calls).toHaveLength(1);
    expect(calls[0].opts.dialogueKey).toBe("aha_setup");
    expect(calls[0].opts.hasNameSlot).toBe(true);
    expect(calls[0].opts.name).toBe("Jason");
    actor.stop();
  });

  it("SET_NAME mid-session updates context for subsequent playDialogue calls", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    expect(calls[0].opts.name).toBeUndefined();

    actor.send({ type: "SET_NAME", name: "TestKid" });
    calls[0].finish(); // setup → waiting_for_slice
    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/4" });
    // wrong_slice entry fires playDialogue with the now-set name.
    expect(calls.at(-1)?.opts.name).toBe("TestKid");
    actor.stop();
  });

  it("uses the real lineHasNameSlot detector by default", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    // `aha_setup` does NOT contain {{NAME}} per dialogue.json (Freddy
    // calls everyone "kid" — onboarding_response is the lone slot left).
    // Asserting `false` here proves the machine is wired to the real
    // detector, not a stub that would return true unconditionally.
    expect(calls[0].opts.hasNameSlot).toBe(false);
    actor.stop();
  });

  it("advances state when DIALOGUE_DONE fires (via onDone)", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    expect(actor.getSnapshot().value).toEqual({ aha: "setup" });

    // Fire the onDone the engine captured — simulates Howler `onend`.
    calls[0].finish();
    expect(actor.getSnapshot().value).toEqual({ aha: "waiting_for_slice" });
    actor.stop();
  });

  it("branches on SLICED.parentFraction — correct slice → sliced_correctly", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    calls[0].finish(); // setup → waiting_for_slice

    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/2" });
    expect(actor.getSnapshot().value).toEqual({ aha: "sliced_correctly" });
    expect(calls.at(-1)?.opts.dialogueKey).toBe("aha_compare_prompt");
    actor.stop();
  });

  it("branches on SLICED.parentFraction — wrong slice → wrong_slice", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    calls[0].finish();

    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/4" });
    expect(actor.getSnapshot().value).toEqual({ aha: "wrong_slice" });
    expect(calls.at(-1)?.opts.dialogueKey).toBe("aha_wrong_slice");
    actor.stop();
  });

  it("happy path: setup → slice → compare → animation → celebrating → done", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();

    calls[0].finish(); // setup → waiting_for_slice
    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/2" });
    calls.at(-1)!.finish(); // sliced_correctly → waiting_for_compare
    actor.send({ type: "PROXIMITY", comparison: "equal" });
    // aha_triggered runs playAhaAnimation, then waits for ANIMATION_DONE
    expect(actor.getSnapshot().value).toEqual({ aha: "aha_triggered" });
    actor.send({ type: "ANIMATION_DONE" });
    expect(actor.getSnapshot().value).toEqual({ aha: "celebrating" });
    expect(calls.at(-1)?.opts.dialogueKey).toBe("aha_reveal");
    calls.at(-1)!.finish(); // celebrating → done → onDone → check
    expect(actor.getSnapshot().value).toBe("check");
    actor.stop();
  });

  it("PROXIMITY.not_equal loops back to waiting_for_compare via not_equal", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    calls[0].finish();
    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/2" });
    calls.at(-1)!.finish();

    actor.send({ type: "PROXIMITY", comparison: "not_equal" });
    expect(actor.getSnapshot().value).toEqual({ aha: "not_equal" });
    expect(calls.at(-1)?.opts.dialogueKey).toBe("aha_not_equal");

    calls.at(-1)!.finish();
    expect(actor.getSnapshot().value).toEqual({ aha: "waiting_for_compare" });
    actor.stop();
  });

  it("RESET stops audio and returns to aha.setup", () => {
    const { engine, calls } = makeFakeEngine();
    const machine = createTutorMachine({ audioEngine: engine });
    const actor = createActor(machine, { input: {} }).start();
    calls[0].finish();
    actor.send({ type: "SLICED", pieceId: "p1", parentFraction: "1/2" });
    expect(actor.getSnapshot().value).toEqual({ aha: "sliced_correctly" });

    actor.send({ type: "RESET" });
    expect(actor.getSnapshot().value).toEqual({ aha: "setup" });
    expect(engine.stop).toHaveBeenCalled();
    actor.stop();
  });

  it("never throws when DIALOGUE_DONE fires after an audio failure", () => {
    // Engine that fails to play and immediately fires onDone (matches the
    // real AudioEngine's error semantics).
    const calls: PlayOptions[] = [];
    const failingEngine: AudioEngineLike = {
      play(opts) {
        calls.push(opts);
        // Synchronously fire onDone to simulate immediate failure.
        queueMicrotask(() => opts.onDone());
      },
      stop: vi.fn(),
    };
    const machine = createTutorMachine({ audioEngine: failingEngine });
    const actor = createActor(machine, { input: {} }).start();
    expect(calls[0].dialogueKey).toBe("aha_setup");
    // Microtask flush via Promise resolve.
    return Promise.resolve().then(() => {
      expect(actor.getSnapshot().value).toEqual({ aha: "waiting_for_slice" });
      actor.stop();
    });
  });
});
