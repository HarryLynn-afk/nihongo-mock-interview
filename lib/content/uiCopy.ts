import type { UiLocale } from "./locale";

const en = {
  start: {
    headline: "Practice your interview with Tanaka-sensei",
    subhead:
      "Speak real interview questions in Japanese and get a coaching report back.",
    tryAsGuest: "Try as guest",
    participantLogin: "Participant login",
    guestCaption: "Guest practice isn't saved.",
    computerOnly: "Open on a computer to join the interview.",
    facts: {
      camera: "Camera optional",
      speak: "Speak in Japanese",
      report: "Coaching report",
      duration: "10–15 min",
    },
    howItWorks: {
      title: "How it works",
      steps: {
        join: {
          title: "Join the classroom",
          body: "Video is optional. You can continue with voice.",
        },
        speak: {
          title: "Answer out loud",
          body: "Answer Tanaka-sensei's Questions out loud in Japanese.",
        },
        report: {
          title: "Read the report",
          body: "After the Interview, read a coaching report on this screen.",
        },
      },
    },
  },
  login: {
    title: "Sign in to NihonGo",
    body: "Invited testers sign in with Google using the email on the list.",
    google: "Continue with Google",
    close: "Close",
    linkSent: "If this email is eligible, a sign-in link has been sent.",
    errorNotInvited: "This Google account is not in the invited-tester list.",
  },
  consent: {
    title: "Study consent",
    body:
      "This practice Interview can be saved for the NihonGo user study (consent version {version}). Answers and scores are stored under a participant id, not your name. Guest sessions stay separate and are not added to the study.",
    checkbox:
      "I agree to take part and to save this session under a participant id.",
    agree: "Agree and continue",
    guestInstead: "Try as guest instead",
    participantId: "Your participant id is",
    participantIdNote: "This id is shown in the app; your email is not.",
    errorSignedOut:
      "You are not signed in. Use Participant login, then agree.",
    errorNotInvited: "This email is not in the invited-tester list.",
    errorSave: "Consent could not be saved. Try Participant login again.",
  },
  auth: {
    title: "Participant sign-in",
    signingIn: "Signing you in…",
    missing:
      "No sign-in token was in this link. Request a new one from Participant login.",
    expired:
      "This sign-in link was already opened or has expired. Mail scanners can open it before you do. Request a new one and click it once.",
    notConfigured: "Sign-in is not configured.",
    participantLogin: "Participant login",
  },
  pitch: {
    chip: "Presentation demo",
    heading: "Pitch mode",
    body: "Three locked questions, guided captions, and the live coaching report — the CSC 492 oral-exam walkthrough.",
    startDemo: "Start demo",
    footer: "This page is not linked from the app. Reach it directly at /pitch.",
    locked: "This demo is locked.",
    accessKey: "Access key",
    unlock: "Unlock",
    badKey: "That key did not work.",
    lockedFooter: "This page is not linked from the app.",
  },
  join: {
    joinInterview: "Join interview",
  },
  joinLink: {
    title: "Join NihonGo",
    body: "Sign in with Google to join this tester's practice group.",
    google: "Continue with Google",
    unknown: "This sign-up link isn't available.",
    full: "This sign-up link is full.",
    footer: "This page is not linked from the app. Use the link your tester sent.",
  },
  lobby: {
    readyToJoin: "Ready to join",
    heading: "Japanese interview with Tanaka-sensei",
    subhead: "Choose camera and microphone, then enter the classroom.",
    camera: "Camera",
    microphone: "Microphone",
    mic: "Mic",
    cameraOptional: "Camera is optional. Your feedback comes from your voice.",
    enterClassroom: "Enter classroom",
    cameraReady: "ready",
    cameraOff: "off",
    cameraBlocked: "blocked",
    micReady: "ready",
    micOff: "off",
    micBlocked: "blocked",
  },
  reminder: {
    aria: "Interview will start soon",
    eyebrow: "Japanese interview with Tanaka-sensei",
    heading: "Interview will start soon",
    skip: "Skip",
  },
  call: {
    guestBanner: "Guest practice is not saved and is not part of the study.",
    participant: "Participant",
    skipInterview: "Skip interview",
    questionOf: "Question {n} of {total}",
    senseiSpeaking: "Sensei speaking",
    studentAnswering: "Student answering",
    noAnswerCaptured: "(No answer captured)",
    interviewComplete: "Interview complete",
    you: "You",
    cameraOn: "Camera on",
    cameraOff: "Camera off",
    micOn: "Mic on",
    micOff: "Mic off",
    question: "Question",
    hearAgain: "Hear again",
    stopHearing: "Stop hearing",
    speakAnswer: "Speak answer",
    pauseListening: "Pause listening",
    resumeListening: "Resume listening",
    liveTranscript: "Live transcript",
    listening: "Listening…",
    paused: "Paused",
    submitAnswer: "Submit answer",
    answerAgain: "Answer again",
    oneRetry: "1 retry",
  },
  report: {
    title: "AI Interview Practice Feedback",
    answerQualityTitle: "Interview Answer Quality",
    disclaimer:
      "NihonGo provides AI-assisted mock interview practice. It evaluates interview-answer quality from the confirmed transcript. It is not an official language-proficiency score or admission decision.",
    listeningNote:
      "Listening comprehension is not scored — this session has no listening task. Answer relevance is whether each answer matched the Question.",
    transcript: "Interview transcript",
    helpTheStudy: "Help the study",
    yourAnswer: "Your answer",
    whatWentWell: "What you did well",
    noStrength: "No strength note for this Question.",
    noExtra: "No extra correction for this Question.",
    noRewrite: "No rewrite was returned for this Question.",
    evidence: "Evidence",
    missingElement: "Missing element",
    questionLabel: "Question",
    deliveryTitle: "Speech Delivery Signals",
    noAnswerTranscript: "No answer was captured for this Question.",
    noAnswerNextHeading: "Try this Question again next practice",
    noAnswerNextStep:
      "Check your microphone and try this Question again in your next practice session.",
    improveNext: "Improve next",
    rewriteHeading: "Suggested improved Japanese answer",
    optionalEnhancement: "Optional enhancement",
    makeStronger: "Make it even stronger",
    usefulPhrase: "Useful phrase to keep",
    headline: {
      Ready: "Strong",
      AlmostReady: "Good",
      KeepPracticing: "Keep practicing",
    },
    rating: {
      1: "Needs major improvement",
      2: "Needs improvement",
      3: "Developing",
      4: "Good",
      5: "Strong",
    },
    scores: {
      listening: "Answer relevance",
      grammarPoliteness: "Grammar & naturalness",
      motivation: "Motivation for studying in Japan",
      studyPlan: "Study plan specificity",
      consistency: "Consistency across answers",
    },
    radar: {
      listening: "Relevance",
      grammarPoliteness: "Grammar",
      motivation: "Motivation",
      studyPlan: "Study plan",
      consistency: "Consistency",
    },
    topics: {
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
    },
    deliveryHeadline: {
      unavailable: "Not assessed",
      notAssessed: "Not assessed",
      needsPractice: "Needs practice",
      clearEnough: "Clear enough",
    },
    deliveryNote: {
      unavailable: "No spoken answer was captured to analyze.",
      notAssessed:
        "Recording was too quiet or too short for basic timing analysis.",
      needsPractice:
        "Your answer included several long pauses. Audio was clear enough for basic timing analysis.",
      clearEnough:
        "Audio was clear enough for basic timing analysis. These are timing signals, not a Japanese proficiency score.",
    },
  },
  usefulness: {
    title: "Help the study",
    close: "Close",
    submit: "Submit",
    comment: "Comment",
  },
  micTrouble: {
    title: "We couldn't hear you",
    body: "None of your answers were captured this session. Check that your microphone is connected and not muted by your browser or operating system, then try the interview again.",
  },
  cameraMiss: {
    title: "Camera isn't available",
    steps: "You can continue with voice. This Interview does not need video.",
    after: "Try Camera again if you want a preview, or enter the classroom.",
  },
} as const;

export type UiCopy = typeof en;

const my: UiCopy = {
  start: {
    headline: "Tanaka-sensei နှင့် အင်တာဗျူး လေ့ကျင့်ပါ",
    subhead:
      "ဂျပန်လို အင်တာဗျူးမေးခွန်းများကို ဖြေဆိုပြီး coaching report ရယူပါ။",
    tryAsGuest: "ဧည့်သည်အဖြစ် စမ်းကြည့်ရန်",
    participantLogin: "ပါဝင်သူ ဝင်ရောက်ရန်",
    guestCaption: "ဧည့်သည် လေ့ကျင့်မှုကို သိမ်းမထားပါ။",
    computerOnly: "အင်တာဗျူးတက်ရန် ကွန်ပျူတာပေါ်တွင် ဖွင့်ပါ။",
    facts: {
      camera: "ကင်မရာ မလိုအပ်ပါ",
      speak: "ဂျပန်လို ပြောရန်",
      report: "အကြံပြုချက် report",
      duration: "၁၀–၁၅ မိနစ်",
    },
    howItWorks: {
      title: "အလုပ်လုပ်ပုံ",
      steps: {
        join: {
          title: "စာသင်ခန်းထဲ ဝင်ရန်",
          body: "ဗီဒီယို မလိုအပ်ပါ။ အသံဖြင့် ဆက်လက် လေ့ကျင့်နိုင်ပါသည်။",
        },
        speak: {
          title: "ကျယ်ကျယ် ဖြေရန်",
          body: "Tanaka-sensei ၏ မေးခွန်းများကို ဂျပန်လို ကျယ်ကျယ် ဖြေပါ။",
        },
        report: {
          title: "report ကို ဖတ်ရန်",
          body: "အင်တာဗျူးအပြီးတွင် ဤစာမျက်နှာပေါ်တွင် coaching report ကို ဖတ်ပါ။",
        },
      },
    },
  },
  login: {
    title: "NihonGo သို့ ဝင်ရောက်ရန်",
    body: "ဖိတ်ကြားစာရင်းရှိ အီးမေးလ်ဖြင့် Google ဆိုင်းအင်ဝင်ပါ။",
    google: "Google ဖြင့် ဆက်ရန်",
    close: "ပိတ်ရန်",
    linkSent: "ဤအီးမေးလ် ပါဝင်ခွင့်ရှိပါက ဆိုင်းအင်လင့်ခ် ပို့ပြီးဖြစ်သည်။",
    errorNotInvited: "ဤ Google အကောင့်သည် ဖိတ်ကြားစာရင်းတွင် မရှိပါ။",
  },
  consent: {
    title: "လေ့လာမှု သဘောတူညီချက်",
    body: "ဤလေ့ကျင့် အင်တာဗျူးကို NihonGo အသုံးပြုသူလေ့လာမှုအတွက် သိမ်းနိုင်ပါသည် (သဘောတူညီချက် ဗားရှင်း {version})။ အဖြေနှင့် အမှတ်များကို ပါဝင်သူ id အောက်တွင် သိမ်းပါသည်။ နာမည် မသိမ်းပါ။ ဧည့်သည် စက်ရှင်များ သီးခြားဖြစ်ပြီး လေ့လာမှုထဲ မထည့်ပါ။",
    checkbox:
      "ပါဝင်ရန်နှင့် ဤစက်ရှင်ကို ပါဝင်သူ id အောက်တွင် သိမ်းရန် သဘောတူပါသည်။",
    agree: "သဘောတူပြီး ရှေ့ဆက်ရန်",
    guestInstead: "ဧည့်သည်အဖြစ် စမ်းကြည့်ရန်",
    participantId: "သင့်ပါဝင်သူ id မှာ",
    participantIdNote: "ဤ id ကို အက်ပ်တွင် ပြပါသည်။ အီးမေးလ် မပြပါ။",
    errorSignedOut:
      "သင် ဆိုင်းအင် မဝင်ရသေးပါ။ ပါဝင်သူ ဝင်ရောက်ရန်ကို သုံးပြီးမှ သဘောတူပါ။",
    errorNotInvited: "ဤအီးမေးလ်သည် ဖိတ်ကြားစာရင်းတွင် မရှိပါ။",
    errorSave: "သဘောတူညီချက် မသိမ်းနိုင်ပါ။ ပါဝင်သူ ဝင်ရောက်ရန်ကို ထပ်ကြိုးစားပါ။",
  },
  auth: {
    title: "ပါဝင်သူ ဆိုင်းအင်",
    signingIn: "ဆိုင်းအင် ဝင်နေသည်…",
    missing:
      "ဤလင့်ခ်တွင် ဆိုင်းအင် တိုကင် မပါပါ။ ပါဝင်သူ ဝင်ရောက်ရန်မှ လင့်ခ်အသစ် တောင်းပါ။",
    expired:
      "ဤဆိုင်းအင်လင့်ခ်ကို ဖွင့်ပြီးသား သို့မဟုတ် သက်တမ်းကုန်ပါပြီ။ လင့်ခ်အသစ် တောင်းပြီး တစ်ကြိမ်သာ နှိပ်ပါ။",
    notConfigured: "ဆိုင်းအင် စနစ် မပြင်ဆင်ရသေးပါ။",
    participantLogin: "ပါဝင်သူ ဝင်ရောက်ရန်",
  },
  pitch: {
    chip: "တင်ဆက်မှု demo",
    heading: "Pitch mode",
    body: "မေးခွန်း ၃ ခု၊ လမ်းညွှန် captions နှင့် တိုက်ရိုက် coaching report — CSC 492 တင်ဆက်မှု လမ်းညွှန်။",
    startDemo: "Demo စတင်ရန်",
    footer: "ဤစာမျက်နှာကို အက်ပ်ထဲမှ လင့်ခ်မချိတ်ပါ။ /pitch တွင် တိုက်ရိုက် ဖွင့်ပါ။",
    locked: "ဤ demo ကို သော့ခတ်ထားပါသည်။",
    accessKey: "ဝင်ရောက်ကီး",
    unlock: "ဖွင့်ရန်",
    badKey: "ထိုကီး မမှန်ပါ။",
    lockedFooter: "ဤစာမျက်နှာကို အက်ပ်ထဲမှ လင့်ခ်မချိတ်ပါ။",
  },
  join: {
    joinInterview: "အင်တာဗျူးတက်ရန်",
  },
  joinLink: {
    title: "NihonGo ဝင်ရောက်ရန်",
    body: "ဤစမ်းသပ်သူ၏ လေ့ကျင့်အဖွဲ့သို့ ဝင်ရန် Google ဖြင့် ဆိုင်းအင်ဝင်ပါ။",
    google: "Google ဖြင့် ဆက်ရန်",
    unknown: "ဤဆိုင်းအပ်လင့်ခ်ကို အသုံးပြု၍ မရပါ။",
    full: "ဤဆိုင်းအပ်လင့်ခ် ပြည့်သွားပါပြီ။",
    footer: "ဤစာမျက်နှာကို အက်ပ်ထဲမှ လင့်ခ်မချိတ်ပါ။ စမ်းသပ်သူပို့သော လင့်ခ်ကို သုံးပါ။",
  },
  lobby: {
    readyToJoin: "ဝင်ရန် အဆင်သင့်",
    heading: "Tanaka-sensei နှင့် ဂျပန် အင်တာဗျူး",
    subhead: "ကင်မရာနှင့် မိုက်ခရိုဖုန်း ရွေးပြီး စာသင်ခန်းထဲ ဝင်ပါ။",
    camera: "ကင်မရာ",
    microphone: "မိုက်ခရိုဖုန်း",
    mic: "မိုက်",
    cameraOptional: "ကင်မရာ မလိုအပ်ပါ။ အကြံပြုချက်သည် သင့်အသံပေါ် မူတည်ပါသည်။",
    enterClassroom: "စာသင်ခန်းထဲ ဝင်ရန်",
    cameraReady: "အဆင်သင့်",
    cameraOff: "ပိတ်",
    cameraBlocked: "ပိတ်ထား",
    micReady: "အဆင်သင့်",
    micOff: "ပိတ်",
    micBlocked: "ပိတ်ထား",
  },
  reminder: {
    aria: "အင်တာဗျူး မကြာမီ စပါမည်",
    eyebrow: "Tanaka-sensei နှင့် ဂျပန် အင်တာဗျူး",
    heading: "အင်တာဗျူး မကြာမီ စပါမည်",
    skip: "ကျော်မည်",
  },
  call: {
    guestBanner: "ဧည့်သည် လေ့ကျင့်မှုကို မသိမ်းပါ။ လေ့လာမှုထဲ မပါဝင်ပါ။",
    participant: "ပါဝင်သူ",
    skipInterview: "အင်တာဗျူး ကျော်ရန်",
    questionOf: "မေးခွန်း {n} / {total}",
    senseiSpeaking: "ဆရာမ ပြောနေသည်",
    studentAnswering: "သင့်အလှည့်",
    noAnswerCaptured: "(အဖြေ မရရှိပါ)",
    interviewComplete: "အင်တာဗျူး ပြီးပါပြီ",
    you: "သင်",
    cameraOn: "ကင်မရာ ဖွင့်",
    cameraOff: "ကင်မရာ ပိတ်",
    micOn: "မိုက် ဖွင့်",
    micOff: "မိုက် ပိတ်",
    question: "မေးခွန်း",
    hearAgain: "ထပ်နားထောင်ရန်",
    stopHearing: "ရပ်ရန်",
    speakAnswer: "အသံဖြင့် ဖြေရန်",
    pauseListening: "နားထောင်မှု ခဏရပ်ရန်",
    resumeListening: "ပြန်နားထောင်ရန်",
    liveTranscript: "တိုက်ရိုက် စာသား",
    listening: "နားထောင်နေသည်…",
    paused: "ခဏရပ်ထားသည်",
    submitAnswer: "အဖြေပို့ရန်",
    answerAgain: "ထပ်ဖြေရန်",
    oneRetry: "၁ ကြိမ်",
  },
  report: {
    title: "AI အင်တာဗျူး လေ့ကျင့်မှု အကြံပြုချက်",
    answerQualityTitle: "အင်တာဗျူး အဖြေ အရည်အသွေး",
    disclaimer:
      "NihonGo သည် AI အကူအညီဖြင့် အင်တာဗျူး လေ့ကျင့်ပေးပါသည်။ အတည်ပြုထားသော စာသားမှ အဖြေအရည်အသွေးကို သုံးသပ်ပါသည်။ တရားဝင် ဘာသာစကားအဆင့် သို့မဟုတ် ဝင်ခွင့် ဆုံးဖြတ်ချက် မဟုတ်ပါ။",
    listeningNote:
      "နားထောင်မှု နားလည်မှုကို အမှတ်မပေးပါ — ဤစက်ရှင်တွင် နားထောင်မှု လုပ်ငန်း မရှိပါ။ အဖြေ ကိုက်ညီမှုဆိုသည်မှာ မေးခွန်းနှင့် ကိုက်ညီခြင်းဖြစ်သည်။",
    transcript: "အင်တာဗျူး စာသား",
    helpTheStudy: "လေ့လာမှုကို ကူညီရန်",
    yourAnswer: "သင့်အဖြေ",
    whatWentWell: "ကောင်းခဲ့သည်များ",
    noStrength: "ဤမေးခွန်းအတွက် အားသာချက် မှတ်ချက် မရှိပါ။",
    noExtra: "ဤမေးခွန်းအတွက် ထပ်ဆောင်း ပြင်ဆင်ချက် မရှိပါ။",
    noRewrite: "ဤမေးခွန်းအတွက် ပြင်ဆင်စာကြောင်း မရပါ။",
    evidence: "အထောက်အထား",
    missingElement: "ပျောက်နေသော အချက်",
    questionLabel: "မေးခွန်း",
    deliveryTitle: "အသံ ပေးပို့မှု အချက်များ",
    noAnswerTranscript: "ဤမေးခွန်းအတွက် အဖြေ မရရှိပါ။",
    noAnswerNextHeading: "နောက်လေ့ကျင့်မှုတွင် ဤမေးခွန်းကို ထပ်ကြိုးစားပါ",
    noAnswerNextStep:
      "မိုက်ခရိုဖုန်းကို စစ်ဆေးပြီး နောက်လေ့ကျင့်မှုတွင် ဤမေးခွန်းကို ထပ်ကြိုးစားပါ။",
    improveNext: "နောက်တစ်ကြိမ် တိုးတက်အောင်",
    rewriteHeading: "အကြံပြု ဂျပန်အဖြေ",
    optionalEnhancement: "ထပ်မံ တိုးတက်အောင်",
    makeStronger: "ပိုမို ခိုင်မာအောင်",
    usefulPhrase: "သိမ်းထားသင့်သော စကားစု",
    headline: {
      Ready: "ကောင်းမွန်",
      AlmostReady: "ကောင်း",
      KeepPracticing: "ဆက်လေ့ကျင့်ပါ",
    },
    rating: {
      1: "အများကြီး တိုးတက်ရန်လို",
      2: "တိုးတက်ရန်လို",
      3: "တိုးတက်နေသည်",
      4: "ကောင်း",
      5: "ကောင်းမွန်",
    },
    scores: {
      listening: "အဖြေ ကိုက်ညီမှု",
      grammarPoliteness: "သဒ္ဒါနှင့် သဘာဝကျမှု",
      motivation: "ဂျပန်တွင် သင်ယူလိုသော စိတ်အား",
      studyPlan: "လေ့လာရေး အစီအစဉ် တိကျမှု",
      consistency: "အဖြေများ တစ်သမတ်တည်းဖြစ်မှု",
    },
    radar: {
      listening: "ကိုက်ညီမှု",
      grammarPoliteness: "သဒ္ဒါ",
      motivation: "စိတ်အား",
      studyPlan: "အစီအစဉ်",
      consistency: "တစ်သမတ်တည်း",
    },
    topics: {
      selfIntroduction: "ကိုယ်ရေးမိတ်ဆက်",
      japaneseStudyHistory: "ဂျပန်စာ လေ့လာမှု",
      motivationJapan: "စိတ်အား",
      schoolChoice: "ကျောင်းရွေးချယ်မှု",
      studyPlan: "လေ့လာရေး အစီအစဉ်",
      futurePlan: "အနာဂတ် အစီအစဉ်",
      financialSupport: "ငွေကြေး အထောက်အပံ့",
      educationWork: "ပညာရေးနှင့် အလုပ်",
      japaneseLevel: "ဂျပန်စာ အဆင့်",
      lifeInJapan: "ဂျပန်တွင် နေထိုင်ရေး",
    },
    deliveryHeadline: {
      unavailable: "မသုံးသပ်နိုင်",
      notAssessed: "မသုံးသပ်နိုင်",
      needsPractice: "လေ့ကျင့်ရန်လို",
      clearEnough: "ရှင်းလင်းသည်",
    },
    deliveryNote: {
      unavailable: "သုံးသပ်ရန် ပြောထားသော အဖြေ မရရှိပါ။",
      notAssessed: "အသံ တိတ်လွန်း သို့မဟုတ် တိုလွန်းသဖြင့် အချိန် သုံးသပ်မှု မလုပ်နိုင်ပါ။",
      needsPractice:
        "သင့်အဖြေတွင် ကြာရှည် ခဏရပ်မှုများ ပါသည်။ အခြေခံ အချိန် သုံးသပ်မှုအတွက် အသံ ရှင်းပါသည်။",
      clearEnough:
        "အခြေခံ အချိန် သုံးသပ်မှုအတွက် အသံ ရှင်းပါသည်။ ဂျပန်စာ အဆင့် အမှတ် မဟုတ်ပါ။",
    },
  },
  usefulness: {
    title: "လေ့လာမှုကို ကူညီရန်",
    close: "ပိတ်ရန်",
    submit: "ပို့ရန်",
    comment: "မှတ်ချက်",
  },
  micTrouble: {
    title: "သင့်အသံ မကြားရပါ",
    body: "ဤစက်ရှင်တွင် အဖြေ တစ်ခုမှ မရရှိပါ။ မိုက်ခရိုဖုန်း ချိတ်ထားခြင်း၊ ဘရောက်ဆာ သို့မဟုတ် စနစ်က ပိတ်မထားခြင်းကို စစ်ဆေးပြီး အင်တာဗျူးကို ထပ်ကြိုးစားပါ။",
  },
  cameraMiss: {
    title: "ကင်မရာ မရနိုင်ပါ",
    steps: "အသံဖြင့် ဆက်လက် လေ့ကျင့်နိုင်ပါသည်။ ဤအင်တာဗျူးတွင် ဗီဒီယို မလိုအပ်ပါ။",
    after: "ကြိုတင်ကြည့်လိုလျှင် ကင်မရာကို ထပ်စမ်းပါ။ သို့မဟုတ် စာသင်ခန်းထဲ ဝင်ပါ။",
  },
};

export const UI_COPY: Record<UiLocale, UiCopy> = { en, my };

export function uiCopy(locale: UiLocale): UiCopy {
  return UI_COPY[locale];
}

export function fillTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? ""),
  );
}

const SIGNING_IN = "Signing you in…";
const SIGN_IN_NOT_CONFIGURED = "Sign-in is not configured.";

export function localizeAuthMessage(
  message: string,
  locale: UiLocale,
): string {
  const copy = UI_COPY[locale];
  if (message === copy.login.linkSent || message === UI_COPY.en.login.linkSent) {
    return copy.login.linkSent;
  }
  if (message === copy.auth.expired || message === UI_COPY.en.auth.expired) {
    return copy.auth.expired;
  }
  if (message === copy.auth.missing || message === UI_COPY.en.auth.missing) {
    return copy.auth.missing;
  }
  if (message === SIGNING_IN) return copy.auth.signingIn;
  if (message === SIGN_IN_NOT_CONFIGURED) return copy.auth.notConfigured;
  return message;
}
