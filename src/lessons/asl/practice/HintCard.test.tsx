import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HintCard } from "./HintCard";
import type { Sign } from "../vocab";

const helloSign: Sign = {
  id: "asl:HELLO",
  glyph: "HELLO",
  trained: true,
  phonology: {
    handshape: "B (flat hand)",
    location: "Forehead",
    movement: "Away from body",
    palmOrientation: "Facing in",
  },
  referenceVideo: "/lessons/asl/videos/HELLO.webm",
};

const yesSign: Sign = {
  id: "asl:YES",
  glyph: "YES",
  trained: true,
  phonology: {
    handshape: "S (fist)",
    location: "Neutral space",
    movement: "Nodding motion",
    palmOrientation: "Facing away",
  },
};

const noPhonSign: Sign = {
  id: "asl:UNKNOWN",
  glyph: "UNKNOWN",
  trained: false,
};

describe("HintCard", () => {
  it("renders all four phonological breakdowns for a target sign with complete data", () => {
    render(<HintCard targetSign={helloSign} />);

    expect(screen.getByText("B (flat hand)")).toBeInTheDocument();
    expect(screen.getByText("Forehead")).toBeInTheDocument();
    expect(screen.getByText("Away from body")).toBeInTheDocument();
    expect(screen.getByText("Facing in")).toBeInTheDocument();
  });

  it("shows 'Show me the sign' button when reference video exists", () => {
    const onShow = vi.fn();
    render(<HintCard targetSign={helloSign} onShowReference={onShow} />);

    expect(screen.getByText("Show me the sign")).toBeInTheDocument();
  });

  it("falls back to general guidance when phonology is missing", () => {
    render(<HintCard targetSign={noPhonSign} />);

    expect(screen.getByTestId("hint-card")).toBeInTheDocument();
    expect(screen.getByText(/keep trying/i)).toBeInTheDocument();
  });

  it("shows comparison framing when observedSign differs from target", () => {
    render(<HintCard targetSign={helloSign} observedSign={yesSign} />);

    expect(screen.getByText("YES")).toBeInTheDocument();
    expect(screen.getByText("HELLO")).toBeInTheDocument();
    expect(screen.getByText(/differs/i)).toBeInTheDocument();
  });

  it("does not crash when observedSign has no phonology", () => {
    render(<HintCard targetSign={helloSign} observedSign={noPhonSign} />);

    // Should render normally without comparison framing
    expect(screen.getByText("B (flat hand)")).toBeInTheDocument();
  });
});
