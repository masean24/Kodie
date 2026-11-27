// ============================================================================
// Guardrails, Parser JSON & Anti-Spoiler untuk Edge Function `lab-mentor`
// "Bit-Cat Mentor" — Socratic Code Debugger di Kodie Lab (tanpa jawaban jadi).
// ============================================================================

export type ModeLab = 'blok' | 'turtle' | 'web' | 'python';
export type TingkatTemuan = 'error' | 'warn' | 'hint';
export type BerkasTemuan = 'html' | 'css' | 'js' | 'main.py' | 'turtle.py' | 'blok';

export interface TemuanLab {
  id: string;
  tingkat: TingkatTemuan;
  berkas: BerkasTemuan;
  baris: number | null;
  judul: string;
  petunjuk: string;
  pertanyaan_pemandu: string;
}

export interface ResponsLabMentor {
  nama_mentor: 'Bit-Cat Mentor';
  status: 'ada_temuan' | 'kode_rapi' | 'ditolak_privasi' | 'butuh_coba_dulu';
  level: 1 | 2;
  ringkasan: string;
  temuan: TemuanLab[];
  boleh_level_2: boolean;
}

/** Normalisasi NFKC + hapus zero-width, BOM, bidi, & karakter kontrol sambil mempertahankan newline/tab. */
export function sanitizeMultilineText(raw: string, maxLen = 8000): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFKC')
    .replace(/[\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .slice(0, maxLen);
}

/** Normalisasi input satu baris (tujuan siswa, pesan galat konsol). */
export function sanitizeSingleLine(raw: string, maxLen = 240): string {
  return sanitizeMultilineText(raw, maxLen * 2)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

const PII_MASK = '[DATA PRIBADI DISENSOR]';
const NIK_REGEX = /\b\d{16}\b/g;
const PHONE_REGEX = /(?:^|(?<=[\s:,;("']))(?:\+62|62|0)\s*8(?:[\s-]?\d){7,13}\b/g;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PASSWORD_ASSIGN_REGEX =
  /\b(?:password|kata\s*sandi|passcode|pin|otp|kode\s*verifikasi)\s*(?:(?:saya|aku|ku)\s*)?[:=]\s*\S{3,}/gi;
const PASSWORD_PHRASE_REGEX =
  /\b(?:password|kata\s*sandi|passcode)\s+(?:(?:saya|aku|ku|anak)\s+)?(?:adalah|yaitu)\s+\S{3,}/gi;
const PIN_OTP_REGEX =
  /\b(?:pin|otp|kode\s*verifikasi)\s+(?:(?:saya|aku|ku)\s+)?(?:(?:adalah|yaitu)\s+)?\d{4,8}\b/gi;
const ADDRESS_REGEX =
  /\b(?:alamat(?:\s+rumah)?(?:\s+(?:saya|aku|ku))?\s*(?::|adalah|di)\s+|(?:jl\.|jalan)\s+)[a-z0-9\s.,/-]{4,}(?:no\.?\s*\d+|rt\.?\s*\d+|rw\.?\s*\d+)/gi;

export function detectAndRedactPii(cleanText: string): {
  hasPii: boolean;
  redactedText: string;
} {
  if (!cleanText) {
    return { hasPii: false, redactedText: '' };
  }

  let hasPii = false;
  let redacted = cleanText;

  const sub = (re: RegExp, fn?: (m: string) => string) => {
    redacted = redacted.replace(re, (m) => {
      if (fn) {
        const res = fn(m);
        if (res !== m) hasPii = true;
        return res;
      }
      hasPii = true;
      return PII_MASK;
    });
  };

  sub(NIK_REGEX);
  sub(PHONE_REGEX);
  sub(EMAIL_REGEX, (m) => {
    const lower = m.toLowerCase();
    if (lower === 'bantuan@kodie.id' || lower.endsWith('@example.com') || lower.endsWith('@contoh.id')) {
      return m;
    }
    return PII_MASK;
  });
  for (const re of [PASSWORD_ASSIGN_REGEX, PASSWORD_PHRASE_REGEX, PIN_OTP_REGEX]) {
    sub(re);
  }
  sub(ADDRESS_REGEX);

  return { hasPii, redactedText: redacted };
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+)?(previous|prior|above|system)\s+(instructions?|prompts?|rules?)/i,
  /abaikan\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|prompt)\s*(sebelumnya|di\s*atas|sistem)?/i,
  /lupakan\s+(semua\s+)?(instruksi|aturan|peran)\s*(sebelumnya|awal|sistem)?/i,
  /(reveal|show|print|dump|repeat|output|tampilkan|bocorkan|tuliskan)\s+(your\s+|the\s+)?(system\s*prompt|hidden\s*prompt|instruksi\s*sistem|aturan\s*rahasia)/i,
  /\b(jailbreak|developer\s*mode|god\s*mode|unrestricted\s*mode)\b/i,
  /(pretend|act\s+as|berpura-pura|pura-pura\s+jadi)\s+(you\s+are\s+)?(admin|root|superuser|developer|system)/i,
  /(<\|system\|>|<\|im_start\|>|<\|endoftext\|>|\[INST\]|\[\/INST\]|###\s*SYSTEM:|###\s*INSTRUCTION:)/i,
  /<\/?(student_code|student_goal|console_errors|lab_mode|system_instructions)>/i,
];

export function detectPromptInjection(cleanText: string): boolean {
  if (!cleanText) return false;
  return INJECTION_PATTERNS.some((re) => re.test(cleanText));
}

const CODEGEN_PATTERNS: RegExp[] = [
  /(buatkan|bikinin|tolong\s+buat|tulis(?:kan)?\s+ulang|kasih|berikan|generate|write|solve)\s+(?:saya\s+|aku\s+|dong\s+)?(?:semua\s+|seluruh\s+)?(kode|program|script|skrip|jawaban|solusi|html|css|js|python|game|kalkulator|website).{0,30}(lengkap|jadi|full|benar|otomatis|dari\s+nol)?/i,
  /\b(buatkan|bikinin)\s+(?:kode|program|script|aplikasi|game|kalkulator|web)\b/i,
  /\b(jawaban\s+lengkap|kode\s+jadi|kirim\s+kode\s+benar|kasih\s+kode\s+full|solve\s+this\s+for\s+me|full\s+solution|just\s+give\s+me\s+the\s+code|fix\s+the\s+whole\s+code)\b/i,
];

/** Deteksi permintaan agar AI menuliskan kode solusi lengkap atau mengerjakan tugas dari nol. */
export function detectCodeGenRequest(tujuan: string): boolean {
  if (!tujuan) return false;
  return CODEGEN_PATTERNS.some((re) => re.test(tujuan));
}

export function escapePromptData(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const VENDOR_LEAK_REGEX =
  /\b(agnes(\s*ai)?|agnes-[0-9.]+-flash|gemini(\s*[0-9.]+)?(\s*flash|\s*pro)?|google\s+deepmind|openai|chatgpt|gpt-[345][a-z0-9.-]*|claude(\s*[0-9.]+)?|anthropic|llama[-\s]*[0-9.]+|groq|exaone|k-exaone)\b/gi;

/**
 * Hapus bocoran jawaban kode penuh (fenced code block ```...``` maupun potongan sintaks solusi panjang
 * di dalam backtick) dan cegah kebocoran nama model/vendor AI atau skema URI berbahaya.
 */
export function stripSolutionSpoilers(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/```[\s\S]*?```/g, '[coba perbaiki sendiri di bagian tersebut]')
    .replace(/`([^`]+)`/g, (full, inner: string) => {
      const t = inner.trim();
      const looksLikeStatement =
        t.length > 28 ||
        t.includes('\n') ||
        t.includes(';') ||
        /^[a-zA-Z_]\w*\s*=\s*[^=]/.test(t) ||
        /\b(for|while|if|elif|def|function|const|let|var)\b.+[:{(]/.test(t);
      return looksLikeStatement ? '[coba perbaiki sendiri di bagian tersebut]' : full;
    })
    .replace(VENDOR_LEAK_REGEX, 'Bit-Cat Mentor')
    .replace(/<\/?(student_code|student_goal|console_errors|lab_mode|system_instructions)>/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tambahkan nomor baris 1-based (`1 | ...`) supaya LLM merujuk baris secara akurat. */
export function numberCodeLines(code: string): string {
  const lines = code.split('\n');
  return lines.map((line, i) => `${i + 1} | ${line}`).join('\n');
}

const URUTAN_TINGKAT: Record<TingkatTemuan, number> = {
  error: 0,
  warn: 1,
  hint: 2,
};

function defaultBerkasUntukMode(mode: ModeLab, berkasAktif?: BerkasTemuan): BerkasTemuan {
  if (mode === 'python') return 'main.py';
  if (mode === 'turtle') return 'turtle.py';
  if (mode === 'blok') return 'blok';
  if (berkasAktif === 'html' || berkasAktif === 'css' || berkasAktif === 'js') return berkasAktif;
  return 'js';
}

function sanitasiBerkas(raw: unknown, mode: ModeLab, fallback: BerkasTemuan): BerkasTemuan {
  const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (mode === 'web') {
    if (v === 'html' || v === 'index.html') return 'html';
    if (v === 'css' || v === 'style.css') return 'css';
    if (v === 'js' || v === 'script.js') return 'js';
    return fallback;
  }
  return defaultBerkasUntukMode(mode, fallback);
}

/**
 * Parsing JSON hasil LLM + validasi struktur + clamping nomor baris + penyaringan anti-spoiler.
 * Mengembalikan `null` bila teks LLM tidak mengandung JSON yang dapat dibaca.
 */
export function parseAndSanitizeMentorResponse(
  rawText: string,
  opts: {
    mode: ModeLab;
    level: 1 | 2;
    berkasAktif: BerkasTemuan;
    lineCounts: Partial<Record<BerkasTemuan, number>>;
  },
): ResponsLabMentor | null {
  if (typeof rawText !== 'string' || !rawText.trim()) return null;

  let cleaned = rawText.trim();
  // Hanya buang pembungkus fence terluar agar backtick di dalam string JSON tidak terpotong di tengah.
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }

  const fallbackFile = defaultBerkasUntukMode(opts.mode, opts.berkasAktif);
  const rawItems = Array.isArray(parsed.temuan) ? parsed.temuan : [];
  const temuan: TemuanLab[] = [];

  for (let i = 0; i < rawItems.length && temuan.length < 5; i++) {
    const item = rawItems[i];
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;

    const rawTingkat = typeof rec.tingkat === 'string' ? rec.tingkat.trim().toLowerCase() : '';
    const tingkat: TingkatTemuan =
      rawTingkat === 'error' || rawTingkat === 'warn' || rawTingkat === 'hint' ? rawTingkat : 'hint';

    const berkas = sanitasiBerkas(rec.berkas, opts.mode, fallbackFile);
    const maxLine = Math.max(1, opts.lineCounts[berkas] ?? 1);

    let baris: number | null = null;
    if (opts.mode !== 'blok' && typeof rec.baris === 'number' && Number.isFinite(rec.baris)) {
      const rounded = Math.round(rec.baris);
      if (rounded >= 1) {
        baris = Math.min(rounded, maxLine);
      }
    }

    const judul = stripSolutionSpoilers(typeof rec.judul === 'string' ? rec.judul : '').slice(0, 110);
    const petunjuk = stripSolutionSpoilers(typeof rec.petunjuk === 'string' ? rec.petunjuk : '').slice(0, 360);
    const pertanyaan_pemandu = stripSolutionSpoilers(
      typeof rec.pertanyaan_pemandu === 'string' ? rec.pertanyaan_pemandu : '',
    ).slice(0, 220);

    if (!judul || !petunjuk) continue;

    temuan.push({
      id: `t-${i + 1}`,
      tingkat,
      berkas,
      baris,
      judul,
      petunjuk,
      pertanyaan_pemandu:
        pertanyaan_pemandu || 'Bagian mana di baris tersebut yang bisa kamu periksa ulang langkah demi langkah?',
    });
  }

  temuan.sort((a, b) => {
    const diff = URUTAN_TINGKAT[a.tingkat] - URUTAN_TINGKAT[b.tingkat];
    if (diff !== 0) return diff;
    return (a.baris ?? 99_999) - (b.baris ?? 99_999);
  });

  const normalizedTemuan = temuan.map((item, idx) => ({ ...item, id: `t-${idx + 1}` }));
  const status =
    parsed.status === 'kode_rapi' && normalizedTemuan.length === 0
      ? 'kode_rapi'
      : normalizedTemuan.length > 0
        ? 'ada_temuan'
        : 'kode_rapi';

  const rawRingkasan = stripSolutionSpoilers(typeof parsed.ringkasan === 'string' ? parsed.ringkasan : '');
  const ringkasan =
    rawRingkasan ||
    (status === 'kode_rapi'
      ? 'Meow! Kode kamu sudah tampak rapi dan tidak ada kesalahan mencolok. Coba jalankan atau uji dengan skenario lain ya!'
      : 'Meow! Bit-Cat menemukan beberapa titik yang perlu kamu cek ulang. Klik temuan untuk menyorot barisnya di editor.');

  return {
    nama_mentor: 'Bit-Cat Mentor',
    status,
    level: opts.level,
    ringkasan: ringkasan.slice(0, 260),
    temuan: normalizedTemuan,
    boleh_level_2: opts.level === 1 && normalizedTemuan.length > 0,
  };
}
