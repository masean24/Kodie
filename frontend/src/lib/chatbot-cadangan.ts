import { CHATBOT_LAUNCHER_CONFIG } from "@/components/chatbot/chatbot.config";

export interface JawabanCadangan {
  isi: string;
  sitasi: { index: number; title: string; url: string }[];
}

/**
 * Jawaban lokal untuk "Pertanyaan populer" Kiko, dipakai saat layanan chat lambat, dibatasi, atau gagal.
 * Isinya diringkas dari dokumen pengetahuan resmi Kiko di `docs/knowledge/01–04`. Jika isi dokumen itu
 * berubah (misalnya harga paket), perbarui juga teks di sini.
 */
const JAWABAN: JawabanCadangan[] = [
  {
    isi:
      "Untuk siswa SD kelas 5–6, program yang cocok adalah **Coding Dasar** [1]. Anak belajar logika, perulangan, " +
      "dan percabangan sambil membuat animasi dan game kecil dengan **Scratch**.\n\n" +
      "- 4 sesi per paket, seminggu sekali, 60 menit per sesi\n" +
      "- Maksimal 10 siswa per kelas\n" +
      "- **Rp200.000** untuk satu paket\n\n" +
      "Jadwal dan sisa kursi bisa dilihat di katalog kelas [2].",
    sitasi: [
      { index: 1, title: "Coding Dasar", url: "/program/coding-dasar" },
      { index: 2, title: "Katalog kelas", url: "/kelas?jenjang=SD" },
    ],
  },
  {
    isi:
      "**Simulasi Jurusan IT** untuk siswa SMP kelas 9 dan SMA kelas 10–12 [1]. Dalam 4 sesi, siswa mencoba empat " +
      "bidang kuliah IT: Software Engineering, Jaringan & Keamanan Siber, Internet of Things, serta AI & Data.\n\n" +
      "Siswa yang hadir di sesi ke-4 mendapat **Rapor Rekomendasi Jurusan** dari pengajar, disandingkan dengan hasil " +
      "Tes Minat. Paketnya **Rp300.000** (4 sesi × 90 menit). Tes Minat bisa dicoba gratis tanpa akun [2].",
    sitasi: [
      { index: 1, title: "Simulasi Jurusan IT", url: "/program/simulasi-jurusan-it" },
      { index: 2, title: "Tes Minat Jurusan IT", url: "/tes-minat" },
    ],
  },
  {
    isi:
      "Pendaftaran ada di halaman Daftar [1]:\n\n" +
      "- **Siswa SD**: orang tua mendaftar sebagai Orang Tua, lalu menambahkan profil anak.\n" +
      "- **Siswa SMP/SMA** boleh mendaftar sendiri. Setelah daftar, siswa mengirim **link persetujuan** (berlaku 7 hari) " +
      "ke orang tua lewat salin link atau WhatsApp.\n" +
      "- Setelah orang tua menyetujui, akun siswa aktif dan terhubung ke dashboard orang tua, lalu bisa memesan kelas.\n\n" +
      "Selama menunggu persetujuan, siswa sudah bisa melihat katalog dan mengerjakan Tes Minat.",
    sitasi: [{ index: 1, title: "Daftar akun", url: "/daftar" }],
  },
  {
    isi:
      "Alurnya begini [1]:\n\n" +
      "1. Pilih kelas di katalog, lalu klik **Pesan**. Kursi ditahan **24 jam**.\n" +
      "2. Bayar lewat transfer bank atau QRIS sesuai tagihan, lalu **unggah bukti bayar** (JPG, PNG, atau PDF, maks. 2 MB).\n" +
      "3. Setelah admin memverifikasi, booking berstatus terkonfirmasi.\n" +
      "4. Tombol **Masuk Kelas** di halaman sesi aktif mulai **15 menit sebelum** sesi sampai sesi berakhir. " +
      "Link Google Meet tidak pernah ditampilkan di halaman publik.",
    sitasi: [{ index: 1, title: "Katalog kelas", url: "/kelas" }],
  },
];

/** Jawaban lokal untuk pertanyaan populer, atau `null` jika pesan bukan salah satunya. */
export function jawabanCadanganKiko(pesan: string): JawabanCadangan | null {
  const i = CHATBOT_LAUNCHER_CONFIG.suggestedPrompts.findIndex((p) => p === pesan.trim());
  return i >= 0 ? (JAWABAN[i] ?? null) : null;
}
