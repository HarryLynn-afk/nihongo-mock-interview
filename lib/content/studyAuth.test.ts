import { describe, expect, it, vi } from "vitest";
import {
  MAGIC_LINK_EXPIRED_COPY,
  CONSENT_GATE_COOKIE,
  consentGateCookie,
  consentGateIsOpen,
  normalizeEmail,
  readAuthCallback,
  shouldRewriteAuthCallback,
  startLoginGoogle,
  allowlistedLoginGate,
} from "./studyAuth";

describe("studyAuth", () => {
  it("normalizes email for allowlist lookup", () => {
    expect(normalizeEmail("Ada@Example.COM")).toBe("ada@example.com");
  });

  it("reads the sign-in outcome from the query string or the fragment", () => {
    expect(readAuthCallback("?code=pkce", "")).toEqual({ kind: "code", code: "pkce" });
    expect(readAuthCallback("?token_hash=abc&type=magiclink", "")).toEqual({
      kind: "otp",
      tokenHash: "abc",
      type: "magiclink",
    });
    expect(readAuthCallback("", "#access_token=jwt&refresh_token=r")).toEqual({
      kind: "hash",
    });
    expect(readAuthCallback("", "")).toEqual({ kind: "none" });
  });

  it("reports an already-opened link instead of a missing token", () => {
    const scanned = readAuthCallback(
      "",
      "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(scanned).toEqual({ kind: "error", message: MAGIC_LINK_EXPIRED_COPY });
  });

  it("starts allowlisted Google at /auth/callback with no join from", async () => {
    const createOAuthUrl = vi.fn().mockResolvedValue("https://accounts.google.com/oauth");
    const result = await startLoginGoogle({
      origin: "http://localhost:3000",
      createOAuthUrl,
    });

    expect(createOAuthUrl).toHaveBeenCalledWith("http://localhost:3000/auth/callback");
    expect(result.url).toBe("https://accounts.google.com/oauth");
  });

  it("rejects /login Google when the email is not allowlisted", () => {
    expect(
      allowlistedLoginGate({
        from: null,
        alreadyParticipant: false,
        allowlisted: false,
      }),
    ).toEqual({ destination: "/login", reject: true });
  });

  it("lets /login Google continue when the email is allowlisted", () => {
    expect(
      allowlistedLoginGate({
        from: null,
        alreadyParticipant: false,
        allowlisted: true,
      }),
    ).toEqual({ destination: "/consent", reject: false });
  });

  it("does not apply the allowlist gate to an open join-link Google sign-up", () => {
    expect(
      allowlistedLoginGate({
        from: "rsu-k7m2",
        alreadyParticipant: false,
        allowlisted: false,
      }),
    ).toEqual({ destination: "/consent", reject: false });
  });

  it("treats only the callback-set consent gate value as open", () => {
    expect(consentGateIsOpen("ok")).toBe(true);
    expect(consentGateIsOpen(undefined)).toBe(false);
    expect(consentGateIsOpen("")).toBe(false);
    const open = consentGateCookie(true);
    expect(open.name).toBe(CONSENT_GATE_COOKIE);
    expect(open.value).toBe("ok");
    expect(open.options.maxAge).toBeUndefined();
    const closed = consentGateCookie(false);
    expect(closed.value).toBe("");
    expect(closed.options.maxAge).toBe(0);
  });

  it("rewrites hash-only callback clicks so the fragment is not dropped", () => {
    expect(shouldRewriteAuthCallback("/auth/callback", "")).toBe(true);
    expect(shouldRewriteAuthCallback("/auth/callback", "?code=pkce")).toBe(false);
    expect(
      shouldRewriteAuthCallback("/auth/callback", "?token_hash=otp&type=magiclink"),
    ).toBe(false);
    expect(shouldRewriteAuthCallback("/login", "")).toBe(false);
  });
});
