import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinLinkLanding } from "./JoinLinkLanding";

describe("JoinLinkLanding", () => {
  it("shows the start screen with Login when the join link is open", () => {
    render(
      <JoinLinkLanding
        from="rsu-k7m2"
        view={{ status: "open", showGoogle: true }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try as guest" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Participant login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
  });

  it("opens Continue with Google when Login is clicked and does not start Google yet", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <JoinLinkLanding
        from="rsu-k7m2"
        view={{ status: "open", showGoogle: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign in with Google to join this tester's practice group.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Invited testers sign in with Google using the email on the list.",
      ),
    ).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("hides Login and says the link is unavailable when from is unknown", () => {
    render(<JoinLinkLanding from={null} view={{ status: "unknown", showGoogle: false }} />);

    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(
      screen.getByText("This sign-up link isn't available."),
    ).toBeInTheDocument();
  });

  it("hides Login and says the link is full when the cap is reached", () => {
    render(<JoinLinkLanding from="T1" view={{ status: "full", showGoogle: false }} />);

    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/join-google",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ from: "T1" }),
      }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/auth/login-google",
      expect.anything(),
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

    await user.click(screen.getByRole("button", { name: "Login" }));
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://accounts.google.com/oauth");
    });
    vi.unstubAllGlobals();
  });

  it("closes the sign-in dialog and stays on the join landing", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const user = userEvent.setup();
    render(
      <JoinLinkLanding
        from="rsu-k7m2"
        view={{ status: "open", showGoogle: true }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
