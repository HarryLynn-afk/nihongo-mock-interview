export type StudentProfile = {
  name: string;
  age: number;
  hometown: string;
  education: string;
  plan: string;
  sponsor: string;
  currentJob: string;
  studyPurpose: string;
  studyDuration: string;
  /**
   * Internal profile field only. May reference a JLPT-style level target.
   * Never surface this on the splash, Zoom bar, or report headline
   * (docs/prd-nihongo.md "Must Have").
   */
  internalLanguageGoal: string;
};

/**
 * The 6 fields the read-only start-screen card must show, in the order
 * given by docs/prd-nihongo.md ("name, age, hometown, education, plan,
 * sponsor"). Issue 3 renders exactly these, nothing else.
 */
export const DISPLAY_CARD_FIELDS = [
  "name",
  "age",
  "hometown",
  "education",
  "plan",
  "sponsor",
] as const satisfies readonly (keyof StudentProfile)[];

export const profile: StudentProfile = {
  name: "Aung Min Khant",
  age: 23,
  hometown: "Mandalay, Myanmar",
  education: "B.C.Sc, University of Computer Studies, Mandalay (2025)",
  plan: "Enter a Tokyo IT vocational school after language school, then look for an engineer job in Japan.",
  sponsor: "Parents — U Ko Ko Khant (father, company employee) and Daw Khin Htay (mother, shop owner), Mandalay.",
  currentJob:
    "Not employed. Preparing for study in Japan; helps part-time in his parents' shop in Mandalay.",
  studyPurpose:
    "Study Japanese in Tokyo to enter an IT vocational school. Chose Tokyo Pathway Japanese School for its Akihabara location, beginner class, and IT career guidance.",
  studyDuration: "1 year 6 months at Tokyo Pathway Japanese School.",
  internalLanguageGoal: "Beginner now; target N2 in 18 months.",
};
