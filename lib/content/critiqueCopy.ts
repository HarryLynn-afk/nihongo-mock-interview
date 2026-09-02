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

export type FormattedCritique = {
  quote: string;
  explanation: string;
  rewrite: string;
  burmese: string;
};

export function formatQuotedCritique(critique: QuotedCritique): FormattedCritique {
  const { quote, explanation, rewrite, category } = critique;
  const burmese =
    rewrite === quote
      ? `သင်ပြောခဲ့သည့်စာကြောင်း − 「${quote}」။ ${AFFIRMING_MY[category]}၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။`
      : `သင်ပြောခဲ့သည့်စာကြောင်း − 「${quote}」။ ${CORRECTIVE_MY[category]}။ ဒီအစား − 「${rewrite}」 ဟုပြောနိုင်ပါသည်။`;
  return { quote, explanation, rewrite, burmese };
}
