export type PitchAnswer = {
  questionIndex: 0 | 1 | 2;
  japanese: string;
  english: string;
  burmese: string;
};

/**
 * Aung Min Khant's 3 locked phone-clip answers for Pitch mode (`?pitch=1`) —
 * the CSC 492 oral-exam / project-presentation demo path. On `?pitch=1`, the
 * EN/MY lines here are shown by questionIndex after each answer — never
 * fuzzy-matched against the live transcript.
 *
 * NOTE: english/burmese were authored for this build (the PRD locks the
 * Japanese phone-clip lines; it does not supply exact EN/MY wording).
 * Have a native Burmese speaker review `burmese` before the CSC 492
 * oral exam / project presentation.
 */
export const pitchAnswers: readonly PitchAnswer[] = [
  {
    questionIndex: 0,
    japanese:
      "アウン・ミン・タントです。23歳、マンダレーから来ました。コンピューターを勉強しました。ITの専門学校に行きたいです。",
    english:
      "I am Aung Min Khant. I am 23 years old and I come from Mandalay. I studied computer science. I want to go to an IT vocational school.",
    burmese:
      "ကျွန်တော် အောင်မင်းခန့်ပါ။ အသက် ၂၃ နှစ်ရှိပြီး မန္တလေးက လာတာပါ။ ကွန်ပျူတာဘာသာရပ် သင်ခဲ့ပါတယ်။ IT အထူးပြု ကျောင်း တက်ချင်ပါတယ်။",
  },
  {
    questionIndex: 1,
    japanese:
      "東京パスウェイは秋葉原の近くです。ITの進路指導があります。この学校で日本語を勉強したいです。",
    english:
      "Tokyo Pathway is near Akihabara. It offers IT career guidance. I want to study Japanese at this school.",
    burmese:
      "တိုကျိုပါသဝေးက အကီဟာဘာရ အနီးမှာ ရှိပါတယ်။ IT အလုပ်အကိုင် လမ်းညွှန်မှု ရှိပါတယ်။ ဒီကျောင်းမှာ ဂျပန်စာ သင်ယူချင်ပါတယ်။",
  },
  {
    questionIndex: 2,
    japanese: "専門学校でウェブを勉強します。そのあとエンジニアになりたいです。",
    english:
      "I will study web development at a vocational school. After that, I want to become an engineer.",
    burmese:
      "အထူးပြု ကျောင်းမှာ ဝဘ်ဖွံ့ဖြိုးမှု သင်ပါမယ်။ ပြီးရင် အင်ဂျင်နီယာ ဖြစ်ချင်ပါတယ်။",
  },
];

export function getPitchCaptions(
  questionIndex: number,
): { english: string; burmese: string } | null {
  const answer = pitchAnswers.find((row) => row.questionIndex === questionIndex);
  if (!answer) return null;
  return { english: answer.english, burmese: answer.burmese };
}
