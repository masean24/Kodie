import type { HasilTesMinat, JawabanMinat } from "@/types/database";

/**
 * Tamu: jawaban dan hasil hanya disimpan di sessionStorage perangkat ini (hilang saat tab ditutup),
 * tidak dikirim untuk disimpan di server (PRD F4).
 */
const KUNCI_JAWABAN = "kodie:tes-minat:jawaban";
const KUNCI_HASIL = "kodie:tes-minat:hasil";

function baca<T>(kunci: string): T | null {
  try {
    const v = sessionStorage.getItem(kunci);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function tulis(kunci: string, nilai: unknown) {
  try {
    sessionStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    // Penyimpanan diblokir browser: tes tetap jalan, hanya tidak bertahan saat dimuat ulang.
  }
}

export const simpanJawaban = (j: JawabanMinat) => tulis(KUNCI_JAWABAN, j);
export const bacaJawaban = () => baca<JawabanMinat>(KUNCI_JAWABAN);
export const simpanHasil = (h: HasilTesMinat) => tulis(KUNCI_HASIL, h);
export const bacaHasil = () => baca<HasilTesMinat>(KUNCI_HASIL);

export function hapusTes() {
  try {
    sessionStorage.removeItem(KUNCI_JAWABAN);
    sessionStorage.removeItem(KUNCI_HASIL);
  } catch {
    // abaikan
  }
}
