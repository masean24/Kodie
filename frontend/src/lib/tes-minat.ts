import type { Bidang, Jenjang, JawabanMinat, KodeOpsi, SkorBidang } from "@/types/database";

/** Urutan prioritas saat seri (PRD F4). */
export const URUTAN_BIDANG: Bidang[] = ["software", "jaringan", "iot", "ai_data"];

export const NAMA_BIDANG: Record<Bidang, string> = {
  software: "Software",
  jaringan: "Jaringan",
  iot: "IoT",
  ai_data: "AI & Data",
};

/** PRD F4: contoh jurusan kuliah per bidang tertinggi. */
export const JURUSAN_PER_BIDANG: Record<Bidang, string[]> = {
  software: ["Informatika", "Rekayasa Perangkat Lunak", "Sistem Informasi"],
  jaringan: ["Teknik Komputer", "Keamanan Siber"],
  iot: ["Teknik Komputer", "Teknik Elektro"],
  ai_data: ["Informatika", "Sains Data"],
};

export type BobotOpsi = Partial<Record<Bidang, number>>;
export type SoalDenganBobot = {
  urutan: number;
  opsi: { kode: KodeOpsi; bobot: BobotOpsi }[];
};

const nol = (): SkorBidang => ({ software: 0, jaringan: 0, iot: 0, ai_data: 0 });

/** Jumlah skor mentah per bidang dari jawaban. */
export function hitungSkorMentah(soal: SoalDenganBobot[], jawaban: JawabanMinat): SkorBidang {
  const skor = nol();
  for (const s of soal) {
    const kode = jawaban[String(s.urutan)];
    const opsi = s.opsi.find((o) => o.kode === kode);
    if (!opsi) continue;
    for (const b of URUTAN_BIDANG) skor[b] += opsi.bobot[b] ?? 0;
  }
  return skor;
}

/**
 * Persentase per bidang: ROUND(skor bidang ÷ jumlah skor keempat bidang × 100)
 * (docs/KEPUTUSAN.md, sama dengan RPC hitung_tes_minat). Jumlahnya bisa 99–101 karena pembulatan.
 */
export function hitungPersentase(mentah: SkorBidang): SkorBidang {
  const total = URUTAN_BIDANG.reduce((n, b) => n + mentah[b], 0);
  const hasil = nol();
  if (total === 0) return hasil;
  for (const b of URUTAN_BIDANG) hasil[b] = Math.round((mentah[b] / total) * 100);
  return hasil;
}

/** Bidang dengan skor mentah tertinggi; seri dipecah Software > Jaringan > IoT > AI & Data. */
export function bidangTeratas(mentah: SkorBidang): Bidang {
  let terbaik: Bidang = URUTAN_BIDANG[0];
  for (const b of URUTAN_BIDANG) if (mentah[b] > mentah[terbaik]) terbaik = b;
  return terbaik;
}

/** PRD F4: program yang disarankan per jenjang dan kelas (slug). */
export function rekomendasiProgram(jenjang: Jenjang, kelas: number): string[] {
  if (jenjang === "TK" || (jenjang === "SD" && kelas <= 1)) return ["kenal-komputer"];
  if (jenjang === "SD") return ["coding-dasar"];
  if (jenjang === "SMP" && kelas <= 8) return ["kelas-reguler-teknologi"];
  return ["simulasi-jurusan-it", "kelas-reguler-teknologi"];
}

/** Tabel rekomendasi umum untuk tamu yang jenjangnya tidak diketahui. */
export const REKOMENDASI_UMUM: { untuk: string; program: string[] }[] = [
  { untuk: "SD", program: ["coding-dasar"] },
  { untuk: "SMP kelas 7–8", program: ["kelas-reguler-teknologi"] },
  { untuk: "SMP kelas 9 dan SMA", program: ["simulasi-jurusan-it", "kelas-reguler-teknologi"] },
];

export function semuaTerjawab(jumlahSoal: number, jawaban: JawabanMinat): boolean {
  for (let i = 1; i <= jumlahSoal; i++) if (!jawaban[String(i)]) return false;
  return true;
}
