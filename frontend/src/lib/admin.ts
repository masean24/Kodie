import type { LaporanMasalah, ProfilPengajar } from "@/types/database";

export type UrutanAntrean = "terlama" | "terbaru";

/**
 * Tombol Setujui pengajar hanya aktif jika KTP/KTM dan SKCK sudah diunggah,
 * wawancara sudah dicentang, dan minimal 1 program disetujui (PRD F7).
 */
export function bolehSetujuiPengajar(
  profil: Pick<ProfilPengajar, "identitas_path" | "skck_path" | "wawancara_selesai"> | null,
  jumlahProgramDipilih: number,
): boolean {
  if (!profil) return false;
  return Boolean(profil.identitas_path && profil.skck_path && profil.wawancara_selesai && jumlahProgramDipilih > 0);
}

/** Urutkan daftar berdasarkan waktu: "terlama" (paling lama menunggu dulu, PRD F14) atau "terbaru". */
export function urutkanAntreanWaktu<T>(
  daftar: T[],
  ambilWaktu: (item: T) => string,
  urutan: UrutanAntrean = "terlama",
): T[] {
  return [...daftar].sort((a, b) => {
    const wa = ambilWaktu(a);
    const wb = ambilWaktu(b);
    return urutan === "terlama" ? wa.localeCompare(wb) : wb.localeCompare(wa);
  });
}

/**
 * Laporan kategori `perilaku_tidak_pantas` (prioritas tinggi) selalu tampil paling atas (PRD F12),
 * lalu diurutkan menurut waktu menunggu.
 */
export function urutkanLaporanMasalah<
  T extends Pick<LaporanMasalah, "kategori" | "prioritas" | "dibuat_pada">,
>(daftar: T[], urutan: UrutanAntrean = "terlama"): T[] {
  return [...daftar].sort((a, b) => {
    const pa = a.kategori === "perilaku_tidak_pantas" || a.prioritas === "tinggi" ? 0 : 1;
    const pb = b.kategori === "perilaku_tidak_pantas" || b.prioritas === "tinggi" ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return urutan === "terlama"
      ? a.dibuat_pada.localeCompare(b.dibuat_pada)
      : b.dibuat_pada.localeCompare(a.dibuat_pada);
  });
}

/** Teks lama menunggu untuk baris antrean admin (Figma 11: "Menunggu 3 jam", "Menunggu 40 menit"). */
export function formatLamaMenunggu(iso: string, sekarang: Date): string {
  const selisihMenit = Math.max(1, Math.floor((sekarang.getTime() - new Date(iso).getTime()) / 60_000));
  if (selisihMenit < 60) return `Menunggu ${selisihMenit} menit`;
  const selisihJam = Math.floor(selisihMenit / 60);
  if (selisihJam < 24) return `Menunggu ${selisihJam} jam`;
  const selisihHari = Math.floor(selisihJam / 24);
  return `Menunggu ${selisihHari} hari`;
}

export const LABEL_STATUS_PEMBAYARAN = {
  menunggu: "Menunggu verifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
} as const;

export const LABEL_STATUS_MASALAH = {
  baru: "Baru",
  ditinjau: "Ditinjau",
  selesai: "Selesai",
} as const;
