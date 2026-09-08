import type { InterviewQuestion } from "./questions";

export type QuestionTopicKey =
  | "selfIntroduction"
  | "japaneseStudyHistory"
  | "motivationJapan"
  | "schoolChoice"
  | "studyPlan"
  | "futurePlan"
  | "financialSupport"
  | "educationWork"
  | "japaneseLevel"
  | "lifeInJapan";

export type BankQuestion = InterviewQuestion & {
  topic: QuestionTopicKey;
  isFollowUp?: boolean;
};

export const TOPIC_NAV_LABEL: Record<QuestionTopicKey, string> = {
  selfIntroduction: "Self-introduction",
  japaneseStudyHistory: "Japanese study",
  motivationJapan: "Motivation",
  schoolChoice: "School choice",
  studyPlan: "Study plan",
  futurePlan: "Future plan",
  financialSupport: "Financial support",
  educationWork: "Education & work",
  japaneseLevel: "Japanese level",
  lifeInJapan: "Life in Japan",
};

export const SESSION_TOPIC_ORDER: readonly QuestionTopicKey[] = [
  "selfIntroduction",
  "educationWork",
  "japaneseStudyHistory",
  "japaneseLevel",
  "motivationJapan",
  "schoolChoice",
  "studyPlan",
  "futurePlan",
  "financialSupport",
  "lifeInJapan",
];

export const CORE_SESSION_LENGTH = SESSION_TOPIC_ORDER.length;

export const questionBank: readonly BankQuestion[] = [
  {
    id: 101,
    topic: "selfIntroduction",
    japanese: "はじめに、簡単に自己紹介をお願いします。",
    englishTranslation: "First, please give a brief self-introduction.",
    burmeseTranslation: "ဦးစွာ သင့်ကိုယ်ရေးအကျဉ်းချုပ်ကို အနည်းငယ် ပြောပြပေးပါ။",
  },
  {
    id: 102,
    topic: "selfIntroduction",
    japanese: "お名前と出身、今していることを教えてください。",
    englishTranslation: "Please tell me your name, hometown, and what you are doing now.",
    burmeseTranslation: "နာမည်၊ မွေးရပ်၊ ယခု ဘာလုပ်နေသည်ကို ပြောပြပါ။",
  },
  {
    id: 103,
    topic: "selfIntroduction",
    japanese: "あなた自身について、短く紹介してください。",
    englishTranslation: "Please introduce yourself briefly.",
    burmeseTranslation: "သင့်အကြောင်း အတိုချုံး မိတ်ဆက်ပေးပါ။",
  },
  {
    id: 111,
    topic: "educationWork",
    japanese: "今の学歴やお仕事について教えてください。",
    englishTranslation: "Please tell me about your education or current work.",
    burmeseTranslation: "ယခု ပညာရေး သို့မဟုတ် အလုပ်အကြောင်း ပြောပြပါ။",
  },
  {
    id: 112,
    topic: "educationWork",
    japanese: "学校はいつ卒業しましたか。今は何をしていますか。",
    englishTranslation: "When did you graduate, and what do you do now?",
    burmeseTranslation: "ကျောင်း ဘယ်အချိန် ပြီးခဲ့သလဲ။ ယခု ဘာလုပ်နေသလဲ။",
  },
  {
    id: 113,
    topic: "educationWork",
    japanese: "今の状況を教えてください。学生ですか、働いていますか。",
    englishTranslation: "What is your situation now? Are you a student or working?",
    burmeseTranslation: "ယခု အခြေအနေကို ပြောပါ။ ကျောင်းသားလား၊ အလုပ်လုပ်နေသလား။",
  },
  {
    id: 121,
    topic: "japaneseStudyHistory",
    japanese: "日本語の勉強はいつ始めましたか。",
    englishTranslation: "When did you start studying Japanese?",
    burmeseTranslation: "ဂျပန်စာကို ဘယ်အချိန်က စသင်ခဲ့သလဲ။",
  },
  {
    id: 122,
    topic: "japaneseStudyHistory",
    japanese: "どのくらい日本語を勉強していますか。",
    englishTranslation: "How long have you been studying Japanese?",
    burmeseTranslation: "ဂျပန်စာကို ဘယ်လောက်ကြာအောင် သင်နေသလဲ။",
  },
  {
    id: 123,
    topic: "japaneseStudyHistory",
    japanese: "今、どこでどのように日本語を勉強していますか。",
    englishTranslation: "Where and how do you study Japanese now?",
    burmeseTranslation: "ယခု ဘယ်မှာ၊ ဘယ်လို ဂျပန်စာ သင်နေသလဲ။",
  },
  {
    id: 131,
    topic: "japaneseLevel",
    japanese: "今の日本語のレベルはどのくらいですか。",
    englishTranslation: "What is your current Japanese level?",
    burmeseTranslation: "ယခု သင့်ဂျပန်စာ အဆင့် ဘယ်လောက်ရှိသလဲ။",
  },
  {
    id: 132,
    topic: "japaneseLevel",
    japanese: "日本語でどんなことができますか。",
    englishTranslation: "What can you do in Japanese?",
    burmeseTranslation: "ဂျပန်လို ဘာတွေ လုပ်နိုင်သလဲ။",
  },
  {
    id: 133,
    topic: "japaneseLevel",
    japanese: "日本語の勉強で難しいことは何ですか。",
    englishTranslation: "What is difficult for you in Japanese study?",
    burmeseTranslation: "ဂျပန်စာ သင်ရာတွင် ဘာက ခက်ခဲသလဲ။",
  },
  {
    id: 141,
    topic: "motivationJapan",
    japanese: "どうして日本で日本語を勉強したいのですか。",
    englishTranslation: "Why do you want to study Japanese in Japan?",
    burmeseTranslation: "ဘာကြောင့် ဂျပန်မှာ ဂျပန်စာ သင်ချင်တာလဲ။",
  },
  {
    id: 142,
    topic: "motivationJapan",
    japanese: "どうして日本へ行きたいのですか。",
    englishTranslation: "Why do you want to go to Japan?",
    burmeseTranslation: "ဘာကြောင့် ဂျပန်ကို သွားချင်တာလဲ။",
  },
  {
    id: 143,
    topic: "motivationJapan",
    japanese: "日本語を勉強する理由を教えてください。",
    englishTranslation: "Please tell me your reason for studying Japanese.",
    burmeseTranslation: "ဂျပန်စာ သင်ရသည့် အကြောင်းရင်းကို ပြောပြပါ။",
  },
  {
    id: 151,
    topic: "schoolChoice",
    japanese: "どうしてこの学校を選んだのですか。",
    englishTranslation: "Why did you choose this school?",
    burmeseTranslation: "ဘာကြောင့် ဒီကျောင်းကို ရွေးတာလဲ။",
  },
  {
    id: 152,
    topic: "schoolChoice",
    japanese: "この学校について、何を知っていますか。",
    englishTranslation: "What do you know about this school?",
    burmeseTranslation: "ဒီကျောင်းအကြောင်း ဘာသိထားသလဲ။",
  },
  {
    id: 153,
    topic: "schoolChoice",
    japanese: "どうしてこのコースを選びましたか。",
    englishTranslation: "Why did you choose this course?",
    burmeseTranslation: "ဘာကြောင့် ဒီသင်တန်းကို ရွေးတာလဲ။",
  },
  {
    id: 161,
    topic: "studyPlan",
    japanese: "日本語学校では、どのくらい勉強する予定ですか。",
    englishTranslation: "How long do you plan to study at the language school?",
    burmeseTranslation: "ဂျပန်စာကျောင်းတွင် ဘယ်လောက်ကြာအောင် သင်မည်နည်း။",
  },
  {
    id: 162,
    topic: "studyPlan",
    japanese: "日本にいる間、どのように勉強しますか。",
    englishTranslation: "How will you study while you are in Japan?",
    burmeseTranslation: "ဂျပန်တွင် နေစဉ် ဘယ်လို သင်မည်နည်း။",
  },
  {
    id: 163,
    topic: "studyPlan",
    japanese: "日本語学校のあと、何を勉強したいですか。",
    englishTranslation: "What do you want to study after language school?",
    burmeseTranslation: "ဂျပန်စာကျောင်းပြီးရင် ဘာဆက်သင်ချင်သလဲ။",
  },
  {
    id: 171,
    topic: "futurePlan",
    japanese: "日本語学校を卒業した後は、何をする予定ですか。",
    englishTranslation: "What do you plan to do after graduating from language school?",
    burmeseTranslation: "ဂျပန်စာကျောင်း ပြီးရင် ဘာလုပ်မည်နည်း။",
  },
  {
    id: 172,
    topic: "futurePlan",
    japanese: "将来、どんな仕事がしたいですか。",
    englishTranslation: "What kind of work do you want in the future?",
    burmeseTranslation: "အနာဂတ်တွင် ဘယ်လို အလုပ် လုပ်ချင်သလဲ။",
  },
  {
    id: 173,
    topic: "futurePlan",
    japanese: "日本語は、あなたの将来の目標にどう役立ちますか。",
    englishTranslation: "How will Japanese help your future goal?",
    burmeseTranslation: "ဂျပန်စာသည် သင့်အနာဂတ် ရည်မှန်းချက်ကို ဘယ်လို ကူညီမလဲ။",
  },
  {
    id: 181,
    topic: "financialSupport",
    japanese: "授業料と生活費は、誰が払いますか。",
    englishTranslation: "Who will pay your tuition and living costs?",
    burmeseTranslation: "ကျောင်းစရိတ်နှင့် နေထိုင်စရိတ်ကို ဘယ်သူ ပေးမလဲ။",
  },
  {
    id: 182,
    topic: "financialSupport",
    japanese: "スポンサーは、あなたとどういう関係ですか。",
    englishTranslation: "What is your sponsor’s relationship to you?",
    burmeseTranslation: "စပွန်ဆာသည် သင်နှင့် ဘယ်လို ဆက်စပ်သလဲ။",
  },
  {
    id: 183,
    topic: "financialSupport",
    japanese: "スポンサーは、どんな仕事をしていますか。",
    englishTranslation: "What work does your sponsor do?",
    burmeseTranslation: "စပွန်ဆာသည် ဘာအလုပ် လုပ်သလဲ။",
  },
  {
    id: 191,
    topic: "lifeInJapan",
    japanese: "日本では、どこに住む予定ですか。",
    englishTranslation: "Where do you plan to live in Japan?",
    burmeseTranslation: "ဂျပန်တွင် ဘယ်မှာ နေမည်နည်း။",
  },
  {
    id: 192,
    topic: "lifeInJapan",
    japanese: "日本の生活で、気をつけたいことは何ですか。",
    englishTranslation: "What will you be careful about in daily life in Japan?",
    burmeseTranslation: "ဂျပန်နေထိုင်ရေးတွင် ဘာကို သတိထားမလဲ။",
  },
  {
    id: 193,
    topic: "lifeInJapan",
    japanese: "日本にいる間、アルバイトはしますか。",
    englishTranslation: "Will you have a part-time job while you are in Japan?",
    burmeseTranslation: "ဂျပန်တွင် နေစဉ် အချိန်ပိုင်း အလုပ် လုပ်မည်လား။",
  },
];

export const followUpBank: readonly BankQuestion[] = [
  {
    id: 241,
    topic: "motivationJapan",
    isFollowUp: true,
    japanese: "アニメや文化のほかに、勉強や仕事の目標はありますか。",
    englishTranslation:
      "Besides anime or culture, do you have an academic or career goal?",
    burmeseTranslation:
      "အန်နီမေး သို့မဟုတ် ယဉ်ကျေးမှုအပြင် ပညာရေး သို့မဟုတ် အလုပ် ရည်မှန်းချက် ရှိသလား။",
  },
  {
    id: 271,
    topic: "futurePlan",
    isFollowUp: true,
    japanese: "大学では、何を勉強したいですか。どうしてですか。",
    englishTranslation: "What subject do you want to study at university, and why?",
    burmeseTranslation: "တက္ကသိုလ်တွင် ဘာသင်ချင်သလဲ။ ဘာကြောင့်လဲ။",
  },
  {
    id: 281,
    topic: "financialSupport",
    isFollowUp: true,
    japanese: "生活費は、月にどのくらい必要だと思いますか。",
    englishTranslation: "How much do you think you need per month for living costs?",
    burmeseTranslation: "လစဉ် နေထိုင်စရိတ် ဘယ်လောက် လိုမည် ထင်သလဲ။",
  },
  {
    id: 261,
    topic: "studyPlan",
    isFollowUp: true,
    japanese: "その計画を、もう少し具体的に教えてください。",
    englishTranslation: "Please tell me that plan in a little more detail.",
    burmeseTranslation: "ထိုအစီအစဉ်ကို နည်းနည်း ပိုပြီး တိတိကျကျ ပြောပြပါ။",
  },
];

export function getBankQuestionById(id: number): BankQuestion | undefined {
  const found =
    questionBank.find((item) => item.id === id) ??
    followUpBank.find((item) => item.id === id);
  if (found) return found;
  const genericIndex = id - 200;
  if (genericIndex >= 0 && genericIndex < SESSION_TOPIC_ORDER.length) {
    return followUpForTopic(SESSION_TOPIC_ORDER[genericIndex]);
  }
  return undefined;
}

export function findInterviewQuestionById(
  id: number,
): InterviewQuestion | undefined {
  return getBankQuestionById(id);
}

export function variantsForTopic(topic: QuestionTopicKey): BankQuestion[] {
  return questionBank.filter((item) => item.topic === topic);
}

export function followUpForTopic(topic: QuestionTopicKey): BankQuestion {
  const specific = followUpBank.find((item) => item.topic === topic);
  if (specific) return specific;
  return {
    id: 200 + SESSION_TOPIC_ORDER.indexOf(topic),
    topic,
    isFollowUp: true,
    japanese: "もう少し詳しく教えてください。",
    englishTranslation: "Please tell me a little more.",
    burmeseTranslation: "နည်းနည်း ပိုပြီး အသေးစိတ် ပြောပြပါ။",
  };
}

export function pickSessionQuestions(
  random: () => number = Math.random,
  seenQuestionIds: readonly number[] = [],
): BankQuestion[] {
  const seen = new Set(seenQuestionIds);
  return SESSION_TOPIC_ORDER.map((topic) => {
    const variants = variantsForTopic(topic);
    const unused = variants.filter((item) => !seen.has(item.id));
    const pool = unused.length > 0 ? unused : variants;
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    return pool[index];
  });
}
