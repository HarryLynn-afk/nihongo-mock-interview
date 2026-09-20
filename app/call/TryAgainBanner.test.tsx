import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PUSHBACK_TRY_AGAIN } from "@/lib/content/pushbackCopy";
import { TryAgainBanner } from "./TryAgainBanner";

describe("TryAgainBanner", () => {
  it("shows one English try-again line as a status notice", () => {
    render(<TryAgainBanner />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent(PUSHBACK_TRY_AGAIN.english);
    expect(banner).not.toHaveTextContent(PUSHBACK_TRY_AGAIN.japanese);
    expect(banner).not.toHaveTextContent(PUSHBACK_TRY_AGAIN.burmese);
  });
});
