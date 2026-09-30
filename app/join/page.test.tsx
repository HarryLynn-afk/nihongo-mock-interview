import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JoinPage from "./page";

const originalEnv = { ...process.env };
const { lookupJoinLinkMock, notFoundMock, pushMock, createServerClient, getUser, cookieValues } = vi.hoisted(() => ({
  lookupJoinLinkMock: vi.fn(),
  notFoundMock: vi.fn(),
  pushMock: vi.fn(),
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  cookieValues: {} as Record<string, string>,
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (name: string) => cookieValues[name] ? { value: cookieValues[name] } : undefined,
    set: vi.fn(),
  }),
}));
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/server/study/lookupJoinLink", () => ({
  lookupJoinLink: lookupJoinLinkMock,
}));

describe("JoinPage", () => {
  beforeEach(() => {
    lookupJoinLinkMock.mockReset();
    pushMock.mockReset();
    notFoundMock.mockReset();
    notFoundMock.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    createServerClient.mockReset();
    getUser.mockReset();
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
  });

  it("renders the join landing for a stored invite code", async () => {
    lookupJoinLinkMock.mockResolvedValue({ signupCount: 0, maxSignups: 10 });

    const view = await JoinPage({
      searchParams: Promise.resolve({ from: "rsu-k7m" }),
    });
    render(view);

    expect(lookupJoinLinkMock).toHaveBeenCalledWith("rsu-k7m");
    expect(
      screen.getByRole("heading", {
        name: "Practice your Japanese language-school interview",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("shows signed-in actions on the same available unique-link landing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    cookieValues.nihongo_consent_gate = "ok";
    cookieValues.nihongo_join_from = "rsu-k7m";
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@gmail.com" } },
    });
    createServerClient.mockReturnValue({ auth: { getUser } });
    lookupJoinLinkMock.mockResolvedValue({ signupCount: 0, maxSignups: 10 });

    render(await JoinPage({ searchParams: Promise.resolve({ from: "rsu-k7m" }) }));

    expect(screen.getByRole("button", { name: "Join research session" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try a short practice" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
  });

  it("does not offer Join interview when the saved sign-in came from another invite", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    cookieValues.nihongo_consent_gate = "ok";
    cookieValues.nihongo_join_from = "other-code";
    getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "tester@gmail.com" } } });
    createServerClient.mockReturnValue({ auth: { getUser } });
    lookupJoinLinkMock.mockResolvedValue({ signupCount: 0, maxSignups: 10 });

    render(await JoinPage({ searchParams: Promise.resolve({ from: "rsu-k7m" }) }));

    expect(screen.queryByRole("button", { name: "Join research session" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("returns 404 when the join code is missing", async () => {
    await expect(
      JoinPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(lookupJoinLinkMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the join code is unknown", async () => {
    lookupJoinLinkMock.mockResolvedValue(null);

    await expect(
      JoinPage({
        searchParams: Promise.resolve({ from: "not-real" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(lookupJoinLinkMock).toHaveBeenCalledWith("not-real");
  });
});
