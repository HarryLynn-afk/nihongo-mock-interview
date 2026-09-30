import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
      "min-h-[60px]",
      "rounded-full",
      "bg-feather",
      "px-8",
      "text-lg",
      "text-white",
    ]) {
      expect(back).toHaveClass(pillClass);
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
});
