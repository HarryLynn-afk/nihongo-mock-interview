import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import JoinPage from "./page";

const { lookupJoinLinkMock, notFoundMock, pushMock } = vi.hoisted(() => ({
  lookupJoinLinkMock: vi.fn(),
  notFoundMock: vi.fn(),
  pushMock: vi.fn(),
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

  it("renders the join landing for a stored invite code", async () => {
    lookupJoinLinkMock.mockResolvedValue({ signupCount: 0, maxSignups: 10 });

    const view = await JoinPage({
      searchParams: Promise.resolve({ from: "rsu-k7m" }),
    });
    render(view);

    expect(lookupJoinLinkMock).toHaveBeenCalledWith("rsu-k7m");
    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
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
