import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageHud } from "./LanguageHud";

describe("LanguageHud", () => {
  it("shows the Japanese caption when sensei is speaking", () => {
    render(
      <LanguageHud
        speaker="sensei"
        caption="はじめに、簡単に自己紹介をお願いします。"
      />,
    );

    expect(
      screen.getByText("はじめに、簡単に自己紹介をお願いします。"),
    ).toBeInTheDocument();
  });

  it("waveform is Indigo when the student is speaking and Paper at 60% when sensei is speaking", () => {
    const { rerender } = render(
      <LanguageHud speaker="sensei" caption="はじめに、簡単に自己紹介をお願いします。" />,
    );

    expect(screen.getByTestId("waveform")).toHaveClass("bg-paper/60");

    rerender(<LanguageHud speaker="student" caption={null} />);

    expect(screen.getByTestId("waveform")).toHaveClass("bg-indigo");
  });

  it("renders the Japanese caption at a large display size", () => {
    render(
      <LanguageHud
        speaker="sensei"
        caption="はじめに、簡単に自己紹介をお願いします。"
      />,
    );

    expect(
      screen.getByText("はじめに、簡単に自己紹介をお願いします。"),
    ).toHaveClass("text-4xl");
  });
});
