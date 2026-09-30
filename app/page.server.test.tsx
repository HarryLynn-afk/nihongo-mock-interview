import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

const originalEnv = { ...process.env };
const { createServerClient, getUser, cookieValues } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getUser: vi.fn(),
  cookieValues: {} as Record<string, string>,
}));

vi.mock("@supabase/ssr", () => ({ createServerClient }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    get: (name: string) =>
      cookieValues[name] ? { value: cookieValues[name] } : undefined,
    set: vi.fn(),
  }),
}));

describe("normal landing route", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
    createServerClient.mockReset();
    getUser.mockReset();
  });

  it("shows the signed-in actions after Google returns to /", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    cookieValues.nihongo_consent_gate = "ok";
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "tester@gmail.com" } },
    });
    createServerClient.mockReturnValue({ auth: { getUser } });

    render(await Page());

    expect(screen.getByRole("button", { name: "Join Interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try a short practice" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
  });
});
