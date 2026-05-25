import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MCQ } from "./MCQ";

const TWO_OPTS = [
  { value: "cut", label: "Cut it in half" },
  { value: "dog", label: "Give it to the dog" },
];

const THREE_OPTS = [
  { value: "two", label: "Two" },
  { value: "two-half", label: "Two and a half" },
  { value: "three", label: "Three" },
];

describe("MCQ", () => {
  it("renders the question text", () => {
    render(
      <MCQ
        question="What should we do with the extra cookie?"
        options={TWO_OPTS}
        onAnswer={() => {}}
      />,
    );
    expect(
      screen.getByText("What should we do with the extra cookie?"),
    ).toBeDefined();
  });

  it("renders one chip per option", () => {
    render(<MCQ question="?" options={THREE_OPTS} onAnswer={() => {}} />);
    expect(screen.getAllByTestId("mcq-chip")).toHaveLength(3);
  });

  it("any-advances mode: any chip click fires onAnswer with that value", () => {
    const onAnswer = vi.fn();
    render(<MCQ question="?" options={TWO_OPTS} onAnswer={onAnswer} />);
    fireEvent.click(screen.getAllByTestId("mcq-chip")[1]);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith("dog");
  });

  it("re-prompt mode: a wrong pick fires onWrong, not onAnswer", () => {
    const onAnswer = vi.fn();
    const onWrong = vi.fn();
    render(
      <MCQ
        question="?"
        options={THREE_OPTS}
        correctValue="two-half"
        mode="re-prompt-until-correct"
        onAnswer={onAnswer}
        onWrong={onWrong}
      />,
    );
    // Pick "two" (index 0) — wrong
    fireEvent.click(screen.getAllByTestId("mcq-chip")[0]);
    expect(onWrong).toHaveBeenCalledWith("two");
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("re-prompt mode: the correct pick fires onAnswer, not onWrong", () => {
    const onAnswer = vi.fn();
    const onWrong = vi.fn();
    render(
      <MCQ
        question="?"
        options={THREE_OPTS}
        correctValue="two-half"
        mode="re-prompt-until-correct"
        onAnswer={onAnswer}
        onWrong={onWrong}
      />,
    );
    // Pick "two-half" (index 1) — correct
    fireEvent.click(screen.getAllByTestId("mcq-chip")[1]);
    expect(onAnswer).toHaveBeenCalledWith("two-half");
    expect(onWrong).not.toHaveBeenCalled();
  });

  it("re-prompt mode: kid can recover from a wrong pick by picking the correct one", () => {
    const onAnswer = vi.fn();
    const onWrong = vi.fn();
    render(
      <MCQ
        question="?"
        options={THREE_OPTS}
        correctValue="two-half"
        mode="re-prompt-until-correct"
        onAnswer={onAnswer}
        onWrong={onWrong}
      />,
    );
    const chips = screen.getAllByTestId("mcq-chip");
    fireEvent.click(chips[0]); // wrong: "two"
    fireEvent.click(chips[2]); // wrong: "three"
    fireEvent.click(chips[1]); // correct: "two-half"

    expect(onWrong).toHaveBeenCalledTimes(2);
    expect(onWrong).toHaveBeenNthCalledWith(1, "two");
    expect(onWrong).toHaveBeenNthCalledWith(2, "three");
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith("two-half");
  });

  it("exposes the option value via data-value on each chip", () => {
    render(<MCQ question="?" options={TWO_OPTS} onAnswer={() => {}} />);
    const chips = screen.getAllByTestId("mcq-chip");
    expect(chips[0].dataset.value).toBe("cut");
    expect(chips[1].dataset.value).toBe("dog");
  });
});
