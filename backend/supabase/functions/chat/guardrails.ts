// ============================================================================
// Modul Guardrails, L2 Normalization, Fast-Path & Citation Verifier
// Dipakai bersama oleh Edge Function `chat` dan unit test backend.
// ============================================================================

export interface CitationSource {
  index: number;
  title: string;
  url: string;
  headingPath?: string;
}

/**
 * Wajib L2 Normalization untuk vektor MRL Gemini Embedding (768 dimensi).
 */
export function l2Normalize(vec: number[]): number[] {
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error('Vektor embedding kosong atau tidak valid');
  }
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    const v = Number(vec[i]);
    if (!Number.isFinite(v)) {
      throw new Error(`Komponen vektor tidak valid pada indeks ${i}`);
    }
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) {
    return vec.map(() => 0);
  }
  return vec.map((v) => v / norm);
}

/**
 * Layer 2A: Normalisasi NFKC & hapus karakter kontrol / zero-width / bidi.
 */
export function sanitizeUserInput(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    // Zero-width, BOM, & directional formatting characters
    .replace(/[\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '')
    // ASCII control chars kecuali newline (\n) dan tab (\t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above|system)\s+(instructions?|prompts?|rules?)/i,
  /abaikan\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|prompt)\s*(sebelumnya|di\s*atas|sistem)?/i,
  /lupakan\s+(semua\s+)?(instruksi|aturan|peran)\s*(sebelumnya|awal|sistem)?/i,
  /(reveal|show|print|dump|repeat|output|tampilkan|bocorkan|tuliskan)\s+(your\s+|the\s+)?(system\s*prompt|hidden\s*prompt|instruksi\s*sistem|aturan\s*rahasia)/i,
  /\b(jailbreak|dan\s*mode|developer\s*mode|god\s*mode|unrestricted\s*mode)\b/i,
  /(pretend|act\s+as|berpura-pura|pura-pura\s+jadi)\s+(you\s+are\s+)?(admin|root|superuser|developer|system)/i,
  /(<\|system\|>|<\|im_start\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|###\s*SYSTEM:|###\s*INSTRUCTION:)/i,
  /<\/?(knowledge_context|active_page_context|user_data_context|catalog_context|system_instructions|user_question)>/i,
];

/**
 * Layer 2B: Deteksi deterministik Prompt Injection & Role Spoofing (ID & EN).
 */
export function detectPromptInjection(cleanText: string): boolean {
  if (!cleanText) return false;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleanText)) {
      return true;
    }
  }
  return false;
}

/**
 * Layer 2C: Fast-Path Deterministik (tanpa memanggil LLM & tanpa membocorkan vendor AI).
 */
export function matchDeterministicFastPath(
  cleanText: string,
  botName = 'Kiko',
): string | null {
  const lower = cleanText.toLowerCase().replace(/[?!.,]+$/g, '').trim();

  // 1. Sapaan singkat
  if (
    /^(halo+|hai+|hi+|hello+|hey+|pagi|selamat\s+pagi|siang|selamat\s+siang|sore|selamat\s+sore|malam|selamat\s+malam|assalamu'?alaikum|permisi|p|tes|test)$/i.test(
      lower,
    )
  ) {
    return `Hai! Aku **${botName}**, asisten resmi **Kodie**. Ada yang ingin kamu tanyakan seputar program kelas teknologi (SD, SMP, SMA), Tes Minat Jurusan IT, cara pembayaran, atau jadwal belajarmu?`;
  }

  // 2. Ucapan terima kasih
  if (
    /^(terima\s+kasih(\s+banyak)?|makasih(\s+ya|\s+banyak)?|thanks(\s+a\s+lot)?|thank\s+you|thx|mantap\s+makasih|oke\s+makasih)$/i.test(
      lower,
    )
  ) {
    return `Sama-sama! Senang bisa membantu. Kalau masih ada hal lain seputar kelas atau fitur di Kodie yang ingin ditanyakan, langsung tulis saja ya!`;
  }

  // 3. Pertanyaan identitas / model AI
  if (
    /\b(kamu\s+siapa|siapa\s+kamu|siapa\s+namamu|nama\s+kamu\s+siapa|who\s+are\s+you)\b/i.test(
      lower,
    ) ||
    /\b(pakai\s+(model|ai|llm)\s+apa|model\s+ai\s+apa|kamu\s+model\s+apa|what\s+(ai|model|llm)\s+are\s+you|apakah\s+kamu\s+(chatgpt|gpt|gemini|claude|agnes|llama|groq))\b/i.test(
      lower,
    )
  ) {
    return `Aku **${botName}**, asisten virtual resmi dari **Kodie** yang siap membantu siswa, orang tua, dan pengajar menemukan informasi program bimbel teknologi, tes minat jurusan IT, serta jadwal kelas.`;
  }

  return null;
}

/**
 * Layer 4A: Sanitasi teks tidak tepercaya agar tidak dapat menutup tag XML pembatas prompt.
 */
export function escapePromptData(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const VENDOR_LEAK_REGEX =
  /\b(agnes(\s*ai)?|agnes-[0-9.]+-flash|gemini(\s*[0-9.]+)?(\s*flash|\s*pro)?|google\s+deepmind|openai|chatgpt|gpt-[345][a-z0-9.-]*|claude(\s*[0-9.]+)?|anthropic|llama[-\s]*[0-9.]+|groq|exaone|k-exaone)\b/gi;

/**
 * Layer 4B: Post-Generation Output Guard (menyensor kebocoran nama vendor AI / system prompt / skema URL berbahaya).
 */
export function sanitizeAssistantOutput(
  output: string,
  botName = 'Kiko',
): string {
  if (typeof output !== 'string') return '';
  return output
    .replace(VENDOR_LEAK_REGEX, `asisten resmi Kodie (${botName})`)
    .replace(
      /<\/?(knowledge_context|active_page_context|user_data_context|catalog_context|system_instructions|user_question)>/gi,
      '',
    )
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
}

/**
 * Layer 4C: Verifikasi sitasi inline [1], [2] terhadap daftar sumber retrieval yang sah.
 */
export function extractVerifiedCitations(
  output: string,
  availableSources: CitationSource[],
): CitationSource[] {
  if (!output || !Array.isArray(availableSources) || availableSources.length === 0) {
    return [];
  }
  const foundIndices = new Set<number>();
  const regex = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(output)) !== null) {
    const idx = Number.parseInt(match[1], 10);
    if (Number.isFinite(idx) && idx >= 1 && idx <= availableSources.length) {
      foundIndices.add(idx);
    }
  }
  return availableSources.filter((s) => foundIndices.has(s.index));
}

/**
 * SSRF Guard: Memastikan URL eksternal bukan IP privat, loopback, atau metadata cloud.
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '::1' ||
      host === '[::1]' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    // Cek IPv4 privat / loopback / link-local
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 127 ||
        a === 10 ||
        a === 0 ||
        (a === 169 && b === 254) ||
        (a === 192 && b === 168) ||
        (a === 172 && b >= 16 && b <= 31)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}
