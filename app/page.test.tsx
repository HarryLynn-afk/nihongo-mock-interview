import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home (start screen)", () => {
  it("shows the NihonGo header, subtitle, and a Join interview link to the call screen", () => {
    render(<Home />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(
      screen.getByText("Japanese language school interview practice"),
    ).toBeInTheDocument();

    const joinLink = screen.getByRole("link", { name: "Join interview" });
    expect(joinLink).toHaveAttribute("href", "/call");
  });

  it("gates Join behind a desktop viewport and shows the open-on-a-computer message on narrow viewports, via a CSS breakpoint pair", () => {
    render(<Home />);

    const joinLink = screen.getByRole("link", { name: "Join interview" });
    const joinContainer = joinLink.parentElement;
    const desktopOnlyMessage = screen.getByText(
      "Open on a computer to join the interview.",
    );

    // Hidden below md, shown at md+ — the inverse of the message below.
    expect(joinContainer).toHaveClass("hidden", "md:flex");
    // Shown below md, hidden at md+ — never visible at the same time as Join.
    expect(desktopOnlyMessage).toHaveClass("md:hidden");
    expect(desktopOnlyMessage).not.toHaveClass("hidden");
  });

  it("never prints exam or verdict labels anywhere on the page", () => {
    render(<Home />);

    const pageText = document.body.textContent ?? "";

    for (const term of [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/]) {
      expect(pageText).not.toMatch(term);
    }
  });

  it("never renders a sign-up, password, or email field", () => {
    render(<Home />);

    expect(document.querySelectorAll("input, form").length).toBe(0);
  });
});
