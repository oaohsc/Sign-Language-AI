/**
 * OpenAI-compatible Chat API.
 * Set VITE_OPENAI_API_KEY in .env (or VITE_OPENAI_BASE_URL for a different endpoint).
 */

const OPENAI_BASE = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export function isChatConfigured() {
  return Boolean(API_KEY?.trim());
}

export async function sendChatMessage(messages, options = {}) {
  if (!API_KEY?.trim()) {
    throw new Error('API key not configured. Add VITE_OPENAI_API_KEY to your .env file.');
  }
  const model = options.model || 'gpt-4o-mini';
  const res = await fetch(`${OPENAI_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for a sign language learning app (GestureAI). You help users with sign language (ASL and Arabic ArSL), fingerspelling, and general questions about the app. Be concise and friendly. Support both English and Arabic when relevant.`,
        },
        ...messages,
      ],
      max_tokens: options.max_tokens ?? 512,
      temperature: options.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message || res.statusText || 'Request failed');
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (content == null) throw new Error('Invalid response from API');
  return content;
}
