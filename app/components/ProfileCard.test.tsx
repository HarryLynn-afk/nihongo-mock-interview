import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { profile } from "@/lib/content/profile";
import { ProfileCard } from "./ProfileCard";

describe("ProfileCard", () => {
  it("renders the 6 locked DISPLAY_CARD_FIELDS values and excludes internal-only profile fields", () => {
    render(<ProfileCard />);

    expect(screen.getByText(profile.name)).toBeInTheDocument();
    expect(screen.getByText(String(profile.age))).toBeInTheDocument();
    expect(screen.getByText(profile.hometown)).toBeInTheDocument();
    expect(screen.getByText(profile.education)).toBeInTheDocument();
    expect(screen.getByText(profile.plan)).toBeInTheDocument();
    expect(screen.getByText(profile.sponsor)).toBeInTheDocument();

    expect(screen.queryByText(profile.currentJob)).not.toBeInTheDocument();
    expect(screen.queryByText(profile.studyPurpose)).not.toBeInTheDocument();
    expect(
      screen.queryByText(profile.internalLanguageGoal),
    ).not.toBeInTheDocument();
  });
});
