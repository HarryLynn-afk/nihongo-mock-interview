import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HashSessionCatcher } from "./HashSessionCatcher";
import {
  MAGIC_LINK_EXPIRED_COPY,
  MAGIC_LINK_MISSING_COPY,
} from "@/lib/content/studyAuth";

const { replace, createBrowserClient } = vi.hoisted(() => ({
  replace: vi.fn(),
  createBrowserClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@supabase/ssr", () => ({ createBrowserClient }));

const originalEnv = { ...process.env };

describe("HashSessionCatcher", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
    replace.mockReset();
    createBrowserClient.mockReset();
  });

  it("returns a hash-token sign-in to its unique landing after opening the visit", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    window.history.replaceState(null, "", "/auth/callback?from=T1#access_token=abc");
    createBrowserClient.mockReturnValue({ auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      getSession: async () => ({ data: { session: { access_token: "abc" } } }),
    } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<HashSessionCatcher />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/join?from=T1"));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/consent-gate", { method: "POST" });
  });
  it("renders nothing on the start screen when there is no invite hash", () => {
    render(<HashSessionCatcher idle />);
    expect(screen.queryByText(/signing you in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(MAGIC_LINK_MISSING_COPY)).not.toBeInTheDocument();
  });

  it("tells the tester to request a new link when the callback has no token", async () => {
    render(<HashSessionCatcher />);
    expect(await screen.findByText(MAGIC_LINK_MISSING_COPY)).toBeInTheDocument();
  });

  it("separates an already-opened link from a missing token", async () => {
    window.location.hash = "#error=access_denied&error_code=otp_expired";
    render(<HashSessionCatcher />);
    expect(await screen.findByText(MAGIC_LINK_EXPIRED_COPY)).toBeInTheDocument();
    window.location.hash = "";
  });
});
