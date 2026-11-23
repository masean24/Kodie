import type { Bidang } from "@/types/database";

/**
 * Posisi pengajar yang sedang dibuka di halaman /karier.
 * Data statis di frontend (keputusan 2026-11-23): belum ada tabel lowongan di PRD.
 * Melamar = membuat akun pengajar lewat alur yang sama (status menunggu verifikasi admin).
 */
export type Posisi = {
  slug: string;
  judul: string;
  bidang: Bidang;
  ringkas: string;
  jenjang: string;
  materi: string[];
  tugas: string[];
  syarat: string[];
  nilaiTambah: string[];
};

export const POSISI: Posisi[] = [
  {
    slug: "pengajar-coding-dasar",
    judul: "Pengajar Coding Dasar",
    bidang: "software",
    ringkas: "Kenalkan logika dan algoritma lewat Scratch dan permainan untuk siswa SD.",
    jenjang: "SD kelas 3–6",
    materi: ["Scratch", "Logika dan algoritma", "Computational thinking"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Mengikuti Teaching Playbook Kodie di setiap sesi.",
      "Mengisi laporan singkat untuk orang tua setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja.",
      "Paham dasar logika pemrograman dan Scratch.",
      "Sabar dan senang menjelaskan untuk anak-anak.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Pernah mengajar atau menjadi asisten praktikum.", "Pengalaman di kegiatan anak atau komunitas."],
  },
  {
    slug: "pengajar-python",
    judul: "Pengajar Python",
    bidang: "software",
    ringkas: "Ajak siswa SMP dan SMA menulis program Python pertama sampai proyek kecil.",
    jenjang: "SMP–SMA",
    materi: ["Python dasar", "Struktur data", "Proyek mini"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Membimbing siswa menyelesaikan latihan dan proyek mini.",
      "Mengisi laporan perkembangan siswa setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja.",
      "Menguasai Python dasar: variabel, perulangan, fungsi, list, dan dictionary.",
      "Bisa menjelaskan konsep dengan bahasa sederhana.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Punya proyek Python di GitHub.", "Pernah menjadi asisten praktikum pemrograman."],
  },
  {
    slug: "pengajar-web",
    judul: "Pengajar Pengembangan Web",
    bidang: "software",
    ringkas: "Bimbing siswa membuat halaman web pertama dengan HTML, CSS, dan JavaScript.",
    jenjang: "SMP–SMA",
    materi: ["HTML", "CSS", "JavaScript dasar"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Memandu siswa membangun dan memublikasikan proyek web sederhana.",
      "Mengisi laporan perkembangan siswa setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja.",
      "Menguasai HTML, CSS, dan JavaScript dasar.",
      "Bisa menjelaskan konsep dengan bahasa sederhana.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Punya portofolio web.", "Paham Git dan GitHub."],
  },
  {
    slug: "pengajar-jaringan",
    judul: "Pengajar Jaringan Komputer",
    bidang: "jaringan",
    ringkas: "Jelaskan cara internet bekerja, alamat IP, hingga simulasi jaringan sederhana.",
    jenjang: "SMP–SMA",
    materi: ["Dasar jaringan", "Alamat IP dan subnet", "Simulasi Cisco Packet Tracer"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Memandu praktik simulasi jaringan di Packet Tracer.",
      "Mengisi laporan perkembangan siswa setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja di bidang jaringan atau sejenisnya.",
      "Paham model OSI/TCP-IP, pengalamatan IP, dan routing dasar.",
      "Terbiasa memakai Cisco Packet Tracer.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Memiliki sertifikat jaringan (misalnya CCNA atau MTCNA).", "Pernah menjadi asisten praktikum jaringan."],
  },
  {
    slug: "pengajar-iot",
    judul: "Pengajar IoT dan Arduino",
    bidang: "iot",
    ringkas: "Hubungkan kode dengan dunia nyata lewat sensor, LED, dan mikrokontroler.",
    jenjang: "SMP–SMA",
    materi: ["Arduino", "Sensor dan aktuator", "Simulasi Wokwi atau Tinkercad"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Memandu proyek IoT dengan simulator agar bisa diikuti tanpa membeli alat.",
      "Mengisi laporan perkembangan siswa setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja di bidang elektronika, IoT, atau sejenisnya.",
      "Paham pemrograman Arduino (C/C++) dan rangkaian dasar.",
      "Terbiasa memakai simulator seperti Wokwi atau Tinkercad.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Punya proyek IoT yang bisa ditunjukkan.", "Pernah ikut lomba robotik atau IoT."],
  },
  {
    slug: "pengajar-ai-data",
    judul: "Pengajar AI dan Data",
    bidang: "ai_data",
    ringkas: "Kenalkan cara membaca data, membuat grafik, dan konsep dasar kecerdasan buatan.",
    jenjang: "SMA",
    materi: ["Analisis data dengan Python", "Visualisasi data", "Dasar machine learning"],
    tugas: [
      "Mengajar kelas daring kelompok kecil sesuai jadwal yang kamu buka sendiri.",
      "Memandu siswa mengolah data nyata menjadi grafik dan kesimpulan.",
      "Mengisi laporan perkembangan siswa setelah sesi selesai.",
    ],
    syarat: [
      "Mahasiswa aktif, lulusan, atau pencari kerja di bidang data, statistika, informatika, atau sejenisnya.",
      "Menguasai Python untuk data (pandas, matplotlib).",
      "Paham konsep dasar machine learning.",
      "Punya laptop dan koneksi internet stabil.",
    ],
    nilaiTambah: ["Punya proyek data atau notebook publik.", "Pernah mengikuti kompetisi data."],
  },
];

export function cariPosisi(slug: string): Posisi | undefined {
  return POSISI.find((p) => p.slug === slug);
}

/** Alur lamaran, selaras dengan verifikasi pengajar di PRD (KTP/KTM, SKCK, wawancara). */
export const LANGKAH_LAMARAN = [
  { judul: "Pilih posisi", ket: "Baca tugas dan syaratnya." },
  { judul: "Buat akun pengajar", ket: "Isi data diri dan bidang keahlian." },
  { judul: "Lengkapi berkas", ket: "Foto, KTP atau KTM, dan SKCK di halaman profil." },
  { judul: "Wawancara", ket: "Admin menjadwalkan wawancara singkat." },
  { judul: "Mulai mengajar", ket: "Buka kelas setelah diverifikasi." },
];

export const KEUNTUNGAN = [
  { judul: "Jadwal fleksibel", ket: "Kamu yang membuka kelas dan menentukan jadwalnya." },
  { judul: "Sepenuhnya daring", ket: "Mengajar dari mana saja, cukup laptop dan internet." },
  { judul: "Materi sudah siap", ket: "Teaching Playbook memandu setiap sesi, langkah demi langkah." },
  { judul: "Pengalaman nyata", ket: "Bangun portofolio mengajar untuk karier di bidang IT." },
];
