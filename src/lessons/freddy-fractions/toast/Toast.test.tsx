import { render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Toast } from "./Toast";
import { fractionToastMessage } from "./fractionToastMessage";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render anything when closed", () => {
    render(<Toast open={false} message="hidden" />);
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
  });

  it("renders the message when open", () => {
    render(<Toast open message="You made halves! 1/2" />);
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast")).toHaveTextContent(
      "You made halves! 1/2",
    );
  });

  it("exposes the variant via data attribute and applies its styles", () => {
    const { rerender } = render(
      <Toast open message="x" variant="success" />,
    );
    expect(screen.getByTestId("toast")).toHaveAttribute(
      "data-variant",
      "success",
    );

    rerender(<Toast open message="x" variant="info" />);
    expect(screen.getByTestId("toast")).toHaveAttribute(
      "data-variant",
      "info",
    );
  });

  it("fires onDismiss after the auto-dismiss duration elapses", () => {
    const handleDismiss = vi.fn();
    render(
      <Toast
        open
        message="x"
        durationMs={2200}
        onDismiss={handleDismiss}
      />,
    );

    expect(handleDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2100);
    expect(handleDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not auto-dismiss when durationMs is 0", () => {
    const handleDismiss = vi.fn();
    render(
      <Toast
        open
        message="x"
        durationMs={0}
        onDismiss={handleDismiss}
      />,
    );
    vi.advanceTimersByTime(10_000);
    expect(handleDismiss).not.toHaveBeenCalled();
  });

  it("clears the dismiss timer when open flips back to false", () => {
    const handleDismiss = vi.fn();
    const { rerender } = render(
      <Toast open message="x" durationMs={2000} onDismiss={handleDismiss} />,
    );
    vi.advanceTimersByTime(1000);
    rerender(
      <Toast
        open={false}
        message="x"
        durationMs={2000}
        onDismiss={handleDismiss}
      />,
    );
    vi.advanceTimersByTime(5000);
    expect(handleDismiss).not.toHaveBeenCalled();
  });

  it("exposes an accessible role for screen readers", () => {
    render(<Toast open message="Quarters! 1/4" />);
    expect(screen.getByRole("status")).toHaveTextContent("Quarters! 1/4");
  });
});

describe("fractionToastMessage", () => {
  it("returns the warm first-time copy for each fraction", () => {
    expect(fractionToastMessage("1/2", true)).toBe("You made halves! 1/2");
    expect(fractionToastMessage("1/4", true)).toBe("Now quarters! 1/4");
    expect(fractionToastMessage("1/8", true)).toBe("Eighths! 1/8");
  });

  it("returns the shorter repeat copy when not first-time", () => {
    expect(fractionToastMessage("1/2", false)).toBe("Halves! 1/2");
    expect(fractionToastMessage("1/4", false)).toBe("Quarters! 1/4");
  });
});
