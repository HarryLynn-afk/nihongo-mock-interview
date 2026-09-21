export type InterviewQuestion = {
  id: number;
  japanese: string;
  englishTranslation: string;
};

/**
 * Tanaka-sensei's 3 locked interview questions. Japanese stays on the HUD;
 * English is shown during the student turn. Burmese is not stored here —
 * an Eng/MM translate toggle will supply it later. This is the
 * interviewer's own question — not the student's pitch-mode answer captions,
 * see pitchAnswers.ts for those.
 *
 * NOTE: englishTranslation was authored for this build (the PRD locks the
 * Japanese; it does not supply exact EN wording).
 */
export const questions: readonly InterviewQuestion[] = [
  {
    id: 1,
    japanese: "はじめに、簡単に自己紹介をお願いします。",
    englishTranslation: "First, please give a brief self-introduction.",
  },
  {
    id: 2,
    japanese:
      "どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。",
    englishTranslation:
      "Why do you want to study Japanese in Japan? Please also tell us why you chose this school.",
  },
  {
    id: 3,
    japanese: "日本語学校を卒業した後は、何をする予定ですか。",
    englishTranslation:
      "What do you plan to do after graduating from the Japanese language school?",
  },
];
