const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

const LOCKED_CONTEXT = "school interview answer";

export async function translateJapanese({
  japanese,
  groqFetch,
  getTranslateKey,
  timeoutMs = 3000,
}: {
  japanese: string;
  groqFetch: typeof fetch;
  getTranslateKey: () => string;
  timeoutMs?: number;
}): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await groqFetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getTranslateKey()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: `Translate this ${LOCKED_CONTEXT} into English. Return English only.\n\n${japanese}`,
          },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const english = data.choices?.[0]?.message?.content?.trim();
    return english || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
