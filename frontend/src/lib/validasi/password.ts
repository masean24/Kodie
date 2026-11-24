/**
 * Aturan password saat mendaftar: minimal 8 karakter dan tidak mudah ditebak.
 * Dipakai skema zod (browser + Server Function) dan indikator kekuatan di formulir daftar.
 */

export const PANJANG_MINIMAL_PASSWORD = 8;

/** Password yang paling sering dipakai/ditebak (huruf kecil). */
const UMUM = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "katasandi",
  "rahasia",
  "rahasia123",
  "qwerty",
  "qwertyui",
  "qwerty123",
  "asdfghjk",
  "zxcvbnm",
  "iloveyou",
  "admin123",
  "welcome1",
  "bismillah",
  "indonesia",
  "kodie123",
  "abc12345",
  "abcd1234",
  "1q2w3e4r",
  "11223344",
  "sayang123",
  "letmein1",
]);

/** `true` bila password berupa urutan naik/turun, misalnya 12345678, abcdefgh, 87654321. */
function berurutan(p: string) {
  const s = p.toLowerCase();
  if (s.length < 4) return false;
  let naik = true;
  let turun = true;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    if (d !== 1) naik = false;
    if (d !== -1) turun = false;
  }
  return naik || turun;
}

/** Alasan password mudah ditebak, atau null bila cukup aman. */
export function alasanMudahDitebak(password: string): string | null {
  const p = password.trim();
  const kecil = p.toLowerCase();
  if (UMUM.has(kecil)) return "Password ini sangat umum dan mudah ditebak.";
  if (/^(.)\1+$/.test(p)) return "Jangan memakai satu karakter yang diulang-ulang.";
  if (berurutan(p)) return "Jangan memakai urutan seperti 12345678 atau abcdefgh.";
  if (/^\d+$/.test(p)) return "Jangan hanya angka, misalnya tanggal lahir. Tambahkan huruf.";
  if (/^(.{1,4})\1+$/.test(p)) return "Jangan mengulang pola pendek, misalnya abcabcabc.";
  return null;
}

export type TingkatPassword = "kosong" | "pendek" | "lemah" | "sedang" | "kuat";

/** Tingkat kekuatan untuk indikator di formulir, beserta pesan singkat (label tingkat ditampilkan terpisah). */
export function nilaiPassword(password: string): { tingkat: TingkatPassword; pesan: string } {
  if (!password) return { tingkat: "kosong", pesan: `Minimal ${PANJANG_MINIMAL_PASSWORD} karakter.` };
  if (password.length < PANJANG_MINIMAL_PASSWORD) {
    const kurang = PANJANG_MINIMAL_PASSWORD - password.length;
    return { tingkat: "pendek", pesan: `Tambah ${kurang} karakter lagi (minimal ${PANJANG_MINIMAL_PASSWORD}).` };
  }
  const alasan = alasanMudahDitebak(password);
  if (alasan) return { tingkat: "lemah", pesan: alasan };
  let skor = 0;
  if (password.length >= 12) skor++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) skor++;
  if (/\d/.test(password)) skor++;
  if (/[^A-Za-z0-9]/.test(password)) skor++;
  if (skor >= 3) return { tingkat: "kuat", pesan: "Password ini sulit ditebak." };
  return { tingkat: "sedang", pesan: "Tambah huruf besar, angka, atau simbol agar lebih kuat." };
}
