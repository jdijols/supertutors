import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FractionInput } from "./FractionInput";

function clickDigit(d: number) {
  fireEvent.click(screen.getByRole("button", { name: `Enter ${d}` }));
}

function clickDelete() {
  fireEvent.click(screen.getByRole("button", { name: "Delete last digit" }));
}

describe("FractionInput", () => {
  it("renders both slots empty and marks numerator as active first", () => {
    render(<FractionInput onAnswer={() => {}} />);
    const num = screen.getByTestId("fraction-input-numerator");
    const den = screen.getByTestId("fraction-input-denominator");
    expect(num.textContent).toBe("");
    expect(den.textContent).toBe("");
    expect(num.dataset.active).toBe("true");
    expect(den.dataset.active).toBe("false");
  });

  it("first digit fills numerator and advances active to denominator", () => {
    render(<FractionInput onAnswer={() => {}} />);
    clickDigit(1);
    expect(screen.getByTestId("fraction-input-numerator").textContent).toBe("1");
    expect(screen.getByTestId("fraction-input-numerator").dataset.active).toBe(
      "false",
    );
    expect(screen.getByTestId("fraction-input-denominator").dataset.active).toBe(
      "true",
    );
  });

  it("no-expected mode: any completion fires onAnswer with the values", () => {
    const onAnswer = vi.fn();
    render(<FractionInput onAnswer={onAnswer} />);
    clickDigit(3);
    clickDigit(7);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(3, 7);
  });

  it("validates correct fraction against expected", () => {
    const onAnswer = vi.fn();
    const onWrong = vi.fn();
    render(
      <FractionInput
        expected={{ numerator: 1, denominator: 2 }}
        onAnswer={onAnswer}
        onWrong={onWrong}
      />,
    );
    clickDigit(1);
    clickDigit(2);
    expect(onAnswer).toHaveBeenCalledWith(1, 2);
    expect(onWrong).not.toHaveBeenCalled();
  });

  it("flags wrong fraction via onWrong (not onAnswer)", () => {
    const onAnswer = vi.fn();
    const onWrong = vi.fn();
    render(
      <FractionInput
        expected={{ numerator: 1, denominator: 2 }}
        onAnswer={onAnswer}
        onWrong={onWrong}
      />,
    );
    clickDigit(2);
    clickDigit(3);
    expect(onWrong).toHaveBeenCalledWith(2, 3);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("delete removes the most recent digit (denominator first, then numerator)", () => {
    const onAnswer = vi.fn();
    render(<FractionInput onAnswer={onAnswer} />);
    clickDigit(1);
    clickDigit(2);
    expect(onAnswer).toHaveBeenCalledTimes(1);

    // After commit, further interaction is ignored (matches single-fire contract)
    clickDelete();
    expect(screen.getByTestId("fraction-input-denominator").textContent).toBe(
      "2",
    );
  });

  it("delete in a partial state clears the most recent digit (no commit)", () => {
    const onAnswer = vi.fn();
    render(<FractionInput onAnswer={onAnswer} />);
    clickDigit(5);
    expect(screen.getByTestId("fraction-input-numerator").textContent).toBe(
      "5",
    );
    clickDelete();
    expect(screen.getByTestId("fraction-input-numerator").textContent).toBe(
      "",
    );
    expect(screen.getByTestId("fraction-input-numerator").dataset.active).toBe(
      "true",
    );
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("commits exactly once even if extra digits would be entered later", () => {
    const onAnswer = vi.fn();
    render(<FractionInput onAnswer={onAnswer} />);
    clickDigit(1);
    clickDigit(2);
    clickDigit(3); // should be ignored after commit
    clickDigit(4);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
});
