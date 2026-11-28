import type { Bidang, Jenjang } from "@/types/database";

/**
 * Jalur belajar berkelanjutan Kodie (saran pembimbing 2026-11-28, docs/KEPUTUSAN.md).
 *
 * Setiap paket = 4 sesi ≈ 1 bulan. Agar siswa tidak bingung "setelah ini ikut apa", setiap program dibagi
 * menjadi level berurutan; selesai satu level, langkah berikutnya adalah level di atasnya, lalu program
 * tahap berikutnya sesuai jenjang. Level memakai kolom `kelas.level` yang sudah ada (1–5).
 */

export interface LevelJalur {
  level: number;
  judul: string;
  fokus: string;
  hasil: string;
}

export interface TahapJalur {
  slug: string;
  nama: string;
  untuk: string;
  /** Lama tahap bila semua level diikuti berurutan (1 level = 1 bulan). */
  durasi: string;
  tujuan: string;
  level: LevelJalur[];
  /** Bila slug program ini belum tersedia di backend, tahap hanya tampil di mode fitur lanjutan. */
  butuhFiturLanjutan?: boolean;
}

export const JALUR_BELAJAR: TahapJalur[] = [
  {
    slug: "kenal-komputer",
    nama: "Kenal Komputer",
    untuk: "Usia 5–7 tahun (TK B–SD kelas 1)",
    durasi: "2 bulan",
    tujuan: "Nyaman dan aman memakai komputer sendiri sebelum belajar logika.",
    butuhFiturLanjutan: true,
    level: [
      { level: 1, judul: "Halo Komputer", fokus: "Mouse, keyboard, Windows, membuka aplikasi, folder dan file.", hasil: "Folder \"Karyaku\" berisi gambar pertama." },
      { level: 2, judul: "Kreatif dengan Komputer", fokus: "Menggambar digital, mengetik kata, menyusun slide sederhana, aturan aman internet.", hasil: "Slide 3 halaman tentang diri sendiri." },
    ],
  },
  {
    slug: "coding-dasar",
    nama: "Coding Dasar",
    untuk: "SD kelas 5–6",
    durasi: "3 bulan",
    tujuan: "Berpikir komputasional: urutan, perulangan, percabangan, dan variabel lewat blok.",
    level: [
      { level: 1, judul: "Logika dengan Scratch", fokus: "Urutan, perulangan, percabangan, dan skor.", hasil: "Game mini tangkap objek." },
      { level: 2, judul: "Game dan Cerita Interaktif", fokus: "Variabel, pesan antar-sprite, level permainan, dan suara.", hasil: "Game dua level dengan menu awal." },
      { level: 3, judul: "Jembatan ke Kode Teks", fokus: "Python Turtle: menggambar dengan perintah, perulangan, dan fungsi.", hasil: "Pola gambar Turtle buatan sendiri." },
    ],
  },
  {
    slug: "kelas-reguler-teknologi",
    nama: "Kelas Reguler Teknologi",
    untuk: "SMP kelas 7 – SMA kelas 12",
    durasi: "5 bulan",
    tujuan: "Membangun portofolio proyek nyata, satu bidang teknologi per level.",
    level: [
      { level: 1, judul: "Web Dasar", fokus: "HTML dan CSS: struktur halaman, gaya, dan gambar.", hasil: "Halaman profil pribadi." },
      { level: 2, judul: "Web Responsif dan JavaScript", fokus: "Flexbox, tampilan ponsel, dan interaksi dengan JavaScript.", hasil: "Situs portofolio responsif." },
      { level: 3, judul: "Python dan Data", fokus: "Variabel, list, perulangan, membaca dan meringkas data.", hasil: "Program analisis nilai kelas." },
      { level: 4, judul: "IoT Virtual", fokus: "Sensor, aktuator, dan logika alat pintar di simulator.", hasil: "Simulasi lampu atau penyiram otomatis." },
      { level: 5, judul: "AI Dasar dan Proyek Akhir", fokus: "Klasifikasi sederhana, etika AI, lalu satu proyek gabungan.", hasil: "Proyek portofolio yang dipresentasikan." },
    ],
  },
  {
    slug: "simulasi-jurusan-it",
    nama: "Simulasi Jurusan IT",
    untuk: "SMP kelas 9 – SMA kelas 12",
    durasi: "1 bulan",
    tujuan: "Mencoba 4 bidang kuliah IT dan mendapat rapor rekomendasi jurusan.",
    level: [
      { level: 1, judul: "Empat Bidang IT", fokus: "Software, jaringan, IoT, dan AI & data, satu bidang per sesi.", hasil: "Rapor Rekomendasi Jurusan." },
    ],
  },
];

/** Level Kelas Reguler yang paling dekat dengan bidang rekomendasi rapor. */
export const LEVEL_REGULER_PER_BIDANG: Record<Bidang, number> = {
  software: 2,
  ai_data: 5,
  iot: 4,
  jaringan: 4,
};

export interface LangkahBerikutnya {
  slug: string;
  nama: string;
  level: number;
  judul: string;
  alasan: string;
}

function langkah(slug: string, level: number, alasan: string): LangkahBerikutnya | null {
  const t = JALUR_BELAJAR.find((x) => x.slug === slug);
  const l = t?.level.find((x) => x.level === level);
  return t && l ? { slug, nama: t.nama, level, judul: l.judul, alasan } : null;
}

/**
 * Langkah berikutnya setelah siswa menyelesaikan satu paket (4 sesi). Urutan: level berikutnya di program yang
 * sama; bila level terakhir, program tahap berikutnya yang sesuai jenjang dan kelas; bila belum cukup umur,
 * latihan mandiri di Kodie Lab sampai jenjangnya cocok.
 */
export function langkahBerikutnya(
  selesai: { slug: string; level: number },
  siswa: { jenjang: Jenjang; kelas: number },
  bidangRapor?: Bidang | null,
): LangkahBerikutnya | null {
  const tahap = JALUR_BELAJAR.find((t) => t.slug === selesai.slug);
  if (!tahap) return null;
  const naik = langkah(selesai.slug, selesai.level + 1, `Lanjutan langsung dari ${tahap.nama} Level ${selesai.level}.`);
  if (naik) return naik;

  if (selesai.slug === "kenal-komputer") {
    if (siswa.jenjang === "SD" && siswa.kelas >= 5) return langkah("coding-dasar", 1, "Sudah lancar memakai komputer dan kini cukup umur untuk belajar logika.");
    return null; // SD kelas 2–4: latihan mode Blok di Kodie Lab sampai kelas 5 (lihat CATATAN_JEDA).
  }
  if (selesai.slug === "coding-dasar") {
    if (siswa.jenjang === "SD") return null;
    return langkah("kelas-reguler-teknologi", 1, "Dari blok ke kode teks: mulai membuat web sungguhan.");
  }
  if (selesai.slug === "kelas-reguler-teknologi") {
    if (siswa.jenjang === "SMA" || (siswa.jenjang === "SMP" && siswa.kelas >= 9)) {
      return langkah("simulasi-jurusan-it", 1, "Portofolio sudah lengkap; saatnya mencoba 4 bidang kuliah IT.");
    }
    return null;
  }
  if (selesai.slug === "simulasi-jurusan-it") {
    const bidang = bidangRapor ?? "software";
    return langkah(
      "kelas-reguler-teknologi",
      LEVEL_REGULER_PER_BIDANG[bidang],
      "Perdalam bidang yang direkomendasikan rapor jurusan.",
    );
  }
  return null;
}

/** Saran untuk masa jeda (mis. SD kelas 2–4 setelah Kenal Komputer) saat belum ada paket berbayar yang cocok. */
export const CATATAN_JEDA =
  "Belum ada paket untuk jenjang ini. Sambil menunggu, latih logika gratis di Kodie Lab mode Blok, lalu ikuti Coding Dasar di kelas 5.";
