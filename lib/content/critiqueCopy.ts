import type { RubricCategoryKey } from "./rubric";
import type { QuotedCritique } from "./parseQuotedCritiques";
import type { UiLocale } from "./locale";
import type { QuestionTopicKey } from "./questionBank";
import { uiCopy } from "./uiCopy";

const CORRECTIVE_MY: Record<RubricCategoryKey, string> = {
  answerRelevance: "မေးခွန်းနှင့် ပိုမိုကိုက်ညီအောင် အဖြေပေးရန်",
  contentCompleteness: "ပိုမိုအသုံးဝင်သော အချက်အလက်များ ထည့်သွင်းဖြေရန်",
  japaneseClarity: "ဂျပန်စကား၏ အဓိပ္ပာယ်ကို ပိုမိုရှင်းလင်းအောင် ပြောရန်",
  grammarPoliteness:
    "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှုကို ပိုမိုတိကျအောင် ပြုလုပ်ရန်",
  consistency: "ယခင်အဖြေများနှင့် ပိုမိုကိုက်ညီအောင် ပြုလုပ်ရန်",
};

const AFFIRMING_MY: Record<RubricCategoryKey, string> = {
  answerRelevance: "မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး",
  contentCompleteness:
    "လိုအပ်သော အချက်အလက်များ လုံလောက်စွာ ဖော်ပြနိုင်ပြီး",
  japaneseClarity: "ဂျပန်စကားကို ရှင်းလင်းစွာ ပြောနိုင်ပြီး",
  grammarPoliteness: "ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှု တိကျပြီး",
  consistency: "ယခင်အဖြေများနှင့် ကိုက်ညီစွာ ပြောနိုင်ပြီး",
};

const STRETCH: Record<UiLocale, Record<RubricCategoryKey, string>> = {
  en: {
    answerRelevance:
      "cover every part Tanaka-sensei asked, not only the first clause.",
    contentCompleteness:
      "add one or two concrete details (a reason, a place, or a next step) so the answer feels complete.",
    japaneseClarity: "say the same idea in one shorter, clearly connected sentence.",
    grammarPoliteness: "add one more complete です/ます sentence.",
    consistency: "keep the same school name and plan in every answer.",
  },
  my: {
    answerRelevance:
      "Tanaka-sensei မေးသည့် အချက်တိုင်းကို ဖြေပါ၊ ပထမစာကြောင်းကိုသာ မဖြေပါနှင့်။",
    contentCompleteness:
      "အကြောင်းရင်း၊ နေရာ သို့မဟုတ် နောက်တစ်ဆင့်ကဲ့သို့ အတိအကျ အချက်အလက် တစ်ခုနှစ်ခု ထည့်ပြောပါ။",
    japaneseClarity:
      "အဓိပ္ပာယ်တူစကားကို ပိုတိုပြီး ဆက်စပ်မှုရှိသော စာကြောင်းတစ်ကြောင်းနဲ့ ပြောပါ။",
    grammarPoliteness:
      "နောက်ထပ် ပြည့်စုံသော です/ます စာကြောင်းတစ်ကြောင်း ထည့်ပါ။",
    consistency: "အဖြေတိုင်းတွင် ကျောင်းအမည်နှင့် အစီအစဉ်ကို တူညီစွာ ထားပါ။",
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

function contentStretch(
  category: RubricCategoryKey,
  transcript: string,
  locale: UiLocale,
  topic: QuestionTopicKey | null,
): string {
  if (category !== "contentCompleteness" || topic !== "futurePlan") {
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
  improvement: string;
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
  topic,
}: {
  affirming: boolean;
  raw: number;
  category: RubricCategoryKey;
  transcript: string;
  quote: string;
  explanation: string;
  rewrite: string;
  locale: UiLocale;
  topic: QuestionTopicKey | null;
}): NextStepView {
  const copy = uiCopy(locale);
  if (!affirming) {
    return {
      heading: copy.report.improveNext,
      improvement: explanation,
      rewriteHeading: copy.report.rewriteHeading,
      rewrite,
    };
  }

  const stretch = contentStretch(category, transcript, locale, topic);
  if (raw >= 4) {
    return {
      heading: copy.report.optionalEnhancement,
      improvement: copy.report.richerAnswer.replace("{stretch}", stretch),
      rewriteHeading: copy.report.usefulPhrase,
      rewrite: quote,
    };
  }

  return {
    heading: copy.report.makeStronger,
    improvement: copy.report.optionalLine.replace("{stretch}", stretch),
    rewriteHeading: copy.report.usefulPhrase,
    rewrite: quote,
  };
}

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
