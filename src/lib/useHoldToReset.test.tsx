import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHoldToReset } from "./useHoldToReset";

function Harness({
  onReset,
  holdMs,
}: {
  onReset: () => void;
  holdMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useHoldToReset({ ref, onReset, holdMs });
  return (
    <div ref={ref} data-testid="target" data-holding={state.isHolding}>
      {state.isHolding ? `holding` : "idle"}
    </div>
  );
}

function fireEvent(el: Element, type: string) {
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

describe("useHoldToReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires onReset after the full hold duration", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={1000} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
    });
    expect(onReset).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("does NOT fire if the press is released early", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={1000} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(500);
      fireEvent(target, "pointerup");
      vi.advanceTimersByTime(1000);
    });
    expect(onReset).not.toHaveBeenCalled();
  });

  it("cancels on pointerleave", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={1000} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(700);
      fireEvent(target, "pointerleave");
      vi.advanceTimersByTime(1000);
    });
    expect(onReset).not.toHaveBeenCalled();
  });

  it("cancels on pointercancel", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={1000} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(700);
      fireEvent(target, "pointercancel");
      vi.advanceTimersByTime(1000);
    });
    expect(onReset).not.toHaveBeenCalled();
  });

  it("only fires once per hold (no auto-repeat)", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={500} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(2000);
    });
    expect(onReset).toHaveBeenCalledOnce();
  });

  it("re-arms after a completed hold", () => {
    const onReset = vi.fn();
    const { getByTestId } = render(<Harness onReset={onReset} holdMs={500} />);
    const target = getByTestId("target");

    act(() => {
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(500);
    });
    expect(onReset).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent(target, "pointerup");
      fireEvent(target, "pointerdown");
      vi.advanceTimersByTime(500);
    });
    expect(onReset).toHaveBeenCalledTimes(2);
  });
});
