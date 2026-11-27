/**
 * Klien & penganalisis lokal untuk "Bit-Cat Mentor" (Socratic Code Debugger di Kodie Lab).
 * Terpisah total dari chatbot CS Kiko (`functions/chat`).
 * Memanggil Edge Function `POST /functions/v1/lab-mentor`, atau jatuh ke `analisisLokalLab`
 * saat `NEXT_PUBLIC_USE_MOCK=true` / jaringan bermasalah.
 */

import { pakaiMock } from "@/lib/api/sumber";

export type ModeLab = "blok" | "turtle" | "web" | "python";
export type TingkatTemuan = "error" | "warn" | "hint";
export type BerkasTemuan = "html" | "css" | "js" | "main.py" | "turtle.py" | "blok";

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
  nama_mentor: "Bit-Cat Mentor";
  status: "ada_temuan" | "kode_rapi" | "ditolak_privasi" | "butuh_coba_dulu";
  level: 1 | 2;
  ringkasan: string;
  temuan: TemuanLab[];
  boleh_level_2: boolean;
  /** Penanda internal bila respons berasal dari pemeriksa lokal/cadangan, bukan Edge Function AI. */
  sumber?: "ai" | "lokal";
}

export interface PermintaanLabMentor {
  mode: ModeLab;
  level: 1 | 2;
  berkas_aktif: BerkasTemuan;
  kode: string | { html: string; css: string; js: string };
  galat: string[];
  tujuan?: string;
}

const PII_REGEX =
  /\b\d{16}\b|(?:^|[\s:,;("'])(?:\+62|62|0)\s*8(?:[\s-]?\d){7,13}\b|\b(?:password|kata\s*sandi|pin|otp)\s*[:=]\s*\S{3,}/i;
const EMAIL_PRIBADI_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const INJECTION_REGEX =
  /ignore\s+(?:all\s+|previous\s+)?instructions?|abaikan\s+(?:semua\s+)?instruksi|reveal\s+your\s+system\s+prompt|<\/?(?:student_code|student_goal|console_errors)>/i;
const CODEGEN_REGEX =
  /(buatkan|bikinin|tolong\s+buat|tulis(?:kan)?\s+ulang|kasih|berikan|generate|write|solve)\s+(?:saya\s+|aku\s+|dong\s+)?(?:semua\s+|seluruh\s+)?(kode|program|script|skrip|jawaban|solusi|html|css|js|python|game|kalkulator|website)/i;

function adaEmailPribadi(teks: string): boolean {
  const matches = teks.match(EMAIL_PRIBADI_REGEX) ?? [];
  return matches.some((m) => {
    const lower = m.toLowerCase();
    return lower !== "bantuan@kodie.id" && !lower.endsWith("@contoh.id") && !lower.endsWith("@example.com");
  });
}

function hitungKurungSeimbang(teks: string, buka: string, tutup: string): boolean {
  let saldo = 0;
  for (const ch of teks) {
    if (ch === buka) saldo += 1;
    else if (ch === tutup) saldo -= 1;
    if (saldo < 0) return false;
  }
  return saldo === 0;
}

function ekstrakBarisDariGalat(teks: string): number | null {
  const m = teks.match(/(?:line|baris)\s*(\d+)/i);
  if (!m?.[1]) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

const TAG_HTML_BERPASANGAN = new Set([
  "main",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "div",
  "section",
  "button",
  "strong",
  "em",
  "a",
  "ul",
  "ol",
  "li",
  "span",
  "header",
  "footer",
  "nav",
]);

function cariTagHtmlTakTertutup(html: string): { baris: number; tag: string } | null {
  let baris = 1;
  let dalamTag: { baris: number; tag: string; kutip: string | null } | null = null;

  for (let i = 0; i < html.length; i += 1) {
    const ch = html[i];
    if (!dalamTag && html.startsWith("<!--", i)) {
      const akhirKomen = html.indexOf("-->", i + 4);
      if (akhirKomen < 0) return null;
      for (let j = i; j < akhirKomen + 3; j += 1) {
        if (html[j] === "\n") baris += 1;
      }
      i = akhirKomen + 2;
      continue;
    }

    if (dalamTag) {
      if (dalamTag.kutip) {
        if (ch === dalamTag.kutip) dalamTag.kutip = null;
      } else if (ch === '"' || ch === "'") {
        dalamTag.kutip = ch;
      } else if (ch === ">") {
        dalamTag = null;
      } else if (ch === "<") {
        return { baris: dalamTag.baris, tag: dalamTag.tag };
      }
    } else if (ch === "<") {
      const sisa = html.slice(i + 1);
      const m = sisa.match(/^\/?([a-zA-Z][a-zA-Z0-9-]*)/);
      if (m?.[1]) {
        dalamTag = { baris, tag: m[1].toLowerCase(), kutip: null };
        i += m[0].length;
      }
    }

    if (ch === "\n") baris += 1;
  }

  return dalamTag ? { baris: dalamTag.baris, tag: dalamTag.tag } : null;
}

function cariTagPasanganHtml(html: string): { baris: number; tag: string; jenis: "belum_tutup" | "tutup_berlebih" } | null {
  const tumpukan: Array<{ tag: string; baris: number }> = [];
  const bersih = html.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
  const regex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:[^>"']|"[^"]*"|'[^']*')*>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(bersih)) !== null) {
    const utuh = match[0];
    const tag = match[1].toLowerCase();
    if (!TAG_HTML_BERPASANGAN.has(tag)) continue;

    const baris = bersih.slice(0, match.index).split("\n").length;
    if (utuh.startsWith("</")) {
      const indeksCocok = tumpukan.map((t) => t.tag).lastIndexOf(tag);
      if (indeksCocok < 0) {
        return { baris, tag, jenis: "tutup_berlebih" };
      }
      if (indeksCocok !== tumpukan.length - 1) {
        const tertinggal = tumpukan[tumpukan.length - 1];
        return { baris: tertinggal.baris, tag: tertinggal.tag, jenis: "belum_tutup" };
      }
      tumpukan.pop();
    } else if (!utuh.endsWith("/>")) {
      tumpukan.push({ tag, baris });
    }
  }

  if (tumpukan.length > 0) {
    const terakhir = tumpukan[tumpukan.length - 1];
    return { baris: terakhir.baris, tag: terakhir.tag, jenis: "belum_tutup" };
  }
  return null;
}

/**
 * Penganalisis heuristik lokal untuk mode mock & cadangan offline.
 * Tetap mengikuti prinsip Socratic: hanya menyebut titik salah + pertanyaan pemandu, tanpa kode solusi.
 */
export function analisisLokalLab(req: PermintaanLabMentor): ResponsLabMentor {
  const tujuan = (req.tujuan ?? "").trim();
  const level = req.level;

  if (PII_REGEX.test(tujuan) || adaEmailPribadi(tujuan)) {
    return {
      nama_mentor: "Bit-Cat Mentor",
      status: "ditolak_privasi",
      level,
      ringkasan:
        "Demi keamanan anak, Bit-Cat menolak pemeriksaan karena ada data pribadi (seperti nomor HP, NIK, email, atau password) di kolom tujuan. Hapus data pribadi itu lalu coba lagi ya!",
      temuan: [],
      boleh_level_2: false,
      sumber: "lokal",
    };
  }

  const kodeGabung =
    typeof req.kode === "string"
      ? req.kode
      : `${req.kode.html}\n${req.kode.css}\n${req.kode.js}`;

  if (INJECTION_REGEX.test(tujuan) || INJECTION_REGEX.test(kodeGabung)) {
    return {
      nama_mentor: "Bit-Cat Mentor",
      status: "butuh_coba_dulu",
      level,
      ringkasan:
        "Meow! Bit-Cat hanya bisa membantu memeriksa kodemu dengan petunjuk belajar, bukan memproses instruksi sistem.",
      temuan: [],
      boleh_level_2: false,
      sumber: "lokal",
    };
  }

  if (CODEGEN_REGEX.test(tujuan)) {
    return {
      nama_mentor: "Bit-Cat Mentor",
      status: "butuh_coba_dulu",
      level,
      ringkasan:
        "Bit-Cat tidak membuatkan kode jadi dari nol supaya kamu terlatih berpikir mandiri! Tulis dulu versi awalmu (atau klik Kembalikan contoh), lalu periksa ulang di sini.",
      temuan: [],
      boleh_level_2: false,
      sumber: "lokal",
    };
  }

  if (kodeGabung.trim().length < 4) {
    return {
      nama_mentor: "Bit-Cat Mentor",
      status: "butuh_coba_dulu",
      level,
      ringkasan:
        req.mode === "blok"
          ? "Papan blokmu masih kosong! Susun beberapa blok di bawah kepala mulai atau klik Kembalikan contoh dulu."
          : "Editormu masih kosong! Tulis beberapa baris kode dulu (atau klik Kembalikan contoh) lalu minta Bit-Cat memeriksa.",
      temuan: [],
      boleh_level_2: false,
      sumber: "lokal",
    };
  }

  const temuan: TemuanLab[] = [];
  const tambah = (item: Omit<TemuanLab, "id">) => {
    temuan.push({ ...item, id: `t-${temuan.length + 1}` });
  };

  if (req.mode === "blok") {
    const teks = typeof req.kode === "string" ? req.kode : "";
    if (!teks.includes("t.")) {
      tambah({
        tingkat: "hint",
        berkas: "blok",
        baris: null,
        judul: "Blok perintah belum tersambung",
        petunjuk:
          level === 1
            ? "Kiko belum punya langkah untuk dijalankan dari susunan blok utama. Cek apakah blok perintah sudah menempel rapat di bawah blok mulai."
            : "Tarik minimal satu blok gerak, putar, atau gambar dari kotak alat ke bawah blok paling atas sampai berbunyi klik tersambung.",
        pertanyaan_pemandu: "Blok aksi pertama apa yang ingin kamu jalankan tepat setelah program dimulai?",
      });
    }
    if (req.galat.length > 0) {
      tambah({
        tingkat: "error",
        berkas: "blok",
        baris: null,
        judul: "Ada masalah saat blok dijalankan",
        petunjuk: `Sistem mencatat pesan: "${req.galat[0]}". Periksa kembali blok yang memakai angka terlalu besar atau susunan ulangan.`,
        pertanyaan_pemandu: "Blok angka atau ulangi mana yang nilainya mungkin melebihi batas wajar?",
      });
    }
  } else if (req.mode === "python" || req.mode === "turtle") {
    const berkas: BerkasTemuan = req.mode === "turtle" ? "turtle.py" : "main.py";
    const sumberKode = typeof req.kode === "string" ? req.kode : "";
    const lines = sumberKode.split("\n");

    for (const g of req.galat) {
      const barisErr = ekstrakBarisDariGalat(g);
      tambah({
        tingkat: "error",
        berkas,
        baris: barisErr ? Math.min(barisErr, lines.length) : 1,
        judul: "Kesalahan saat program dijalankan",
        petunjuk:
          level === 1
            ? `Ada pesan kesalahan di bagian ini: "${g}". Perhatikan baris yang ditunjuk serta satu baris tepat di atasnya.`
            : `Fokus periksa pesan "${g}". Cek ejaan kata kunci, tanda baca akhir baris, atau tipe data nilai yang kamu masukkan.`,
        pertanyaan_pemandu: "Hal apa di baris tersebut yang membuat Python bingung membacanya?",
      });
    }

    lines.forEach((raw, idx) => {
      const kodeBersih = raw.replace(/#.*/, "").trim();
      if (!kodeBersih) return;
      if (/^(for|while|if|elif|else|def)\b/.test(kodeBersih) && !kodeBersih.endsWith(":")) {
        tambah({
          tingkat: "error",
          berkas,
          baris: idx + 1,
          judul: "Tanda akhir header blok hilang",
          petunjuk:
            level === 1
              ? `Perhatikan ujung baris ke-${idx + 1}. Baris pembuka blok Python perlu tanda baca khusus sebelum isi yang menjorok di bawahnya.`
              : `Di baris ke-${idx + 1}, perintah seperti for/if/def selalu ditutup dengan tanda titik dua sebelum baris berikutnya menjorok masuk.`,
          pertanyaan_pemandu: "Tanda baca apa yang wajib diletakkan di akhir baris tersebut dalam Python?",
        });
      }
      if (!hitungKurungSeimbang(kodeBersih, "(", ")")) {
        tambah({
          tingkat: "error",
          berkas,
          baris: idx + 1,
          judul: "Tanda kurung belum berpasangan",
          petunjuk: `Di baris ke-${idx + 1}, jumlah tanda kurung buka dan kurung tutup tidak seimbang.`,
          pertanyaan_pemandu: "Coba hitung ulang pasangan tanda kurung buka dan tutup di baris ini — mana yang masih kurang?",
        });
      }
    });

    if (
      req.mode === "turtle" &&
      /(persegi|kotak|square)/i.test(tujuan) &&
      /range\s*\(\s*3\s*\)/.test(sumberKode)
    ) {
      const idx = lines.findIndex((l) => /range\s*\(\s*3\s*\)/.test(l));
      tambah({
        tingkat: "warn",
        berkas,
        baris: idx >= 0 ? idx + 1 : 1,
        judul: "Jumlah pengulangan kurang untuk persegi",
        petunjuk:
          level === 1
            ? "Perulanganmu baru menggambar sebagian sisi saja. Bandingkan angka pengulangan dengan jumlah sisi bangun datar yang ingin kamu buat."
            : "Bangun persegi memiliki 4 sisi yang sama panjang, sedangkan nilai di dalam perulanganmu masih 3.",
        pertanyaan_pemandu: "Berapa kali perulangan harus berjalan agar keempat sisi persegi bertemu menutup gambar?",
      });
    }
  } else if (req.mode === "web" && typeof req.kode === "object") {
    const { html, css, js } = req.kode;
    for (const g of req.galat) {
      const barisErr = ekstrakBarisDariGalat(g);
      const jsLines = js.split("\n").length;
      tambah({
        tingkat: "error",
        berkas: "js",
        baris: barisErr ? Math.min(barisErr, Math.max(1, jsLines)) : 1,
        judul: "Galat di script.js",
        petunjuk:
          level === 1
            ? `Konsol mencatat kesalahan JavaScript: "${g}". Periksa nama variabel, kurung kurawal, atau tanda kutip di sekitar baris tersebut.`
            : `Periksa pesan "${g}" — pastikan setiap nama fungsi/variabel sudah dideklarasikan dan tanda kurungnya berpasangan.`,
        pertanyaan_pemandu: "Apakah semua nama variabel dan tanda kurung di baris tersebut sudah sesuai?",
      });
    }

    const tagTakTertutup = cariTagHtmlTakTertutup(html);
    if (tagTakTertutup) {
      tambah({
        tingkat: "error",
        berkas: "html",
        baris: tagTakTertutup.baris,
        judul: `Tag pembuka <${tagTakTertutup.tag}> belum ditutup`,
        petunjuk:
          level === 1
            ? `Cek ujung baris ke-${tagTakTertutup.baris} pada index.html. Tag pembuka <${tagTakTertutup.tag}> tampaknya belum punya tanda penutup tag sebelum elemen berikutnya dimulai.`
            : `Di akhir baris ke-${tagTakTertutup.baris}, setiap tag pembuka HTML setelah nama dan atributnya wajib ditutup dengan tanda kurung sudut kanan agar browser tidak mencampurnya dengan baris berikutnya.`,
        pertanyaan_pemandu: `Karakter apa yang tertinggal di ujung baris ke-${tagTakTertutup.baris} untuk menutup pembukaan tag <${tagTakTertutup.tag}>?`,
      });
    } else {
      const tagPasangan = cariTagPasanganHtml(html);
      if (tagPasangan) {
        tambah({
          tingkat: tagPasangan.jenis === "belum_tutup" ? "warn" : "error",
          berkas: "html",
          baris: tagPasangan.baris,
          judul:
            tagPasangan.jenis === "belum_tutup"
              ? `Pasangan penutup <${tagPasangan.tag}> terlewat`
              : `Tag penutup </${tagPasangan.tag}> tidak berpasangan`,
          petunjuk:
            tagPasangan.jenis === "belum_tutup"
              ? level === 1
                ? `Tag pembuka <${tagPasangan.tag}> di baris ke-${tagPasangan.baris} belum menemukan pasangannya sampai akhir elemen induknya.`
                : `Setiap elemen <${tagPasangan.tag}> perlu diakhiri dengan tag penutup bertanda garis miring agar struktur bersarang di index.html tetap rapi.`
              : `Ada tag penutup di baris ke-${tagPasangan.baris} yang tidak cocok dengan tag pembuka aktif sebelumnya.`,
          pertanyaan_pemandu: `Di baris mana elemen <${tagPasangan.tag}> ini seharusnya berakhir?`,
        });
      }
    }

    if (!hitungKurungSeimbang(css, "{", "}")) {
      const cssLines = css.split("\n");
      const openIdx = cssLines.findIndex((l) => l.includes("{"));
      tambah({
        tingkat: "error",
        berkas: "css",
        baris: openIdx >= 0 ? openIdx + 1 : 1,
        judul: "Kurung kurawal CSS tidak seimbang",
        petunjuk: "Ada blok aturan gaya di style.css yang kurung kurawal buka atau tutupnya belum lengkap.",
        pertanyaan_pemandu: "Setiap aturan di style.css harus diapit kurung buka dan tutup — blok mana yang belum tertutup?",
      });
    }

    js.split("\n").forEach((raw, idx) => {
      const bersih = raw.replace(/\/\/.*/, "").trim();
      if (!bersih) return;
      if (!hitungKurungSeimbang(bersih, "(", ")")) {
        tambah({
          tingkat: "error",
          berkas: "js",
          baris: idx + 1,
          judul: "Tanda kurung di script.js belum seimbang",
          petunjuk: `Di baris ke-${idx + 1} script.js, pasangan tanda kurung buka dan tutup belum lengkap.`,
          pertanyaan_pemandu: "Kurung mana pada baris tersebut yang belum mendapat pasangannya?",
        });
      }
    });
    if (!hitungKurungSeimbang(js, "{", "}")) {
      const openJs = js.split("\n").findIndex((l) => l.includes("{"));
      tambah({
        tingkat: "error",
        berkas: "js",
        baris: openJs >= 0 ? openJs + 1 : 1,
        judul: "Kurung kurawal script.js belum lengkap",
        petunjuk: "Ada blok fungsi atau pernyataan di script.js yang kurung kurawal buka dan tutupnya tidak berpasangan.",
        pertanyaan_pemandu: "Blok kode mana di script.js yang masih kekurangan kurung kurawal penutup?",
      });
    }
  }

  const dedup: TemuanLab[] = [];
  const kunci = new Set<string>();
  for (const t of temuan) {
    const k = `${t.berkas}:${t.baris ?? "x"}:${t.judul}`;
    if (kunci.has(k)) continue;
    kunci.add(k);
    dedup.push({ ...t, id: `t-${dedup.length + 1}` });
    if (dedup.length >= 5) break;
  }

  if (dedup.length === 0) {
    return {
      nama_mentor: "Bit-Cat Mentor",
      status: "kode_rapi",
      level,
      ringkasan:
        "Meow! Pemeriksa lokal Bit-Cat tidak melihat kesalahan mencolok pada kodemu. Coba klik Jalankan untuk menguji hasilnya secara langsung!",
      temuan: [],
      boleh_level_2: false,
      sumber: "lokal",
    };
  }

  return {
    nama_mentor: "Bit-Cat Mentor",
    status: "ada_temuan",
    level,
    ringkasan:
      level === 1
        ? `Bit-Cat menemukan ${dedup.length} titik yang perlu kamu cek ulang. Klik temuan untuk menyorot barisnya di editor.`
        : `Ini petunjuk lebih rinci untuk ${dedup.length} temuan tadi. Coba perbaiki langsung di editor lalu klik Jalankan!`,
    temuan: dedup,
    boleh_level_2: level === 1,
    sumber: "lokal",
  };
}

/**
 * Mengirim kode dari Kodie Lab ke Edge Function `lab-mentor` (Agnes AI Socratic Mentor).
 * Tidak memakai tabel atau alur chatbot Kiko. Jatuh ke `analisisLokalLab` bila mode mock aktif atau koneksi gagal.
 */
export async function mintaPetunjukLab(
  req: PermintaanLabMentor,
  signal?: AbortSignal,
): Promise<ResponsLabMentor> {
  const urlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (pakaiMock || !urlBase || !anonKey) {
    return analisisLokalLab(req);
  }

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), 25_000);
  const relayAbort = () => controller.abort();
  signal?.addEventListener("abort", relayAbort, { once: true });

  try {
    const res = await fetch(`${urlBase.replace(/\/+$/, "")}/functions/v1/lab-mentor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }

    const data = (await res.json()) as ResponsLabMentor;
    if (!data || !Array.isArray(data.temuan) || typeof data.ringkasan !== "string") {
      throw new Error("RESPONS_TIDAK_VALID");
    }
    return { ...data, sumber: "ai" };
  } catch (err) {
    if (signal?.aborted) {
      throw err;
    }
    console.warn("[Bit-Cat Mentor] beralih ke pemeriksa lokal:", err instanceof Error ? err.message : "unknown");
    return analisisLokalLab(req);
  } finally {
    clearTimeout(abortTimer);
    signal?.removeEventListener("abort", relayAbort);
  }
}
