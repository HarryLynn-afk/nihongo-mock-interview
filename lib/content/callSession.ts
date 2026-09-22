import { questions, type InterviewQuestion } from "./questions";

/** Who is in this classroom, read from the `/call` query after mount. */
export type CallSessionKind = "guest" | "participant";

/**
 * Guest uses the 3 locked Questions. The 10-topic bank and follow-ups
 * are the Participant classroom only.
 */
export function callSessionKind(search: string): CallSessionKind {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  if (params.get("guest") === "1") return "guest";
  return "participant";
}

export function followUpsForCallSession(kind: CallSessionKind): boolean {
  return kind === "participant";
}

/**
 * Locked Questions for a Guest. The picker runs only for a Participant,
 * so a Guest visit cannot draw or record bank ids.
 */
export function questionsForCallSession(
  kind: CallSessionKind,
  pickParticipantQuestions: () => readonly InterviewQuestion[],
): readonly InterviewQuestion[] {
  if (kind === "participant") return pickParticipantQuestions();
  return questions;
}
