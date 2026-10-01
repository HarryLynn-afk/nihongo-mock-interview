import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LandingView } from "@/lib/content/landingView";
import Home from "./Home";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function view(overrides: Partial<LandingView>): LandingView {
  return {
    origin: "/",
    invite: "none",
    from: null,
    session: { kind: "signedOut" },
    ...overrides,
  };
}

describe("Home invite landing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the shared guest landing with a Login action on an open invite", () => {
    render(
      <Home
        view={view({ origin: "/join?from=rsu-k7m2", invite: "open", from: "rsu-k7m2" })}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Practice your Japanese language-school interview",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try a short practice" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in with Google for the full interview/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Participant login" }),
    ).not.toBeInTheDocument();
  });

  it("starts join Google with the invite code from the Login action", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const user = userEvent.setup();
    render(
      <Home
        view={view({ origin: "/join?from=T1", invite: "open", from: "T1" })}
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
    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://accounts.google.com/oauth");
    });
  });

  it("keeps the unique link as the profile return destination", () => {
    render(
      <Home
        view={view({
          origin: "/join?from=rsu-k7m2",
          invite: "open",
          from: "rsu-k7m2",
          session: { kind: "signedIn", consentedThisVisit: false },
        })}
      />,
    );

    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute(
      "href",
      "/profile?returnTo=%2Fjoin%3Ffrom%3Drsu-k7m2",
    );
  });

  it("shows a dismissible full-link popup and hides Login", async () => {
    const user = userEvent.setup();
    render(
      <Home view={view({ origin: "/join?from=T1", invite: "full", from: "T1" })} />,
    );

    expect(
      screen.queryByRole("button", { name: "Login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try a short practice" }),
    ).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", {
      name: "This sign-up link is full.",
    });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("dialog", { name: "This sign-up link is full." }),
    ).not.toBeInTheDocument();
  });

  it("offers no Join interview on a full link with a saved sign-in", () => {
    render(
      <Home
        view={view({
          origin: "/join?from=T1",
          invite: "full",
          from: "T1",
          session: { kind: "signedIn", consentedThisVisit: false },
        })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Join Interview" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try a short practice" }),
    ).not.toBeInTheDocument();
  });

  it("hides Login and says the link is unavailable for an unknown invite", () => {
    render(
      <Home
        view={view({ origin: "/join?from=bad", invite: "unknown", from: "bad" })}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This sign-up link isn't available."),
    ).toBeInTheDocument();
  });
});
