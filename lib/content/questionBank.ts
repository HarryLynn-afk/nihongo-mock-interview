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
  },
  {
    id: 102,
    topic: "selfIntroduction",
    japanese: "お名前と出身、今していることを教えてください。",
    englishTranslation: "Please tell me your name, hometown, and what you are doing now.",
  },
  {
    id: 103,
    topic: "selfIntroduction",
    japanese: "あなた自身について、短く紹介してください。",
    englishTranslation: "Please introduce yourself briefly.",
  },
  {
    id: 111,
    topic: "educationWork",
    japanese: "今の学歴やお仕事について教えてください。",
    englishTranslation: "Please tell me about your education or current work.",
  },
  {
    id: 112,
    topic: "educationWork",
    japanese: "学校はいつ卒業しましたか。今は何をしていますか。",
    englishTranslation: "When did you graduate, and what do you do now?",
  },
  {
    id: 113,
    topic: "educationWork",
    japanese: "今の状況を教えてください。学生ですか、働いていますか。",
    englishTranslation: "What is your situation now? Are you a student or working?",
  },
  {
    id: 114,
    topic: "educationWork",
    japanese: "学校を卒業してから今まで、何をしていましたか。",
    englishTranslation: "What have you been doing from graduation until now?",
  },
  {
    id: 121,
    topic: "japaneseStudyHistory",
    japanese: "日本語の勉強はいつ始めましたか。",
    englishTranslation: "When did you start studying Japanese?",
  },
  {
    id: 122,
    topic: "japaneseStudyHistory",
    japanese: "どのくらい日本語を勉強していますか。",
    englishTranslation: "How long have you been studying Japanese?",
  },
  {
    id: 123,
    topic: "japaneseStudyHistory",
    japanese: "今、どこでどのように日本語を勉強していますか。",
    englishTranslation: "Where and how do you study Japanese now?",
  },
  {
    id: 131,
    topic: "japaneseLevel",
    japanese: "今の日本語のレベルはどのくらいですか。",
    englishTranslation: "What is your current Japanese level?",
  },
  {
    id: 132,
    topic: "japaneseLevel",
    japanese: "日本語でどんなことができますか。",
    englishTranslation: "What can you do in Japanese?",
  },
  {
    id: 133,
    topic: "japaneseLevel",
    japanese: "日本語の勉強で難しいことは何ですか。",
    englishTranslation: "What is difficult for you in Japanese study?",
  },
  {
    id: 141,
    topic: "motivationJapan",
    japanese: "どうして日本で日本語を勉強したいのですか。",
    englishTranslation: "Why do you want to study Japanese in Japan?",
  },
  {
    id: 142,
    topic: "motivationJapan",
    japanese: "どうして日本へ行きたいのですか。",
    englishTranslation: "Why do you want to go to Japan?",
  },
  {
    id: 143,
    topic: "motivationJapan",
    japanese: "日本語を勉強する理由を教えてください。",
    englishTranslation: "Please tell me your reason for studying Japanese.",
  },
  {
    id: 151,
    topic: "schoolChoice",
    japanese: "どうしてこの学校を選んだのですか。",
    englishTranslation: "Why did you choose this school?",
  },
  {
    id: 152,
    topic: "schoolChoice",
    japanese: "この学校について、何を知っていますか。",
    englishTranslation: "What do you know about this school?",
  },
  {
    id: 153,
    topic: "schoolChoice",
    japanese: "どうしてこのコースを選びましたか。",
    englishTranslation: "Why did you choose this course?",
  },
  {
    id: 154,
    topic: "schoolChoice",
    japanese: "この学校のどんなところに興味がありますか。",
    englishTranslation: "What about this school interests you?",
  },
  {
    id: 155,
    topic: "schoolChoice",
    japanese: "この学校では、どんなコースを勉強したいですか。",
    englishTranslation: "What course do you want to study at this school?",
  },
  {
    id: 161,
    topic: "studyPlan",
    japanese: "日本語学校では、どのくらい勉強する予定ですか。",
    englishTranslation: "How long do you plan to study at the language school?",
  },
  {
    id: 162,
    topic: "studyPlan",
    japanese: "日本にいる間、どのように勉強しますか。",
    englishTranslation: "How will you study while you are in Japan?",
  },
  {
    id: 164,
    topic: "studyPlan",
    japanese: "日本語学校では、どのような目標を持って勉強しますか。",
    englishTranslation: "What goals will you study toward at the language school?",
  },
  {
    id: 163,
    topic: "futurePlan",
    japanese: "日本語学校のあと、何を勉強したいですか。",
    englishTranslation: "What do you want to study after language school?",
  },
  {
    id: 171,
    topic: "futurePlan",
    japanese: "日本語学校を卒業した後は、何をする予定ですか。",
    englishTranslation: "What do you plan to do after graduating from language school?",
  },
  {
    id: 172,
    topic: "futurePlan",
    japanese: "将来、どんな仕事がしたいですか。",
    englishTranslation: "What kind of work do you want in the future?",
  },
  {
    id: 173,
    topic: "futurePlan",
    japanese: "日本語は、あなたの将来の目標にどう役立ちますか。",
    englishTranslation: "How will Japanese help your future goal?",
  },
  {
    id: 181,
    topic: "financialSupport",
    japanese: "授業料と生活費は、誰が払いますか。",
    englishTranslation: "Who will pay your tuition and living costs?",
  },
  {
    id: 182,
    topic: "financialSupport",
    japanese: "スポンサーは、あなたとどういう関係ですか。",
    englishTranslation: "What is your sponsor’s relationship to you?",
  },
  {
    id: 183,
    topic: "financialSupport",
    japanese: "スポンサーは、どんな仕事をしていますか。",
    englishTranslation: "What work does your sponsor do?",
  },
  {
    id: 184,
    topic: "financialSupport",
    japanese: "スポンサーは、どうしてあなたを支援しますか。",
    englishTranslation: "Why is your sponsor supporting you?",
  },
  {
    id: 185,
    topic: "financialSupport",
    japanese: "授業料と生活費について、どのように準備していますか。",
    englishTranslation: "How are you preparing for tuition and living costs?",
  },
  {
    id: 191,
    topic: "lifeInJapan",
    japanese: "日本では、どこに住む予定ですか。",
    englishTranslation: "Where do you plan to live in Japan?",
  },
  {
    id: 192,
    topic: "lifeInJapan",
    japanese: "日本の生活で、気をつけたいことは何ですか。",
    englishTranslation: "What will you be careful about in daily life in Japan?",
  },
  {
    id: 193,
    topic: "lifeInJapan",
    japanese: "日本にいる間、アルバイトはしますか。",
    englishTranslation: "Will you have a part-time job while you are in Japan?",
  },
];

export const followUpBank: readonly BankQuestion[] = [
  {
    id: 201,
    topic: "selfIntroduction",
    isFollowUp: true,
    japanese: "出身地や、今していることについて、もう少し教えてください。",
    englishTranslation: "Please tell me a little more about your hometown and what you do now.",
  },
  {
    id: 211,
    topic: "educationWork",
    isFollowUp: true,
    japanese: "卒業してから今まで、何をしていましたか。",
    englishTranslation: "What have you been doing since you graduated?",
  },
  {
    id: 221,
    topic: "japaneseStudyHistory",
    isFollowUp: true,
    japanese: "日本語の勉強は、一日にどのくらいしていますか。",
    englishTranslation: "How much Japanese do you study each day?",
  },
  {
    id: 231,
    topic: "japaneseLevel",
    isFollowUp: true,
    japanese: "日本語の試験を受けたことがありますか。",
    englishTranslation: "Have you taken a Japanese language test?",
  },
  {
    id: 241,
    topic: "motivationJapan",
    isFollowUp: true,
    japanese: "アニメや文化のほかに、勉強や仕事の目標はありますか。",
    englishTranslation:
      "Besides anime or culture, do you have an academic or career goal?",
  },
  {
    id: 251,
    topic: "schoolChoice",
    isFollowUp: true,
    japanese: "この学校のどんなコースやサポートに興味がありますか。",
    englishTranslation: "Which course or support at this school interests you?",
  },
  {
    id: 261,
    topic: "studyPlan",
    isFollowUp: true,
    japanese: "日本語学校では、毎日どのように勉強しますか。",
    englishTranslation: "How will you study each day at the language school?",
  },
  {
    id: 271,
    topic: "futurePlan",
    isFollowUp: true,
    japanese: "大学では、何を勉強したいですか。どうしてですか。",
    englishTranslation: "What subject do you want to study at university, and why?",
  },
  {
    id: 281,
    topic: "financialSupport",
    isFollowUp: true,
    japanese: "生活費は、月にどのくらい必要だと思いますか。",
    englishTranslation: "How much do you think you need per month for living costs?",
  },
  {
    id: 291,
    topic: "lifeInJapan",
    isFollowUp: true,
    japanese: "住む場所や毎日の生活について、どのように準備していますか。",
    englishTranslation: "How are you preparing for housing and daily life?",
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
  if (!specific) {
    throw new Error(`Missing follow-up for topic: ${topic}`);
  }
  return specific;
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
