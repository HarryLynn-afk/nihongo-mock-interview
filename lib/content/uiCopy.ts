import type { UiLocale } from "./locale";

const en = {
  start: {
    headline: "Practice your Japanese language-school interview",
    subhead:
      "Answer mock interview questions in Japanese and receive AI feedback.",
    tryAsGuest: "Try a short practice",
    practiceOnly:
      "Practice and coaching only—not an admission, visa, or COE assessment.",
    participantLogin: "Participant login",
    guestCaption: "Three questions. Guest practice isn't saved.",
    computerOnly: "Open on a computer to join the interview.",
    howItWorks: {
      title: "How it works",
      steps: {
        join: {
          title: "Set up your practice",
          body: "Camera optional. Microphone required.",
        },
        speak: {
          title: "Answer in Japanese",
          body: "Respond aloud in Japanese.",
        },
        report: {
          title: "Review your coaching report",
          body: "Get feedback on relevance, grammar and politeness, motivation, study plan, and consistency.",
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
    requestInvite: "Request an invite",
  },
  account: {
    eyebrow: "Your space",
    profile: "Profile",
    back: "Back to interview",
    title: "Your interview starts here",
    intro: "Check your Google account, then continue to the classroom.",
    label: "Tester account",
    signedInWith: "Signed in with Google",
    signOut: "Sign out",
    signOutError: "Could not sign out. Please try again.",
  },
  consent: {
    title: "Study consent",
    body:
      "This practice Interview can be saved for the NihonGo user study (consent version {version}). Answers and scores are stored under a participant id, not your name. Guest sessions stay separate and are not added to the study.",
    checkbox:
      "I agree to take part and to save this session under a participant id.",
    agree: "Agree and continue",
    participantId: "Your participant id is",
    participantIdNote: "The classroom and report show this id instead of your email.",
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
  join: {
    joinInterview: "Join Interview",
  },
  joinLink: {
    explanation: "Sign in with Google for the full interview. Guest practice is shorter and isn't saved.",
    title: "Join NihonGo",
    google: "Continue with Google",
    login: "Login",
    unknown: "This sign-up link isn't available.",
    full: "This sign-up link is full.",
    footer: "This page is not linked from the app. Use the link your tester sent.",
  },
  lobby: {
    readyToJoin: "Ready to join",
    close: "Close",
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
    cancel: "Cancel",
  },
  call: {
    participant: "Participant",
    skipInterview: "Skip interview",
    endInterview: "End interview",
    endConfirmBody:
      "End this interview? This session won't be saved and you won't get a report.",
    keepGoing: "Keep going",
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
    practiceAgain: "Practice again",
    backToHome: "Back to home",
    yourAnswer: "Your answer",
    whatWentWell: "What you did well",
    noStrength: "No strength note for this Question.",
    noExtra: "No extra correction for this Question.",
    noRewrite: "No rewrite was returned for this Question.",
    evidence: "Evidence",
    missingElement: "Missing element",
    questionLabel: "Question",
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
  },
  fullSessionRequest: {
    formTitle: "Ask for the full Interview",
    formBody:
      "Leave the Google email you want to use. You will get an email once it is added.",
    emailLabel: "Email",
    send: "Send",
    close: "Close",
    savedTitle: "You will get an email",
    savedBody:
      "Once this address is added, you will get an email. You can keep practicing as a guest.",
    saveError:
      "That email could not be saved. You can still continue as a guest.",
    invalidEmail: "Enter a valid email address.",
    reportButton: "Request the full interview",
  },
  usefulness: {
    title: "Help the study",
    close: "Close",
    submit: "Submit",
  },
  micTrouble: {
    title: "We couldn't hear you",
    body: "None of your answers were captured this session. Check that your microphone is connected and not muted by your browser or operating system, then try the interview again.",
  },
  scoringUnavailable: {
    title: "Scoring unavailable",
    body: "We couldn't build your coaching report this time. Your answers were saved for this session, but feedback is temporarily unavailable. Please try the interview again later.",
  },
  cameraMiss: {
    title: "Camera isn't available",
    steps: "You can continue with voice. This Interview does not need video.",
    after: "Try Camera again if you want a preview, or enter the classroom.",
  },
} as const;

type WidenStrings<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: WidenStrings<T[K]> }
    : T;

export type UiCopy = WidenStrings<typeof en>;

const my: UiCopy = {
  start: {
    headline: "ဂျပန်ဘာသာစကားကျောင်း အင်တာဗျူးကို လေ့ကျင့်ပါ",
    subhead:
      "ဂျပန်လို အတုအယောင် အင်တာဗျူးမေးခွန်းများကို ဖြေဆိုပြီး AI အကြံပြုချက် ရယူပါ။",
    tryAsGuest: "လေ့ကျင့်မှု တိုတိုကို စမ်းကြည့်ရန်",
    practiceOnly:
      "လေ့ကျင့်မှုနှင့် coaching အတွက်သာဖြစ်သည် — ဝင်ခွင့်၊ ဗီဇာ သို့မဟုတ် COE ဆုံးဖြတ်ချက် မဟုတ်ပါ။",
    participantLogin: "ပါဝင်သူ ဝင်ရောက်ရန်",
    guestCaption: "မေးခွန်း ၃ ခု။ ဧည့်သည် လေ့ကျင့်မှုကို သိမ်းမထားပါ။",
    computerOnly: "အင်တာဗျူးတက်ရန် ကွန်ပျူတာပေါ်တွင် ဖွင့်ပါ။",
    howItWorks: {
      title: "အလုပ်လုပ်ပုံ",
      steps: {
        join: {
          title: "သင့်လေ့ကျင့်မှုကို ပြင်ဆင်ပါ",
          body: "ကင်မရာ မလိုအပ်ပါ။ မိုက်ခရိုဖုန်း လိုအပ်ပါသည်။",
        },
        speak: {
          title: "ဂျပန်လို ဖြေဆိုပါ",
          body: "ဂျပန်လို ကျယ်ကျယ် ဖြေပါ။",
        },
        report: {
          title: "သင့် coaching report ကို ပြန်ကြည့်ပါ",
          body: "ကိုက်ညီမှု၊ သဒ္ဒါနှင့် ယဉ်ကျေးမှု၊ စိတ်အား၊ လေ့လာရေး အစီအစဉ်နှင့် တစ်သမတ်တည်းဖြစ်မှုတို့အတွက် အကြံပြုချက် ရယူပါ။",
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
    requestInvite: "ဖိတ်ကြားရန် တောင်းဆိုပါ",
  },
  account: {
    eyebrow: "သင့်နေရာ",
    profile: "ပရိုဖိုင်",
    back: "အင်တာဗျူးသို့ ပြန်သွားရန်",
    title: "သင့်အင်တာဗျူးကို ဤနေရာမှ စတင်ပါ",
    intro: "Google အကောင့်ကို စစ်ဆေးပြီး စာသင်ခန်းသို့ ဆက်ပါ။",
    label: "စမ်းသပ်သူ အကောင့်",
    signedInWith: "Google ဖြင့် ဝင်ရောက်ထားသည်",
    signOut: "ထွက်ရန်",
    signOutError: "ထွက်မရပါ။ ထပ်ကြိုးစားပါ။",
  },
  consent: {
    title: "လေ့လာမှု သဘောတူညီချက်",
    body: "ဤလေ့ကျင့် အင်တာဗျူးကို NihonGo အသုံးပြုသူလေ့လာမှုအတွက် သိမ်းနိုင်ပါသည် (သဘောတူညီချက် ဗားရှင်း {version})။ အဖြေနှင့် အမှတ်များကို ပါဝင်သူ id အောက်တွင် သိမ်းပါသည်။ နာမည် မသိမ်းပါ။ ဧည့်သည် စက်ရှင်များ သီးခြားဖြစ်ပြီး လေ့လာမှုထဲ မထည့်ပါ။",
    checkbox:
      "ပါဝင်ရန်နှင့် ဤစက်ရှင်ကို ပါဝင်သူ id အောက်တွင် သိမ်းရန် သဘောတူပါသည်။",
    agree: "သဘောတူပြီး ရှေ့ဆက်ရန်",
    participantId: "သင့်ပါဝင်သူ id မှာ",
    participantIdNote: "စာသင်ခန်းနှင့် report တွင် အီးမေးလ်အစား ဤ id ကို ပြပါသည်။",
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
  join: {
    joinInterview: "အင်တာဗျူးတွင် ပါဝင်ရန်",
  },
  joinLink: {
    explanation: "အင်တာဗျူးအပြည့်အစုံအတွက် Google ဖြင့် ဝင်ရောက်ပါ။ ဧည့်သည် လေ့ကျင့်မှုမှာ ပိုတိုပြီး သိမ်းဆည်းမည် မဟုတ်ပါ။",
    title: "NihonGo ဝင်ရောက်ရန်",
    google: "Google ဖြင့် ဆက်ရန်",
    login: "ဝင်ရောက်ရန်",
    unknown: "ဤဆိုင်းအပ်လင့်ခ်ကို အသုံးပြု၍ မရပါ။",
    full: "ဤဆိုင်းအပ်လင့်ခ် ပြည့်သွားပါပြီ။",
    footer: "ဤစာမျက်နှာကို အက်ပ်ထဲမှ လင့်ခ်မချိတ်ပါ။ စမ်းသပ်သူပို့သော လင့်ခ်ကို သုံးပါ။",
  },
  lobby: {
    readyToJoin: "ဝင်ရန် အဆင်သင့်",
    close: "ပိတ်ရန်",
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
    cancel: "မလုပ်တော့ပါ",
  },
  call: {
    participant: "ပါဝင်သူ",
    skipInterview: "အင်တာဗျူး ကျော်ရန်",
    endInterview: "အင်တာဗျူး ပြီးဆုံးရန်",
    endConfirmBody:
      "ဤအင်တာဗျူးကို ပြီးဆုံးမလား။ ဤစက်ရှင်ကို သိမ်းမည် မဟုတ်ပါ၊ အစီရင်ခံစာ မရပါ။",
    keepGoing: "ဆက်လုပ်ရန်",
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
    practiceAgain: "ထပ်မံ လေ့ကျင့်ရန်",
    backToHome: "ပင်မစာမျက်နှာသို့",
    yourAnswer: "သင့်အဖြေ",
    whatWentWell: "ကောင်းခဲ့သည်များ",
    noStrength: "ဤမေးခွန်းအတွက် အားသာချက် မှတ်ချက် မရှိပါ။",
    noExtra: "ဤမေးခွန်းအတွက် ထပ်ဆောင်း ပြင်ဆင်ချက် မရှိပါ။",
    noRewrite: "ဤမေးခွန်းအတွက် ပြင်ဆင်စာကြောင်း မရပါ။",
    evidence: "အထောက်အထား",
    missingElement: "ပျောက်နေသော အချက်",
    questionLabel: "မေးခွန်း",
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
  },
  fullSessionRequest: {
    formTitle: "အင်တာဗျူးအပြည့်အစုံ တောင်းရန်",
    formBody:
      "သုံးလိုသော Google အီးမေးလ်ကို ထားခဲ့ပါ။ ထည့်သွင်းပြီးမှ အီးမေးလ် ရရှိပါမည်။",
    emailLabel: "အီးမေးလ်",
    send: "ပို့ရန်",
    close: "ပိတ်ရန်",
    savedTitle: "အီးမေးလ် ရရှိပါမည်",
    savedBody:
      "ဤလိပ်စာကို ထည့်သွင်းပြီးမှ အီးမေးလ် ရရှိပါမည်။ ဧည့်သည်အဖြစ် ဆက်လက် လေ့ကျင့်နိုင်ပါသည်။",
    saveError:
      "ဤအီးမေးလ်ကို မသိမ်းနိုင်ပါ။ ဧည့်သည်အဖြစ် ဆက်လက် လေ့ကျင့်နိုင်ပါသည်။",
    invalidEmail: "မှန်ကန်သော အီးမေးလ် ထည့်ပါ။",
    reportButton: "အင်တာဗျူးအပြည့်အစုံ တောင်းရန်",
  },
  usefulness: {
    title: "လေ့လာမှုကို ကူညီရန်",
    close: "ပိတ်ရန်",
    submit: "ပို့ရန်",
  },
  micTrouble: {
    title: "သင့်အသံ မကြားရပါ",
    body: "ဤစက်ရှင်တွင် အဖြေ တစ်ခုမှ မရရှိပါ။ မိုက်ခရိုဖုန်း ချိတ်ထားခြင်း၊ ဘရောက်ဆာ သို့မဟုတ် စနစ်က ပိတ်မထားခြင်းကို စစ်ဆေးပြီး အင်တာဗျူးကို ထပ်ကြိုးစားပါ။",
  },
  scoringUnavailable: {
    title: "အမှတ်ပေး၍ မရပါ",
    body: "ယခုအချိန်တွင် coaching report တည်ဆောက်၍ မရပါ။ ဤစက်ရှင်အတွက် အဖြေများ ရှိသော်လည်း အကြံပြုချက် ယာယီ မရနိုင်ပါ။ နောက်မှ အင်တာဗျူးကို ထပ်ကြိုးစားပါ။",
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
