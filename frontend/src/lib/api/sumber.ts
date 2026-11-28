/**
 * true = data mock, false = Supabase sungguhan.
 * Diatur lewat NEXT_PUBLIC_USE_MOCK; fail-safe ke Supabase bila URL Supabase sudah dikonfigurasi,
 * dan tetap jatuh ke mock saat lokal/CI build tanpa .env.local.
 */
export const pakaiMock =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  (process.env.NEXT_PUBLIC_USE_MOCK !== "false" && !process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Fitur saran pembimbing (2026-11-28) yang butuh tabel/kolom/RPC baru di backend: trial class, kode referral,
 * bagi hasil 30%, jenjang TK, pengalaman & sertifikat pengajar. Selalu aktif di mode mock; di Supabase baru
 * aktif setelah tim backend menerapkan spesifikasi di docs/KEPUTUSAN.md dan menyetel
 * NEXT_PUBLIC_FITUR_LANJUTAN=true, supaya produksi tidak memanggil RPC yang belum ada.
 */
export const fiturLanjutan = pakaiMock || process.env.NEXT_PUBLIC_FITUR_LANJUTAN === "true";

/** Ubah error Supabase menjadi Error berisi kode, supaya bisa dipetakan lib/errors.ts. */
export function lemparJikaError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}
