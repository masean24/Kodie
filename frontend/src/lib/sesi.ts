import type { KategoriMasalah, Notifikasi, PrioritasMasalah } from "@/types/database";

const JAM = 3_600_000;

export const LABEL_KATEGORI_MASALAH: Record<KategoriMasalah, string> = {
  perilaku_tidak_pantas: "Perilaku tidak pantas",
  pengajar_tidak_hadir: "Pengajar tidak hadir",
  masalah_teknis: "Masalah teknis",
  lainnya: "Lainnya",
};

/** Prioritas otomatis tinggi untuk kategori perilaku tidak pantas (PRD F12). */
export function prioritasMasalah(kategori: KategoriMasalah): PrioritasMasalah {
  return kategori === "perilaku_tidak_pantas" ? "tinggi" : "normal";
}

/** Rating satu kali per sesi per siswa, hanya setelah laporan sesi dikirim (PRD F12). */
export function bisaBeriRating(adaLaporan: boolean, sudahRating: boolean): boolean {
  return adaLaporan && !sudahRating;
}

/** Rata-rata rating pengajar hanya tampil setelah minimal 3 rating (PRD F12). */
export function hitungRataRating(bintangDaftar: number[]): { jumlah: number; rataRata: number | null } {
  const jumlah = bintangDaftar.length;
  if (jumlah < 3) return { jumlah, rataRata: null };
  const total = bintangDaftar.reduce((n, b) => n + b, 0);
  return { jumlah, rataRata: Math.round((total / jumlah) * 10) / 10 };
}

/** Penanda "Baru" pada laporan yang dikirim dalam 48 jam terakhir. */
export function apakahLaporanBaru(dikirimPada: string, sekarang: Date): boolean {
  const selisih = sekarang.getTime() - new Date(dikirimPada).getTime();
  return selisih >= 0 && selisih <= 48 * JAM;
}

/** Jumlah notifikasi yang belum dibaca. */
export function jumlahBelumDibaca(daftar: Pick<Notifikasi, "dibaca_pada">[]): number {
  return daftar.filter((n) => !n.dibaca_pada).length;
}

/** Konversi skor pengajar (1–5) ke skala 0–100 untuk tampilan perbandingan berdampingan (PRD F11). */
export function skorPengajarKePersen(skor: number): number {
  const terjepit = Math.max(0, Math.min(5, skor));
  return Math.round((terjepit / 5) * 100);
}
