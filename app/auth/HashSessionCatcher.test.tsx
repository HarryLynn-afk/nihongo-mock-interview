import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HashSessionCatcher } from "./HashSessionCatcher";
import {
  MAGIC_LINK_EXPIRED_COPY,
  MAGIC_LINK_MISSING_COPY,
} from "@/lib/content/studyAuth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("HashSessionCatcher", () => {
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
