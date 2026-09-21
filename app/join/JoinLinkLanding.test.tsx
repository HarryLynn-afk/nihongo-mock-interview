import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinLinkLanding } from "./JoinLinkLanding";

describe("JoinLinkLanding", () => {
  it("shows Continue with Google when the join link is open", () => {
    render(<JoinLinkLanding from={null} view={{ status: "open", showGoogle: true }} />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
  });

  it("hides Google and says the link is unavailable when from is unknown", () => {
    render(<JoinLinkLanding from={null} view={{ status: "unknown", showGoogle: false }} />);

    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This sign-up link isn't available."),
    ).toBeInTheDocument();
  });

  it("hides Google and says the link is full when the cap is reached", () => {
    render(<JoinLinkLanding from="T1" view={{ status: "full", showGoogle: false }} />);

    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("This sign-up link is full.")).toBeInTheDocument();
  });

  it("starts Google sign-up through POST /api/auth/join-google", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <JoinLinkLanding
        from="T1"
        view={{ status: "open", showGoogle: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/join-google",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ from: "T1" }),
      }),
    );
    vi.unstubAllGlobals();
  });

  it("sends the browser to the Google URL from the join-google response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const user = userEvent.setup();
    render(
      <JoinLinkLanding
        from="T1"
        view={{ status: "open", showGoogle: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://accounts.google.com/oauth");
    });
    vi.unstubAllGlobals();
  });
});
