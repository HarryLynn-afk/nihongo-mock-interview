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

  it("keeps the Question caption and shows a live student line underneath", () => {
    render(
      <LanguageHud
        speaker="student"
        caption="はじめに、簡単に自己紹介をお願いします。"
        liveCaption="はじめまして。"
        english="Nice to meet you."
      />,
    );

    expect(
      screen.getByText("はじめに、簡単に自己紹介をお願いします。"),
    ).toBeInTheDocument();
    expect(screen.getByText("はじめまして。")).toBeInTheDocument();
    expect(screen.getByText("Nice to meet you.")).toBeInTheDocument();
  });

  it("does not render an English line when english is null", () => {
    render(
      <LanguageHud speaker="student" caption="はじめまして。" english={null} />,
    );

    expect(screen.getByText("はじめまして。")).toBeInTheDocument();
    expect(screen.queryByText("Nice to meet you.")).not.toBeInTheDocument();
  });

  it("renders a Burmese line when burmese is provided", () => {
    render(
      <LanguageHud
        speaker="student"
        caption="はじめに、簡単に自己紹介をお願いします。"
        english="I am Aung Min Khant."
        burmese="ကျွန်တော် အောင်မင်းခန့်ပါ။"
      />,
    );

    expect(screen.getByText("I am Aung Min Khant.")).toBeInTheDocument();
    expect(screen.getByText("ကျွန်တော် အောင်မင်းခန့်ပါ။")).toBeInTheDocument();
  });
});
