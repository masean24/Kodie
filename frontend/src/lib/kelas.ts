import type { Jenjang, KelasKatalog } from "@/types/database";

export type RentangJam = "pagi" | "siang" | "malam";

export const RENTANG_JAM: Record<RentangJam, { label: string; dari: number; sampai: number }> = {
  pagi: { label: "Pagi (sebelum 12.00)", dari: 0, sampai: 12 },
  siang: { label: "Siang–sore (12.00–17.59)", dari: 12, sampai: 18 },
  malam: { label: "Malam (18.00 ke atas)", dari: 18, sampai: 24 },
};

export interface FilterKelas {
  /** Kata kunci bebas: nama program, nama pengajar, atau jenjang. */
  cari?: string;
  program?: string;
  jenjang?: Jenjang;
  hari?: number;
  jam?: RentangJam;
  /** Mode trial (`?trial=1`): hanya kelas yang masih bisa dipesan sebelum Sesi 1, tautan membawa pilihan trial. */
  trial?: boolean;
}

/** Saring dengan kata kunci (tidak peka huruf besar/kecil) pada program, pengajar, level, dan jenjang. */
export function saringCari(daftar: KelasKatalog[], cari?: string): KelasKatalog[] {
  const kata = cari?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  if (kata.length === 0) return daftar;
  return daftar.filter((k) => {
    const teks = `${k.program_nama} level ${k.level} ${k.pengajar_nama} ${k.jenjang.join(" ")}`.toLowerCase();
    return kata.every((w) => teks.includes(w));
  });
}

export function saringKelas(daftar: KelasKatalog[], f: FilterKelas): KelasKatalog[] {
  return daftar.filter((k) => {
    if (k.status === "disembunyikan") return false;
    if (f.program && k.program_slug !== f.program) return false;
    if (f.jenjang && !k.jenjang.includes(f.jenjang)) return false;
    if (f.hari && k.hari_mingguan !== f.hari) return false;
    if (f.jam) {
      const jam = Number(k.jam_mulai.split(":")[0]);
      const r = RENTANG_JAM[f.jam];
      if (jam < r.dari || jam >= r.sampai) return false;
    }
    return true;
  });
}

/** Urutan katalog: yang bisa dipesan dulu, lalu menurut tanggal mulai. */
export function urutkanKelas(daftar: KelasKatalog[]): KelasKatalog[] {
  return [...daftar].sort(
    (a, b) => Number(b.bisa_dibooking) - Number(a.bisa_dibooking) || a.mulai_pada.localeCompare(b.mulai_pada),
  );
}

/** Perkiraan tanggal semua sesi: seminggu sekali sejak sesi 1 (PRD F5, F8). */
export function jadwalSesi(mulaiPada: string, jumlahSesi: number): string[] {
  const awal = new Date(mulaiPada).getTime();
  return Array.from({ length: jumlahSesi }, (_, i) => new Date(awal + i * 7 * 86_400_000).toISOString());
}

/** Alasan kelas tidak bisa dipesan, untuk label di kartu. */
export function alasanTidakBisaDipesan(k: KelasKatalog): string | null {
  if (k.bisa_dibooking) return null;
  if (k.sisa_kursi <= 0) return "Kelas penuh";
  return "Pendaftaran ditutup";
}
