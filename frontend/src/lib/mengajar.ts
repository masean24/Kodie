import type { Bidang, Jenjang, StatusHonor, StatusSesi } from "@/types/database";

const JAM = 3_600_000;
const MENIT = 60_000;
const HARI = 86_400_000;

/** Kapasitas maksimal kelas per jenjang (PRD F5, F8): 10 SD, 15 SMP dan SMA. */
export function batasKapasitas(jenjang: Jenjang[]): number {
  return jenjang.includes("SD") ? 10 : 15;
}

/** Normalisasi jam "HH:mm" atau "HH:mm:ss" ke "HH:mm:ss". */
export function normalisasiJam(jam: string): string {
  const bagian = jam.trim().split(":");
  const h = (bagian[0] ?? "00").padStart(2, "0");
  const m = (bagian[1] ?? "00").padStart(2, "0");
  const s = (bagian[2] ?? "00").padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * Buat jadwal 4 sesi mingguan (ISO 8601 UTC) dari tanggal & jam mulai WIB (PRD F8).
 * tanggalMulai: "YYYY-MM-DD", jamMulai: "HH:mm" atau "HH:mm:ss".
 */
export function buatJadwal4Sesi(
  tanggalMulai: string,
  jamMulai: string,
  durasiMenit: number,
): { nomor: number; mulai_pada: string; selesai_pada: string }[] {
  const awal = new Date(`${tanggalMulai}T${normalisasiJam(jamMulai)}+07:00`).getTime();
  if (Number.isNaN(awal)) return [];
  return Array.from({ length: 4 }, (_, i) => {
    const mulai = awal + i * 7 * HARI;
    const selesai = mulai + durasiMenit * MENIT;
    return {
      nomor: i + 1,
      mulai_pada: new Date(mulai).toISOString(),
      selesai_pada: new Date(selesai).toISOString(),
    };
  });
}

/** Cek apakah kandidat sesi bertabrakan dengan daftar sesi aktif milik pengajar (PRD F8). */
export function cekBentrokJadwal(
  kandidat: { mulai_pada: string; selesai_pada: string }[],
  sesiAda: { id?: string; mulai_pada: string; selesai_pada: string; status?: StatusSesi }[],
  abaikanSesiId?: string,
): boolean {
  for (const k of kandidat) {
    const m1 = new Date(k.mulai_pada).getTime();
    const s1 = new Date(k.selesai_pada).getTime();
    for (const ada of sesiAda) {
      if (ada.status === "dibatalkan") continue;
      if (abaikanSesiId && ada.id === abaikanSesiId) continue;
      const m2 = new Date(ada.mulai_pada).getTime();
      const s2 = new Date(ada.selesai_pada).getTime();
      if (m1 < s2 && s1 > m2) return true;
    }
  }
  return false;
}

/** Playbook tersedia mulai H-1 (24 jam sebelum sesi dimulai, PRD F9). */
export function bisaBukaPlaybook(mulaiPada: string, sekarang: Date): boolean {
  return sekarang.getTime() >= new Date(mulaiPada).getTime() - 24 * JAM;
}

/** Sesi bisa digeser maksimal 24 jam sebelum sesi dimulai (PRD F8). */
export function bisaGeserSesi(mulaiPada: string, status: StatusSesi, sekarang: Date): boolean {
  if (status !== "terjadwal") return false;
  return new Date(mulaiPada).getTime() - sekarang.getTime() >= 24 * JAM;
}

/** Tombol Masuk kelas aktif 15 menit sebelum mulai sampai selesai (PRD F8 & SERAH-TERIMA-FE.md). */
export function bisaMasukKelas(mulaiPada: string, selesaiPada: string, status: StatusSesi, sekarang: Date): boolean {
  if (status === "dibatalkan") return false;
  const t = sekarang.getTime();
  return t >= new Date(mulaiPada).getTime() - 15 * MENIT && t <= new Date(selesaiPada).getTime();
}

/** Laporan bisa diisi sejak jam mulai sesi (docs/KEPUTUSAN.md). */
export function bisaIsiLaporan(mulaiPada: string, sekarang: Date): boolean {
  return sekarang.getTime() >= new Date(mulaiPada).getTime();
}

/** Laporan terkunci 24 jam setelah dikirim (PRD F10). */
export function laporanTerkunci(dikirimPada: string, sekarang: Date): boolean {
  return sekarang.getTime() - new Date(dikirimPada).getTime() > 24 * JAM;
}

/** Pengingat di dashboard jika laporan belum dikirim >= 2 jam setelah sesi berakhir (PRD F10). */
export function perluPengingatLaporan(
  selesaiPada: string,
  status: StatusSesi,
  adaLaporan: boolean,
  sekarang: Date,
): boolean {
  if (adaLaporan || status === "dibatalkan") return false;
  return sekarang.getTime() - new Date(selesaiPada).getTime() >= 2 * JAM;
}

/** Rapor rekomendasi jurusan wajib diisi pada sesi ke-4 Simulasi Jurusan IT (PRD F11). */
export function perluRaporJurusan(programSlug: string, nomorSesi: number): boolean {
  return programSlug === "simulasi-jurusan-it" && nomorSesi === 4;
}

function tahunBulanWib(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(
    new Date(iso),
  );
}

/** Tanggal besok dalam format YYYY-MM-DD (zona WIB). */
export function tanggalBesokWib(sekarang: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(sekarang.getTime() + HARI));
}

/** Total honor bulan berjalan (WIB) dan total yang belum dibayar (PRD F13). */
export function ringkasHonor(
  daftar: { jumlah: number; status: StatusHonor; waktu: string }[],
  sekarang: Date,
): { bulanIni: number; belumDibayar: number } {
  const bulanAktif = tahunBulanWib(sekarang);
  let bulanIni = 0;
  let belumDibayar = 0;
  for (const h of daftar) {
    if (tahunBulanWib(h.waktu) === bulanAktif) bulanIni += h.jumlah;
    if (h.status === "belum_dibayar") belumDibayar += h.jumlah;
  }
  return { bulanIni, belumDibayar };
}

/** Rentang jam WIB, misalnya "19.00–20.00 WIB". */
export function rentangJamWib(mulaiPada: string, selesaiPada: string): string {
  const fmt = (iso: string) => {
    const parts = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const h = parts.find((p) => p.type === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${h}.${m}`;
  };
  return `${fmt(mulaiPada)}–${fmt(selesaiPada)} WIB`;
}

export const LABEL_STATUS_KERJA = {
  mahasiswa: "Mahasiswa",
  lulusan: "Lulusan",
  pencari_kerja: "Pencari kerja",
} as const;

export const LABEL_STATUS_SESI: Record<StatusSesi, string> = {
  terjadwal: "Terjadwal",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const SKOR_BIDANG_URUT: { key: "skor_software" | "skor_jaringan" | "skor_iot" | "skor_ai_data"; bidang: Bidang }[] = [
  { key: "skor_software", bidang: "software" },
  { key: "skor_jaringan", bidang: "jaringan" },
  { key: "skor_iot", bidang: "iot" },
  { key: "skor_ai_data", bidang: "ai_data" },
];

export interface SegmenAlurPlaybook {
  waktu: string;
  judul: string;
  deskripsi: string;
  utama?: boolean;
}

export interface PlaybookTerurai {
  tujuan: string;
  alur: SegmenAlurPlaybook[];
  tantangan: string;
  kunciJawaban: string;
  persiapan: string[];
  alat: string[];
  catatanKeamanan: string;
  tambahan: { judul: string; baris: string[] }[];
}

function bersihkanBullet(baris: string): string {
  return baris.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
}

function uraiSegmen(baris: string): SegmenAlurPlaybook | null {
  const bersih = bersihkanBullet(baris).replace(/\*\*/g, "").trim();
  if (!bersih) return null;
  // Format: "00–10 · Pembukaan: deskripsi" atau "00-10 | Pembukaan | deskripsi"
  const cocok = bersih.match(/^(\d{2}[–-]\d{2})\s*[·|:-]\s*([^:|]+?)\s*[:|-]\s*(.+)$/);
  if (cocok) {
    const [, waktu, judul, deskripsi] = cocok;
    const utama = /praktik|inti|proyek/i.test(judul);
    return { waktu: waktu.replace("-", "–"), judul: judul.trim(), deskripsi: deskripsi.trim(), utama };
  }
  const cocokTitikDua = bersih.match(/^([^:]+?):\s*(.+)$/);
  if (cocokTitikDua) {
    return { waktu: "Segmen", judul: cocokTitikDua[1].trim(), deskripsi: cocokTitikDua[2].trim() };
  }
  return { waktu: "•", judul: bersih, deskripsi: "" };
}

/** Urai `playbook.konten_md` (PRD F9) menjadi bagian terstruktur untuk tampilan & print. */
export function uraiKontenPlaybook(kontenMd: string): PlaybookTerurai {
  const hasil: PlaybookTerurai = {
    tujuan: "",
    alur: [],
    tantangan: "",
    kunciJawaban: "",
    persiapan: [],
    alat: [],
    catatanKeamanan: "",
    tambahan: [],
  };

  let bagianAktif = "";
  const buffer: Record<string, string[]> = {};
  const tambahanMap = new Map<string, string[]>();

  for (const mentah of kontenMd.split(/\r?\n/)) {
    const baris = mentah.trim();
    const h = baris.match(/^#{1,3}\s+(.+)$/);
    if (h) {
      bagianAktif = h[1].trim();
      continue;
    }
    if (!baris) continue;
    if (!bagianAktif) {
      bagianAktif = "Tujuan sesi";
    }
    const kunci = bagianAktif.toLowerCase();
    if (
      kunci.includes("tujuan") ||
      kunci.includes("alur") ||
      kunci.includes("tantangan") ||
      kunci.includes("kunci") ||
      kunci.includes("persiapan") ||
      kunci.includes("alat") ||
      kunci.includes("starter") ||
      kunci.includes("keamanan")
    ) {
      (buffer[kunci] ??= []).push(baris);
    } else {
      const daftar = tambahanMap.get(bagianAktif) ?? [];
      daftar.push(bersihkanBullet(baris));
      tambahanMap.set(bagianAktif, daftar);
    }
  }

  const ambilKunci = (kata: string) =>
    Object.entries(buffer)
      .filter(([k]) => k.includes(kata))
      .flatMap(([, v]) => v);

  hasil.tujuan = ambilKunci("tujuan").map(bersihkanBullet).join(" ");
  hasil.alur = ambilKunci("alur")
    .map(uraiSegmen)
    .filter((x): x is SegmenAlurPlaybook => Boolean(x));
  hasil.tantangan = ambilKunci("tantangan").map(bersihkanBullet).join(" ");
  hasil.kunciJawaban = ambilKunci("kunci").map(bersihkanBullet).join("\n");
  hasil.persiapan = ambilKunci("persiapan").map(bersihkanBullet).filter(Boolean);
  hasil.alat = [...ambilKunci("alat"), ...ambilKunci("starter")].map(bersihkanBullet).filter(Boolean);
  hasil.catatanKeamanan = ambilKunci("keamanan").map(bersihkanBullet).join(" ");
  hasil.tambahan = [...tambahanMap.entries()].map(([judul, baris]) => ({ judul, baris }));

  return hasil;
}
