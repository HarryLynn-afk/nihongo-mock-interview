/**
 * Research questionnaire copy — mirrors the live Google Form
 * (NihonGo Research Questionnaire). One 1–5 agree scale for all ratings.
 *
 * MY strings are drafts pending native Burmese review, same as the rest of
 * the study copy; replace them in place after review.
 */
export const SURVEY_COPY = {
  consent: {
    english:
      "Your ratings help a CSC 485 research study on AI interview feedback. Answers are anonymous and optional.",
    burmese:
      "သင့်အဆင့်သတ်မှတ်ချက်များသည် CSC 485 သုတေသနလေ့လာမှုအတွက် အသုံးပြုပါမည်။ အမည်မဖော်ပြပါ၊ ဖြေရန်မလိုအပ်ပါ။",
  },
  scale: {
    low: { english: "Strongly disagree", burmese: "လုံးဝသဘောမတူပါ" },
    high: { english: "Strongly agree", burmese: "လုံးဝသဘောတူပါသည်" },
  },
  ratings: {
    improveUnderstanding: {
      english:
        "The feedback helped me understand how to improve my interview answers.",
      burmese:
        "အကြံပြုချက်သည် ကျွန်ုပ်၏ အင်တာဗျူးအဖြေများ တိုးတက်စေရန် မည်သို့ပြုပြင်ရမည်ကို နားလည်စေပါသည်။",
    },
    identifyWeaknesses: {
      english: "The feedback identified relevant weaknesses in my answers.",
      burmese:
        "အကြံပြုချက်သည် ကျွန်ုပ်၏ အဖြေများတွင် သက်ဆိုင်သော အားနည်းချက်များကို ဖော်ထုတ်ပေးပါသည်။",
    },
    rewriteUseful: {
      english:
        "The suggested Japanese rewrites were useful for improving my answers.",
      burmese:
        "အကြံပြုထားသော ဂျပန်စာ ပြန်လည်ရေးသားချက်များသည် ကျွန်ုပ်၏ အဖြေများ တိုးတက်စေရန် အသုံးဝင်ပါသည်။",
    },
    useAgain: {
      english:
        "I would use NihonGo again to prepare for a Japanese language-school interview.",
      burmese:
        "ဂျပန်ဘာသာစကားကျောင်း အင်တာဗျူးအတွက် ပြင်ဆင်ရန် NihonGo ကို ထပ်မံအသုံးပြုလိုပါသည်။",
    },
    easyToUse: {
      english: "The practice session was easy to use.",
      burmese: "လေ့ကျင့်ခန်း စက်ရှင်သည် အသုံးပြုရ လွယ်ကူပါသည်။",
    },
    clearSteps: {
      english:
        "It was clear what I needed to do during each part of the interview.",
      burmese:
        "အင်တာဗျူး၏ အပိုင်းတစ်ခုချင်းစီတွင် ဘာလုပ်ရမည်ကို ရှင်းလင်းစွာ သိရပါသည်။",
    },
    reportClear: {
      english: "The feedback report was easy to understand.",
      burmese: "အကြံပြုချက် အစီရင်ခံစာသည် နားလည်ရ လွယ်ကူပါသည်။",
    },
    completeEasily: {
      english:
        "I could complete the practice session without unnecessary difficulty.",
      burmese:
        "မလိုအပ်သော အခက်အခဲမရှိဘဲ လေ့ကျင့်ခန်း စက်ရှင်ကို ပြီးမြောက်နိုင်ပါသည်။",
    },
    transcriptAccurate: {
      english: "The displayed transcript accurately represented what I said.",
      burmese:
        "ပြသထားသော စာသားမှတ်တမ်းသည် ကျွန်ုပ်ပြောခဲ့သည့်အတိုင်း တိကျစွာ ဖော်ပြပါသည်။",
    },
    feedbackConsistent: {
      english: "The feedback was consistent with the answers I provided.",
      burmese:
        "အကြံပြုချက်သည် ကျွန်ုပ် ပေးခဲ့သော အဖြေများနှင့် တစ်သမတ်တည်း ဖြစ်ပါသည်။",
    },
  },
  openEnded: {
    mostHelpful: {
      english: "What was the most helpful part of NihonGo’s feedback?",
      burmese: "NihonGo၏ အကြံပြုချက်တွင် အထောက်အကူအဖြစ်ဆုံး အပိုင်းက ဘာလဲ။",
    },
    unclear: {
      english: "Was any feedback unclear, incorrect, or unhelpful? Please explain.",
      burmese:
        "ရှင်းလင်းမှုမရှိသော၊ မှားယွင်းသော သို့မဟုတ် အသုံးမဝင်သော အကြံပြုချက် ရှိပါသလား။ ရှင်းပြပါ။",
    },
    improvement: {
      english: "What is the most important improvement you would suggest?",
      burmese:
        "အရေးအကြီးဆုံး တိုးတက်အောင် ပြုလုပ်သင့်သည့် အချက်ကို အကြံပြုပါ။",
    },
  },
  skip: {
    english: "Skip",
    burmese: "ကျော်မည်",
  },
} as const;
