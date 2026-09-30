import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinLinkLanding } from "./JoinLinkLanding";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("JoinLinkLanding", () => {
  it("shows the shared guest landing with Login when the join link is open", () => {
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
    expect(screen.getByRole("button", { name: "Try as guest" })).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google for the full interview/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Participant login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the unique link as the profile return destination", () => {
    render(
      <JoinLinkLanding
        from="rsu-k7m2"
        view={{ status: "open", showGoogle: true }}
        landing={{ kind: "signedIn", origin: "/join?from=rsu-k7m2", consentedThisVisit: false }}
      />,
    );

    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile?returnTo=%2Fjoin%3Ffrom%3Drsu-k7m2",
    );
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

    const dialog = screen.getByRole("dialog", { name: "Join NihonGo" });
    expect(
      within(dialog).getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "ENG" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "MM" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Invited testers sign in with Google using the email on the list.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Sign in with Google to join this tester's practice group.",
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

  it("shows a dismissible full-link popup over the shared landing", async () => {
    const user = userEvent.setup();
    render(<JoinLinkLanding from="T1" view={{ status: "full", showGoogle: false }} />);

    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try as guest" })).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "This sign-up link is full." });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "This sign-up link is full." })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try as guest" })).toBeInTheDocument();
  });

  it("opens the full popup again for a different full invite", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <JoinLinkLanding from="T1" view={{ status: "full", showGoogle: false }} />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    rerender(<JoinLinkLanding from="T2" view={{ status: "full", showGoogle: false }} />);

    expect(screen.getByRole("dialog", { name: "This sign-up link is full." })).toBeInTheDocument();
  });

  it("does not offer Join interview on a full unique link even with a saved sign-in", () => {
    render(
      <JoinLinkLanding
        from="T1"
        view={{ status: "full", showGoogle: false }}
        landing={{ kind: "signedIn", origin: "/join?from=T1", consentedThisVisit: false }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Join interview" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try as guest" })).toBeInTheDocument();
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
