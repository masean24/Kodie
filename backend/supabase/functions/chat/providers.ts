// ============================================================================
// Modul LLM Streaming Adapter (OpenAI-Compatible + Auto-Failover) & Gemini Embedding
// ============================================================================

import { l2Normalize } from './guardrails.ts';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProviderConfig {
  name: 'agnes' | 'gemini' | 'groq' | 'exaone';
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Menghasilkan vektor 768 dimensi yang sudah di-L2-normalize dengan gemini-embedding-001.
 */
export async function embedQueryWithGemini(
  text: string,
  geminiApiKey: string,
  signal?: AbortSignal,
): Promise<number[]> {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: {
        parts: [{ text }],
      },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedding gagal (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== 768) {
    throw new Error('Response Gemini embedding tidak mengembalikan 768 dimensi');
  }

  // WAJIB L2 Normalization untuk dimensi < 3072
  return l2Normalize(values);
}

/**
 * Stream dari satu provider OpenAI-compatible dengan first-token timeout (~15 detik).
 * Melempar error hanya jika gagal SEBELUM token pertama keluar, sehingga caller bisa failover.
 */
async function streamSingleProvider(
  provider: LLMProviderConfig,
  messages: ChatMessage[],
  onDelta: (deltaText: string) => void,
  clientSignal?: AbortSignal,
): Promise<void> {
  const controller = new AbortController();
  let firstTokenReceived = false;

  const firstTokenTimer = setTimeout(() => {
    if (!firstTokenReceived) {
      controller.abort(new Error(`FIRST_TOKEN_TIMEOUT_${provider.name}`));
    }
  }, 15000);

  const onClientAbort = () => controller.abort(new Error('CLIENT_ABORTED'));
  if (clientSignal) {
    if (clientSignal.aborted) {
      clearTimeout(firstTokenTimer);
      throw new Error('CLIENT_ABORTED');
    }
    clientSignal.addEventListener('abort', onClientAbort, { once: true });
  }

  try {
    const payload: Record<string, unknown> = {
      model: provider.model,
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 2048,
    };

    // Aturan khusus model Gemini 3.8 Flash & EXAONE
    if (
      provider.model.includes('gemini-3.8') ||
      provider.name === 'exaone' ||
      provider.model.includes('exaone')
    ) {
      payload.reasoning_effort = 'low';
      payload.max_tokens = 2048;
    }

    const endpoint = `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      const errBody = await res.text().catch(() => '');
      throw new Error(
        `UPSTREAM_${provider.name.toUpperCase()}_${res.status}: ${errBody.slice(0, 200)}`,
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) continue;

        const dataStr = line.slice(5).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed?.choices?.[0]?.delta;
          // PENTING: Hanya teruskan delta.content, buang delta.reasoning_content
          const contentPiece = typeof delta?.content === 'string' ? delta.content : '';
          if (contentPiece.length > 0) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              clearTimeout(firstTokenTimer);
            }
            onDelta(contentPiece);
          }
        } catch {
          // Abaikan baris komentar SSE non-JSON
        }
      }
    }

    if (!firstTokenReceived) {
      throw new Error(`EMPTY_STREAM_${provider.name}`);
    }
  } catch (err) {
    clearTimeout(firstTokenTimer);
    // Tandai apakah error terjadi sesudah token pertama keluar (dilarang failover di tengah stream!)
    const wrapped = err instanceof Error ? err : new Error(String(err));
    (wrapped as Error & { afterFirstToken?: boolean }).afterFirstToken = firstTokenReceived;
    throw wrapped;
  } finally {
    clearTimeout(firstTokenTimer);
    if (clientSignal) {
      clientSignal.removeEventListener('abort', onClientAbort);
    }
  }
}

/**
 * Menjalankan streaming dengan Auto-Failover berurutan (Primary -> Fallback).
 * Failover hanya terjadi jika provider gagal SEBELUM token konten pertama terkirim.
 */
export async function streamWithFailover(
  providers: LLMProviderConfig[],
  messages: ChatMessage[],
  onDelta: (deltaText: string) => void,
  clientSignal?: AbortSignal,
): Promise<{ usedProvider: string }> {
  const activeProviders = providers.filter((p) => Boolean(p.apiKey && p.apiKey.trim() !== ''));
  if (activeProviders.length === 0) {
    throw new Error('NO_LLM_PROVIDER_KEY_CONFIGURED');
  }

  let lastError: Error | null = null;

  for (const provider of activeProviders) {
    try {
      await streamSingleProvider(provider, messages, onDelta, clientSignal);
      return { usedProvider: provider.name };
    } catch (err) {
      const typedErr = err as Error & { afterFirstToken?: boolean };
      if (typedErr.message === 'CLIENT_ABORTED' || clientSignal?.aborted) {
        throw typedErr;
      }
      // Jangan pernah failover di tengah stream setelah >= 1 token terkirim ke user!
      if (typedErr.afterFirstToken) {
        throw typedErr;
      }
      console.warn(
        `[chat] Provider ${provider.name} (${provider.model}) gagal sebelum token pertama, mencoba fallback:`,
        typedErr.message,
      );
      lastError = typedErr;
    }
  }

  throw lastError ?? new Error('ALL_LLM_PROVIDERS_FAILED');
}
