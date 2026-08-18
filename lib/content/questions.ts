export type InterviewQuestion = {
  id: number;
  japanese: string;
  englishTranslation: string;
  burmeseTranslation: string;
};

/**
 * Tanaka-sensei's 3 locked interview questions. Always shown with all three
 * languages in the HUD (docs/prd-nihongo.md "Language HUD"). This is the
 * interviewer's own question — not the student's pitch-mode answer captions,
 * see pitchAnswers.ts for those.
 *
 * NOTE: englishTranslation/burmeseTranslation were authored for this build
 * (the PRD locks the Japanese; it does not supply exact EN/MY wording).
 * Have a native Burmese speaker review burmeseTranslation before event day.
 */
export const questions: readonly InterviewQuestion[] = [
  {
    id: 1,
    japanese: "はじめに、簡単に自己紹介をお願いします。",
    englishTranslation: "First, please give a brief self-introduction.",
    burmeseTranslation:
      "ဦးစွာ သင့်ကိုယ်ရေးအကျဉ်းချုပ်ကို အနည်းငယ် ပြောပြပေးပါ။",
  },
  {
    id: 2,
    japanese:
      "どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。",
    englishTranslation:
      "Why do you want to study Japanese in Japan? Please also tell us why you chose this school.",
    burmeseTranslation:
      "ဘာကြောင့် ဂျပန်နိုင်ငံမှာ ဂျပန်စာ သင်ယူချင်တာလဲ။ ဒီကျောင်းကို ဘာကြောင့် ရွေးချယ်တာလဲဆိုတာလည်း ပြောပြပါ။",
  },
  {
    id: 3,
    japanese: "日本語学校を卒業した後は、何をする予定ですか。",
    englishTranslation:
      "What do you plan to do after graduating from the Japanese language school?",
    burmeseTranslation: "ဂျပန်စာကျောင်းကို ဘွဲ့ရပြီးရင် ဘာလုပ်ဖို့ စီစဉ်ထားပါသလဲ။",
  },
];
