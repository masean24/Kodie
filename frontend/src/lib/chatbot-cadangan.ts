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
      "- **Rp250.000** untuk satu paket\n\n" +
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
      "Tes Minat. Paketnya **Rp400.000** (4 sesi × 90 menit). Tes Minat bisa dicoba gratis tanpa akun [2].",
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

/** Info inti Kodie untuk pertanyaan bebas saat layanan chat lambat, dibatasi, atau gagal. */
const INFO_BIAYA: JawabanCadangan = {
  isi:
    "Biaya per paket (4 sesi, seminggu sekali) [1]:\n\n" +
    "- **Kenal Komputer** (usia 5–7 tahun, TK B–SD kelas 1): mulai **Rp225.000**\n" +
    "- **Coding Dasar** (SD kelas 5–6): mulai **Rp250.000**\n" +
    "- **Kelas Reguler Teknologi** (SMP–SMA): mulai **Rp350.000**\n" +
    "- **Simulasi Jurusan IT** (SMP kelas 9 dan SMA): mulai **Rp400.000**\n\n" +
    "Jadwal dan sisa kursi tiap kelas ada di katalog kelas [2].",
  sitasi: [
    { index: 1, title: "Program", url: "/program" },
    { index: 2, title: "Katalog kelas", url: "/kelas" },
  ],
};

const INFO_TES_MINAT: JawabanCadangan = {
  isi:
    "**Tes Minat Jurusan IT** berisi 12 soal, gratis, dan tanpa akun [1]. Hasilnya langsung keluar: bidang IT yang " +
    "paling cocok (Software, Jaringan, IoT, atau AI & Data) beserta saran program. Hasilnya saran, bukan keputusan.",
  sitasi: [{ index: 1, title: "Tes Minat", url: "/tes-minat" }],
};

const INFO_LAB: JawabanCadangan = {
  isi:
    "**Kodie Lab** adalah tempat latihan coding langsung di browser, gratis dan tanpa akun [1]. Ada 4 mode: " +
    "Blok, Python Turtle, HTML/CSS/JS, dan Python. Hasil kerja tersimpan sementara di browser perangkat itu.",
  sitasi: [{ index: 1, title: "Kodie Lab", url: "/lab" }],
};

const INFO_UMUM: JawabanCadangan = {
  isi:
    "Kiko sedang tidak bisa terhubung ke layanan jawaban, jadi ini ringkasan info Kodie:\n\n" +
    "- **Program**: Kenal Komputer mulai Rp225.000, Coding Dasar mulai Rp250.000, Kelas Reguler Teknologi mulai " +
    "Rp350.000, Simulasi Jurusan IT mulai Rp400.000 per paket 4 sesi [1].\n" +
    "- **Tes Minat**: 12 soal, gratis, tanpa akun [2].\n" +
    "- **Kodie Lab**: latihan coding di browser, gratis tanpa akun [3].\n" +
    "- **Daftar**: orang tua mendaftar lalu menambah profil anak; siswa SMP/SMA boleh daftar sendiri lalu meminta " +
    "persetujuan orang tua lewat link [4].\n\n" +
    "Untuk pertanyaan lain, hubungi Admin lewat opsi di bawah.",
  sitasi: [
    { index: 1, title: "Program", url: "/program" },
    { index: 2, title: "Tes Minat", url: "/tes-minat" },
    { index: 3, title: "Kodie Lab", url: "/lab" },
    { index: 4, title: "Daftar akun", url: "/daftar" },
  ],
};

/**
 * Jawaban lokal untuk pesan apa pun: jawaban pertanyaan populer bila cocok persis, lalu topik berdasarkan
 * kata kunci (biaya, tes minat, Lab, daftar, bayar), dan ringkasan info inti Kodie sebagai cadangan terakhir.
 */
export function jawabanCadanganKiko(pesan: string): JawabanCadangan {
  const i = CHATBOT_LAUNCHER_CONFIG.suggestedPrompts.findIndex((p) => p === pesan.trim());
  const populer = i >= 0 ? JAWABAN[i] : undefined;
  if (populer) return populer;
  const q = pesan.toLowerCase();
  if (/biaya|harga|tarif|bayar berapa|berapa(an)? (biaya|harga)|\brp|mahal|murah/.test(q)) return INFO_BIAYA;
  if (/tes minat|tes jurusan|kuis minat/.test(q)) return INFO_TES_MINAT;
  if (/\blab\b|kodie lab|latihan coding|playground/.test(q)) return INFO_LAB;
  if (/daftar|registrasi|akun|persetujuan/.test(q) && JAWABAN[2]) return JAWABAN[2];
  if (/transfer|qris|bukti bayar|pembayaran|cara bayar|masuk kelas|google meet/.test(q) && JAWABAN[3]) return JAWABAN[3];
  if (/simulasi|jurusan|rapor/.test(q) && JAWABAN[1]) return JAWABAN[1];
  if (/\bsd\b|kelas 5|kelas 6|coding dasar|scratch/.test(q) && JAWABAN[0]) return JAWABAN[0];
  return INFO_UMUM;
}
