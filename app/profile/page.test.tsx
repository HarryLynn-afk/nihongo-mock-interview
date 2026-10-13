import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";

const { router, searchParams } = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));

describe("Profile page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    router.push.mockReset();
    searchParams.delete("returnTo");
  });

  it("returns from Profile to the unique-link landing", async () => {
    searchParams.set("returnTo", "/join?from=rsu-k7m2");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: "ready", account: { displayName: "May", email: "may@gmail.com" } }),
    }));

    render(<ProfilePage />);

    expect(await screen.findByRole("link", { name: /Back to interview/ })).toHaveAttribute(
      "href",
      "/join?from=rsu-k7m2",
    );
  });

  it("styles the Back to interview link as the Join interview pill", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: "ready", account: { displayName: "May", email: "may@gmail.com" } }),
    }));

    render(<ProfilePage />);

    const back = await screen.findByRole("link", { name: /Back to interview/ });
    for (const pillClass of [
      "inline-flex",
      "min-h-11",
      "rounded-full",
      "bg-feather",
      "px-5",
      "text-sm",
      "text-white",
    ]) {
      expect(back).toHaveClass(pillClass);
    }
  });

  it("styles Sign out as a light red button", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: "ready", account: { displayName: "May", email: "may@gmail.com" } }),
    }));

    render(<ProfilePage />);

    const signOut = await screen.findByRole("button", { name: "Sign out" });
    for (const lightRed of ["border-red-300", "text-red-600", "hover:bg-red-50"]) {
      expect(signOut).toHaveClass(lightRed);
    }
  });

  it("shows the Google identity and assigned participant ID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        state: "ready",
        account: { displayName: "May Thiri", email: "may@gmail.com" },
        participantId: "P001",
      }),
    }));

    render(<ProfilePage />);

    expect(await screen.findByText("May Thiri")).toBeInTheDocument();
    expect(screen.getByText("may@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("P001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("explains a failed account load and keeps Sign out available", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));

    render(<ProfilePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load your account. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("explains a network failure while loading the account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));

    render(<ProfilePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load your account. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("loads the account when Try again is pressed", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: "ready",
          account: { displayName: "May", email: "may@gmail.com" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(await screen.findByText("May")).toBeInTheDocument();
    expect(screen.getByText("may@gmail.com")).toBeInTheDocument();
  });

  it("redirects to the landing page when sign-in is required", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ state: "signInRequired" }),
    }));

    render(<ProfilePage />);

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/");
    });
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
  });

  it("ignores a late sign-in redirect after the page unmounts", async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );

    const { unmount } = render(<ProfilePage />);
    unmount();
    resolveFetch({ ok: true, json: async () => ({ state: "signInRequired" }) });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(router.push).not.toHaveBeenCalled();
  });

  it("keeps a newer successful load when an older retry fails later", async () => {
    let resolveOlderRetry!: (value: unknown) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOlderRetry = resolve;
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          state: "ready",
          account: { displayName: "May", email: "may@gmail.com" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(await screen.findByRole("button", { name: "Try again" }));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("May")).toBeInTheDocument();

    resolveOlderRetry({ ok: false, status: 503, json: async () => ({}) });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByText("May")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
