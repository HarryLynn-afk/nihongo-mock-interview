import type { RubricCategoryKey } from "./rubric";
import type { QuotedCritique } from "./parseQuotedCritiques";
import type { UiLocale } from "./locale";
import { uiCopy } from "./uiCopy";

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

const STRETCH: Record<UiLocale, Record<RubricCategoryKey, string>> = {
  en: {
    speaking:
      "add one more complete spoken sentence so the self-introduction is easier to remember.",
    listening:
      "cover every part Tanaka-sensei asked, not only the first clause.",
    grammarPoliteness: "add one more complete です/ます sentence.",
    motivation:
      "add a specific future study or career goal to make your motivation more personal and memorable.",
    studyPlan:
      "add a realistic time frame and the next school or job after graduation.",
    consistency: "keep the same school name and plan in every answer.",
  },
  my: {
    speaking:
      "နောက်ထပ် ပြည့်စုံသော ပြောစကားတစ်ကြောင်း ထည့်ပြောပါ။",
    listening:
      "Tanaka-sensei မေးသည့် အချက်တိုင်းကို ဖြေပါ၊ ပထမစာကြောင်းကိုသာ မဖြေပါနှင့်။",
    grammarPoliteness:
      "နောက်ထပ် ပြည့်စုံသော です/ます စာကြောင်းတစ်ကြောင်း ထည့်ပါ။",
    motivation:
      "သင့်ရည်ရွယ်ချက်ကို ပိုမိုကိုယ်ပိုင်ဆန်အောင် အနာဂတ် လေ့လာရေး သို့မဟုတ် အလုပ်အကိုင် ရည်မှန်းချက်တစ်ခု ထည့်ပါ။",
    studyPlan:
      "အချိန်ကာလတစ်ခုနှင့် ဘွဲ့ရပြီးနောက် ကျောင်း သို့မဟုတ် အလုပ်ကို ထည့်ပါ။",
    consistency:
      "အဖြေတိုင်းတွင် ကျောင်းအမည်နှင့် အစီအစဉ်ကို တူညီစွာ ထားပါ။",
  },
};

const GOAL_STRETCH: Record<UiLocale, { specific: string; vague: string }> = {
  en: {
    specific:
      "connect this goal more directly to your choice of Japanese language school.",
    vague: "make your future goal more specific.",
  },
  my: {
    specific:
      "ဤရည်မှန်းချက်ကို ဂျပန်ဘာသာစကားကျောင်း ရွေးချယ်မှုနှင့် ပိုမိုတိုက်ရိုက် ချိတ်ဆက်ပါ။",
    vague: "သင့်အနာဂတ် ရည်မှန်းချက်ကို ပိုမိုတိကျအောင် ဖော်ပြပါ။",
  },
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
  locale: UiLocale,
): string {
  if (category !== "motivation" && category !== "studyPlan") {
    return STRETCH[locale][category];
  }
  const specificity = futureGoalSpecificity(transcript);
  if (specificity === "specific") {
    return GOAL_STRETCH[locale].specific;
  }
  if (specificity === "vague") {
    return GOAL_STRETCH[locale].vague;
  }
  return STRETCH[locale][category];
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
  locale,
}: {
  affirming: boolean;
  raw: number;
  category: RubricCategoryKey;
  transcript: string;
  quote: string;
  explanation: string;
  rewrite: string;
  locale: UiLocale;
}): NextStepView {
  const copy = uiCopy(locale);
  if (!affirming) {
    return {
      heading: copy.report.improveNext,
      lines: [explanation],
      rewriteHeading: copy.report.rewriteHeading,
      rewrite,
    };
  }

  const stretch = motivationOrPlanStretch(category, transcript, locale);
  if (raw >= 5) {
    return {
      heading: copy.report.optionalEnhancement,
      lines: [
        copy.report.alreadyMeets,
        copy.report.richerAnswer.replace("{stretch}", stretch),
      ],
      rewriteHeading: copy.report.usefulPhrase,
      rewrite: quote,
    };
  }

  return {
    heading: copy.report.makeStronger,
    lines: [copy.report.optionalLine.replace("{stretch}", stretch)],
    rewriteHeading: copy.report.usefulPhrase,
    rewrite: quote,
  };
}

const STRETCH_REWRITE_EXTRA = [
  "この学校で日本語を勉強したいです。",
  "将来の仕事のためにも、ここで実践的な日本語を学びたいです。",
  "その後、日本語を使って働きたいです。",
] as const;

export type FormattedCritique = {
  quote: string;
  explanation: string;
  rewrite: string;
};

export function isAffirmingCritique(critique: {
  quote: string;
  rewrite: string;
}): boolean {
  return critique.rewrite === critique.quote;
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

export function formatQuotedCritique(
  critique: QuotedCritique,
  locale: UiLocale,
): FormattedCritique {
  const { quote, explanation, rewrite, category } = critique;
  if (locale === "my") {
    return {
      quote,
      rewrite,
      explanation:
        rewrite === quote
          ? `${AFFIRMING_MY[category]}၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။`
          : `${CORRECTIVE_MY[category]}။`,
    };
  }
  return { quote, explanation, rewrite };
}
