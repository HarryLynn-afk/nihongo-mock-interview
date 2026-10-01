# Notes — Question bank, later

**Status:** Later — not this week. Do not `/build-plan` until testers have run.  
**Date:** 2026-09-08  
**Terms:** Use `docs/ubiquitous-language.md`. **Question bank** is practice only. **Pitch mode** stays the 3 locked Questions in `lib/content/questions.ts`. Do not merge the bank into `pitchAnswers.ts`.

---

## Already done (2026-09-08)

- Practice still draws **one Question per topic** (10 core + 0–3 follow-ups).
- Question 163 is **Future plan**, not Study plan.
- Missing application wordings added on existing topics: school/course interest, gap after graduation, sponsor’s reason, how tuition and living costs are prepared.
- Generic follow-up 「もう少し詳しく教えてください。」 removed; every core topic has a specific follow-up.
- No N5 / JLPT / A1 labels in bank copy.

---

## Later (after first testers)

1. **More variants (5–8) per high-traffic topic** so repeat sessions do not reuse the same Japanese after three Interviews: Japanese study history, Motivation, School choice, Study plan, Future plan, Financial support. Leave Self-introduction / Japanese level / Life in Japan until those run out.
2. **Previous Japan history** as a Life-in-Japan (or Education & work) variant: 「以前、日本に行ったことがありますか。」 — real applications often ask entry history. Not a new 11th core topic.
3. **Japanese-study proof** as a Japanese-study-history variant: where / how long they studied. Ask about a language test without exam-brand names.
4. **Native Burmese review** of all new bank + follow-up `burmeseTranslation` strings (same pass as the locked 3 Questions).
5. **Shorter practice path** only if testers say 10 core Questions is too long. Do not add topics to make the session longer.
6. **Per-Participant seen-ids in Supabase** (not only `sessionStorage`) so invited testers avoid exact question ids across visits. Guest still stays browser-only and is not merged into the study.

---

## Do not do later unless product says so

- Public signup or merging Guest sessions into research N.
- N5 / JLPT / Pass / Fail in HUD, bank, or report copy.
- One Groq follow-up chooser (`GROQ_FOLLOWUP_API_KEY`) until local follow-ups are clearly not enough.
- Pre-rendering 40+ TTS clips until live ElevenLabs on bank ids is too slow in a real session.
