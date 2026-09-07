import type { RubricCategoryKey } from "./rubric";
import type { QuotedCritique } from "./parseQuotedCritiques";

const CORRECTIVE_MY: Record<RubricCategoryKey, string> = {
  speaking: "အသံထွက်နှင့် စကားစီးဆင်းမှုကို ပိုမိုကောင်းမွန်အောင် ပြုလုပ်ရန်",
  listening: "မေးခွန်းနှင့် ပိုမိုကိုက်ညီအောင် အဖြေပေးရန်",
  grammarPoliteness: "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှုကို ပိုမိုတိကျအောင် ပြုလုပ်ရန်",
  motivation: "လိုချင်သည့်ရည်ရွယ်ချက်ကို ပိုမိုရှင်းလင်းအောင် ဖော်ပြရန်",
  studyPlan: "လေ့လာမည့်အစီအစဉ်ကို ပိုမိုရှင်းလင်းအောင် ဖော်ပြရန်",
  consistency: "ယခင်အဖြေများနှင့် ပိုမိုကိုက်ညီအောင် ပြုလုပ်ရန်",
};

const AFFIRMING_MY: Record<RubricCategoryKey, string> = {
  speaking: "အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး",
  listening: "မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး",
  grammarPoliteness: "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှု တိကျပြီး",
  motivation: "ရည်ရွယ်ချက်ကို ရှင်းလင်းစွာ ဖော်ပြနိုင်ပြီး",
  studyPlan: "လေ့လာမည့်အစီအစဉ်ကို ရှင်းလင်းစွာ ဖော်ပြနိုင်ပြီး",
  consistency: "ယခင်အဖြေများနှင့် ကိုက်ညီစွာ ပြောနိုင်ပြီး",
};

const AFFIRMING_STRETCH: Record<RubricCategoryKey, string> = {
  speaking:
    "add one more complete spoken sentence so the self-introduction is easier to remember.",
  listening:
    "cover every part Tanaka-sensei asked, not only the first clause.",
  grammarPoliteness:
    "add one more complete です/ます sentence.",
  motivation:
    "add a specific future study or career goal to make your motivation more personal and memorable.",
  studyPlan:
    "add a realistic time frame and the next school or job after graduation.",
  consistency:
    "keep the same school name and plan in every answer.",
};

export function futureGoalSpecificity(
  transcript: string,
): "missing" | "vague" | "specific" {
  if (
    /エンジニア|プログラマー|IT|アイティー|専門学校|大学|大学院|看護師|介護|就職|進学/.test(
      transcript,
    )
  ) {
    return "specific";
  }
  if (/将来|夢|なりたい|働きたい|仕事/.test(transcript)) {
    return "vague";
  }
  return "missing";
}

function motivationOrPlanStretch(
  category: RubricCategoryKey,
  transcript: string,
): string {
  if (category !== "motivation" && category !== "studyPlan") {
    return AFFIRMING_STRETCH[category];
  }
  const specificity = futureGoalSpecificity(transcript);
  if (specificity === "specific") {
    return "connect this goal more directly to your choice of Japanese language school.";
  }
  if (specificity === "vague") {
    return "make your future goal more specific.";
  }
  return AFFIRMING_STRETCH[category];
}

export type NextStepView = {
  heading: string;
  lines: string[];
  rewriteHeading: string;
  rewrite: string;
};

export function buildNextStep({
  affirming,
  raw,
  category,
  transcript,
  quote,
  explanation,
  rewrite,
}: {
  affirming: boolean;
  raw: number;
  category: RubricCategoryKey;
  transcript: string;
  quote: string;
  explanation: string;
  rewrite: string;
}): NextStepView {
  if (!affirming) {
    return {
      heading: "Improve next",
      lines: [explanation],
      rewriteHeading: "Suggested improved Japanese answer",
      rewrite,
    };
  }

  const stretch = motivationOrPlanStretch(category, transcript);
  if (raw >= 5) {
    return {
      heading: "Optional enhancement",
      lines: [
        "Your answer already meets this criterion strongly.",
        `If you want a richer answer, ${stretch}`,
      ],
      rewriteHeading: "Useful phrase to keep",
      rewrite: quote,
    };
  }

  return {
    heading: "Make it even stronger",
    lines: [`Optional: ${stretch.charAt(0).toUpperCase()}${stretch.slice(1)}`],
    rewriteHeading: "Useful phrase to keep",
    rewrite: quote,
  };
}

const FALLBACK_STRENGTH: Record<RubricCategoryKey, string> = {
  speaking: "You answered this Question in Japanese.",
  listening: "You responded to Tanaka-sensei's Question.",
  grammarPoliteness: "You stayed in Japanese for this answer.",
  motivation: "You gave a reason for studying in Japan.",
  studyPlan: "You described a next step after the language school.",
  consistency: "You stayed on the same interview topic.",
};

const STRETCH_REWRITE_EXTRA = [
  "この学校で日本語を勉強したいです。",
  "将来の仕事のためにも、ここで実践的な日本語を学びたいです。",
  "その後、日本語を使って働きたいです。",
] as const;

export type FormattedCritique = {
  quote: string;
  explanation: string;
  rewrite: string;
  burmese: string;
};

export function isAffirmingCritique(critique: {
  quote: string;
  rewrite: string;
}): boolean {
  return critique.rewrite === critique.quote;
}

export function stretchImprovement(category: RubricCategoryKey): string {
  return AFFIRMING_STRETCH[category];
}

export function fallbackStrength(category: RubricCategoryKey): string {
  return FALLBACK_STRENGTH[category];
}

export function stretchRewriteForQuestion(
  questionIndex: number,
  quote: string,
): string {
  const extra = STRETCH_REWRITE_EXTRA[questionIndex] ?? STRETCH_REWRITE_EXTRA[0];
  const base = quote.trim() || "（無言）";
  const withStop = /[。．.]$/.test(base) ? base : `${base}。`;
  if (withStop.includes(extra)) return withStop;
  return `${withStop}${extra}`;
}

export function formatQuotedCritique(critique: QuotedCritique): FormattedCritique {
  const { quote, explanation, rewrite, category } = critique;
  const burmese =
    rewrite === quote
      ? `သင်ပြောခဲ့သည့်စာကြောင်း − 「${quote}」။ ${AFFIRMING_MY[category]}၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။`
      : `သင်ပြောခဲ့သည့်စာကြောင်း − 「${quote}」။ ${CORRECTIVE_MY[category]}။ ဒီအစား − 「${rewrite}」 ဟုပြောနိုင်ပါသည်။`;
  return { quote, explanation, rewrite, burmese };
}
