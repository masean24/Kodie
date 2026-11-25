import type { Database } from "@/types/database";

export type StatusPercakapanChat = Database["public"]["Enums"]["status_percakapan_chat"];
export type PengirimPesanChat = Database["public"]["Enums"]["pengirim_pesan_chat"];
export type PercakapanChat = Database["public"]["Tables"]["percakapan_chat"]["Row"];

export interface SitasiChatbot {
  index: number;
  title: string;
  url: string;
  headingPath?: string;
}

export type PesanChat = Omit<Database["public"]["Tables"]["pesan_chat"]["Row"], "sitasi"> & {
  sitasi: SitasiChatbot[];
};

export interface KonfigurasiChatbot {
  chatbot_aktif: boolean;
  chatbot_nama: string;
  chatbot_sapaan: string;
  chatbot_kontak_wa: string;
  chatbot_kontak_email: string;
}

export interface HandoffChatbot {
  waUrl: string;
  email: string;
  canLiveTakeover: boolean;
  percakapanId?: string | null;
  percakapanStatus?: StatusPercakapanChat | null;
}

export const KONFIGURASI_CHATBOT_DEFAULT: KonfigurasiChatbot = {
  chatbot_aktif: true,
  chatbot_nama: "Kiko",
  chatbot_sapaan:
    "Hai! Aku Kiko, asisten resmi Kodie. Ada yang ingin kamu tanyakan seputar program kelas, tes minat jurusan IT, atau jadwal belajarmu?",
  chatbot_kontak_wa: "6281100000001",
  chatbot_kontak_email: "bantuan@kodie.id",
};

/** Sanitasi URL sitasi/tautan dari respons AI agar aman terhadap XSS (`javascript:`, `data:`). */
export function sanitasiUrlAman(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    if (parsed.protocol === "mailto:") {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

/** Bangun tautan WhatsApp aman dari nomor konfigurasi admin (`628...`). */
export function buatUrlWhatsApp(kontakWa: string, pesan?: string): string {
  const digits = kontakWa.replace(/[^0-9]/g, "") || KONFIGURASI_CHATBOT_DEFAULT.chatbot_kontak_wa;
  const teks = pesan ? `?text=${encodeURIComponent(pesan)}` : "";
  return `https://wa.me/${digits}${teks}`;
}

/** Nama blok konteks prompt di Edge Function `chat` yang tidak boleh tampil ke pengguna. */
const POLA_TAG_KONTEKS =
  /[ \t]*[<[][ \t]*\/?[ \t]*(?:knowledge_context|active_page_context|user_data_context|catalog_context|system_instructions|user_question)[ \t]*[>\]]/gi;

/**
 * Hapus penanda konteks internal (`[active_page_context]`, `</knowledge_context>`, dst.) yang kadang ikut
 * ditulis model ke jawaban, beserta spasi tepat sebelumnya. Teks lain (termasuk indentasi kode) tidak diubah.
 */
export function bersihkanTeksKiko(teks: string): string {
  return teks.replace(POLA_TAG_KONTEKS, "");
}

/** Judul sitasi tampil sebagai teks biasa: tanda backtick Markdown (mis. "(`/karier`)") dibuang. */
function bersihkanJudulSitasi(judul: string): string {
  return bersihkanTeksKiko(judul).replace(/`/g, "").trim();
}

/** Normalisasi kolom `sitasi` jsonb dari database menjadi array terstruktur. */
export function parseSitasi(raw: unknown): SitasiChatbot[] {
  if (!Array.isArray(raw)) return [];
  const hasil: SitasiChatbot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const idx = typeof obj.index === "number" ? obj.index : hasil.length + 1;
    const title = (typeof obj.title === "string" && bersihkanJudulSitasi(obj.title)) || `Sumber ${idx}`;
    const urlAman = typeof obj.url === "string" ? sanitasiUrlAman(obj.url) : null;
    if (!urlAman) continue;
    hasil.push({
      index: idx,
      title,
      url: urlAman,
      headingPath: typeof obj.headingPath === "string" ? obj.headingPath : undefined,
    });
  }
  return hasil;
}

const PRIORITAS_STATUS_CHAT: Record<StatusPercakapanChat, number> = {
  menunggu_admin: 0,
  ditangani_admin: 1,
  bot: 2,
  selesai: 3,
};

/** Urutkan antrean live chat admin: menunggu_admin paling atas, lalu ditangani_admin, bot, selesai. */
export function urutkanPercakapanAdmin<T extends { status: StatusPercakapanChat; diperbarui_pada: string }>(
  daftar: T[],
): T[] {
  return [...daftar].sort((a, b) => {
    const pa = PRIORITAS_STATUS_CHAT[a.status] ?? 9;
    const pb = PRIORITAS_STATUS_CHAT[b.status] ?? 9;
    if (pa !== pb) return pa - pb;
    return Date.parse(b.diperbarui_pada) - Date.parse(a.diperbarui_pada);
  });
}

export const LABEL_STATUS_CHAT: Record<StatusPercakapanChat, string> = {
  bot: "Ditangani Kiko",
  menunggu_admin: "Menunggu admin",
  ditangani_admin: "Ditangani admin",
  selesai: "Selesai",
};
