/**
 * DeepSeek grade fallback — optional. Absence means Groq miss → null report
 * (no boot failure), so we do NOT `requireEnv` this one.
 */
const DEEPSEEK_GRADE_API_KEY = process.env.DEEPSEEK_GRADE_API_KEY?.trim();

export function getDeepseekGradeKey(): string | null {
  return DEEPSEEK_GRADE_API_KEY ? DEEPSEEK_GRADE_API_KEY : null;
}
