/**
 * Data mock. Bentuknya mengikuti tabel/view Supabase (src/types/database.ts).
 * Semua nama adalah karangan. Harga, durasi, dan kapasitas mengikuti docs/SERAH-TERIMA-FE.md.
 */
import type { Bidang, KelasKatalog, KodeOpsi, PengajarPublik, Program } from "@/types/database";
import { storeMock } from "./store";
import { STATUS_AKTIF } from "@/lib/booking";

export const programMock: Program[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "coding-dasar",
    nama: "Coding Dasar",
    jenjang: ["SD"],
    kelas_min: 5,
    kelas_maks: 6,
    level: 1,
    deskripsi:
      "Belajar logika dan berpikir komputasional lewat pemrograman blok. Setiap sesi ditutup dengan satu proyek kecil yang bisa ditunjukkan ke orang tua.",
    durasi_menit: 60,
    jumlah_sesi: 4,
    harga_paket: 200_000,
    honor_per_sesi: 50_000,
    aktif: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "kelas-reguler-teknologi",
    nama: "Kelas Reguler Teknologi",
    jenjang: ["SMP", "SMA"],
    kelas_min: 7,
    kelas_maks: 12,
    level: 1,
    deskripsi:
      "Pemrograman, web, IoT virtual, dan AI dasar yang naik bertahap per level. Setiap bulan siswa menyelesaikan satu proyek.",
    durasi_menit: 90,
    jumlah_sesi: 4,
    harga_paket: 275_000,
    honor_per_sesi: 65_000,
    aktif: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "simulasi-jurusan-it",
    nama: "Simulasi Jurusan IT",
    jenjang: ["SMP", "SMA"],
    kelas_min: 9,
    kelas_maks: 12,
    level: 1,
    deskripsi:
      "Empat sesi untuk mencoba software engineering, jaringan komputer, IoT, dan integrasi AI. Di akhir, siswa mendapat rapor rekomendasi jurusan kuliah.",
    durasi_menit: 90,
    jumlah_sesi: 4,
    harga_paket: 300_000,
    honor_per_sesi: 75_000,
    aktif: true,
  },
];

export const pengajarMock: PengajarPublik[] = [
  {
    id: "00000000-0000-4000-9000-000000000001",
    nama: "Nadia Putri",
    status_kerja: "mahasiswa",
    kampus: "Universitas Contoh Nusantara",
    jurusan: "Informatika",
    keahlian: ["software", "ai_data"],
    jumlah_rating: 12,
    rata_rata_rating: 4.8,
    foto_url: null,
  },
  {
    id: "00000000-0000-4000-9000-000000000002",
    nama: "Dimas Pratama",
    status_kerja: "lulusan",
    kampus: "Politeknik Contoh Mandiri",
    jurusan: "Teknik Komputer",
    keahlian: ["jaringan", "iot"],
    jumlah_rating: 3,
    rata_rata_rating: 4.7,
    foto_url: null,
  },
  {
    id: "00000000-0000-4000-9000-000000000003",
    nama: "Sekar Ayuningtyas",
    status_kerja: "pencari_kerja",
    kampus: null,
    jurusan: "Sistem Informasi",
    keahlian: ["software"],
    jumlah_rating: 1,
    rata_rata_rating: null,
    foto_url: null,
  },
];

/** Tanggal (UTC ISO) untuk hari tertentu (1 = Senin) pukul jam WIB, `minggu` minggu dari sekarang. */
function waktuWib(sekarang: Date, hari: number, jam: number, minggu: number): string {
  const wibSekarang = new Date(sekarang.getTime() + 7 * 3_600_000);
  const hariIni = ((wibSekarang.getUTCDay() + 6) % 7) + 1;
  const selisih = (hari - hariIni + 7) % 7 || 7;
  const d = new Date(
    Date.UTC(wibSekarang.getUTCFullYear(), wibSekarang.getUTCMonth(), wibSekarang.getUTCDate() + selisih + minggu * 7, jam - 7),
  );
  return d.toISOString();
}

type RencanaKelas = {
  id: string;
  program: string;
  pengajar: string;
  level: number;
  hari: number;
  jam: number;
  minggu: number;
  terpakai: number;
  status?: KelasKatalog["status"];
};

const rencana: RencanaKelas[] = [
  { id: "00000000-0000-4000-a000-000000000001", program: "coding-dasar", pengajar: "00000000-0000-4000-9000-000000000001", level: 1, hari: 6, jam: 9, minggu: 0, terpakai: 4 },
  { id: "00000000-0000-4000-a000-000000000002", program: "coding-dasar", pengajar: "00000000-0000-4000-9000-000000000003", level: 1, hari: 3, jam: 16, minggu: 1, terpakai: 10 },
  { id: "00000000-0000-4000-a000-000000000003", program: "kelas-reguler-teknologi", pengajar: "00000000-0000-4000-9000-000000000001", level: 2, hari: 1, jam: 19, minggu: 0, terpakai: 6 },
  { id: "00000000-0000-4000-a000-000000000004", program: "kelas-reguler-teknologi", pengajar: "00000000-0000-4000-9000-000000000002", level: 1, hari: 4, jam: 19, minggu: 0, terpakai: 13 },
  { id: "00000000-0000-4000-a000-000000000005", program: "simulasi-jurusan-it", pengajar: "00000000-0000-4000-9000-000000000002", level: 1, hari: 6, jam: 13, minggu: 1, terpakai: 2 },
  { id: "00000000-0000-4000-a000-000000000006", program: "simulasi-jurusan-it", pengajar: "00000000-0000-4000-9000-000000000001", level: 1, hari: 2, jam: 19, minggu: -2, terpakai: 8, status: "berjalan" },
];

/** Bentuk view kelas_katalog, dihitung terhadap waktu `sekarang`. */
export function buatKelasMock(sekarang: Date): KelasKatalog[] {
  return rencana.map((r) => {
    const program = programMock.find((p) => p.slug === r.program)!;
    const pengajar = pengajarMock.find((p) => p.id === r.pengajar)!;
    const kapasitas = program.jenjang.includes("SD") ? 10 : 15;
    // Booking aktif yang dibuat di mode mock ikut menghitung kursi terpakai.
    const terpakai = r.terpakai + storeMock().booking.filter((b) => b.kelas_id === r.id && STATUS_AKTIF.includes(b.status)).length;
    const mulai_pada = waktuWib(sekarang, r.hari, r.jam, r.minggu);
    const sisa_kursi = Math.max(0, kapasitas - terpakai);
    const status = r.status ?? "terbuka";
    return {
      id: r.id,
      program_id: program.id,
      level: r.level,
      pengajar_id: pengajar.id,
      kapasitas,
      jam_mulai: `${String(r.jam).padStart(2, "0")}:00:00`,
      status,
      kursi_terpakai: terpakai,
      sisa_kursi,
      bisa_dibooking: status === "terbuka" && sisa_kursi > 0 && new Date(mulai_pada) > sekarang,
      hari_mingguan: r.hari,
      program_slug: program.slug,
      program_nama: program.nama,
      jenjang: program.jenjang,
      durasi_menit: program.durasi_menit,
      jumlah_sesi: program.jumlah_sesi,
      harga_paket: program.harga_paket,
      pengajar_nama: pengajar.nama,
      pengajar_foto_url: pengajar.foto_url,
      mulai_pada,
    };
  });
}

type SoalMock = {
  id: string;
  urutan: number;
  teks: string;
  opsi: { kode: KodeOpsi; teks: string; bobot: Partial<Record<Bidang, number>> }[];
};

/**
 * DRAF: 12 soal sementara untuk mock. Isi final dari tim ada di docs/konten/soal-tes-minat.md
 * dan di seed backend. Soal 1 diambil dari contoh di file tersebut.
 */
export const soalMinatMock: SoalMock[] = [
  ["Saat ada waktu luang di depan komputer, kamu paling suka…", [
    ["Membuat website atau aplikasi kecil", { software: 3 }],
    ["Mengotak-atik pengaturan Wi-Fi dan koneksi internet", { jaringan: 3 }],
    ["Merakit atau memprogram alat seperti lampu otomatis", { iot: 3 }],
    ["Mencari pola dari data, misalnya statistik game favorit", { ai_data: 3 }],
  ]],
  ["Kalau internet di rumah tiba-tiba lambat, kamu…", [
    ["Mencari aplikasi yang bisa mengukur kecepatannya", { software: 2, ai_data: 1 }],
    ["Memeriksa router dan siapa saja yang sedang terhubung", { jaringan: 3 }],
    ["Memindahkan router supaya sinyalnya lebih kuat", { iot: 2, jaringan: 1 }],
    ["Mencatat jam berapa saja internet sering lambat", { ai_data: 3 }],
  ]],
  ["Proyek sekolah yang paling ingin kamu kerjakan adalah…", [
    ["Game edukasi sederhana", { software: 3 }],
    ["Jaringan komputer kecil untuk satu kelas", { jaringan: 3 }],
    ["Tempat sampah yang terbuka sendiri saat didekati", { iot: 3 }],
    ["Survei teman sekelas lalu membuat grafiknya", { ai_data: 3 }],
  ]],
  ["Di sebuah tim, kamu paling cocok menjadi orang yang…", [
    ["Menyusun langkah-langkah supaya ide jadi aplikasi", { software: 3 }],
    ["Memastikan semua perangkat bisa saling terhubung", { jaringan: 3 }],
    ["Merakit dan menguji alat sampai benar-benar bekerja", { iot: 3 }],
    ["Membaca data dan memberi saran keputusan", { ai_data: 3 }],
  ]],
  ["Video teknologi yang paling sering kamu tonton membahas…", [
    ["Cara membuat aplikasi atau website", { software: 3 }],
    ["Cara kerja internet dan keamanan akun", { jaringan: 3 }],
    ["Robot, drone, atau rumah pintar", { iot: 3 }],
    ["Kecerdasan buatan dan chatbot", { ai_data: 3 }],
  ]],
  ["Kalau aplikasi favoritmu error, kamu penasaran tentang…", [
    ["Bagian kode mana yang salah", { software: 3 }],
    ["Apakah servernya bisa dijangkau", { jaringan: 3 }],
    ["Apakah sensor atau perangkat HP-nya bermasalah", { iot: 2, software: 1 }],
    ["Berapa banyak pengguna lain yang mengalami hal sama", { ai_data: 3 }],
  ]],
  ["Pelajaran yang paling kamu nikmati adalah…", [
    ["Bahasa dan menulis cerita langkah demi langkah", { software: 2, ai_data: 1 }],
    ["Geografi: peta dan jalur penghubung antarkota", { jaringan: 3 }],
    ["Fisika: listrik, gerak, dan cahaya", { iot: 3 }],
    ["Matematika: peluang dan statistik", { ai_data: 3 }],
  ]],
  ["Hadiah yang paling kamu inginkan adalah…", [
    ["Laptop untuk membuat aplikasi", { software: 3 }],
    ["Router dan kabel jaringan untuk bereksperimen", { jaringan: 3 }],
    ["Kit mikrokontroler dan sensor", { iot: 3 }],
    ["Kursus daring tentang AI", { ai_data: 3 }],
  ]],
  ["Saat bermain game daring, kamu paling peduli pada…", [
    ["Fitur dan tampilan gamenya", { software: 3 }],
    ["Ping dan kestabilan koneksi", { jaringan: 3 }],
    ["Kontroler dan perangkat yang dipakai", { iot: 3 }],
    ["Statistik permainan dan peringkat", { ai_data: 3 }],
  ]],
  ["Masalah di sekitarmu yang ingin kamu selesaikan dengan teknologi…", [
    ["Antrean kantin yang lama, lewat aplikasi pemesanan", { software: 3 }],
    ["Wi-Fi sekolah yang tidak sampai ke semua kelas", { jaringan: 3 }],
    ["Tanaman sekolah yang lupa disiram", { iot: 3 }],
    ["Memperkirakan buku perpustakaan yang paling dicari", { ai_data: 3 }],
  ]],
  ["Cara belajarmu yang paling cocok adalah…", [
    ["Mencoba menulis perintah lalu melihat hasilnya", { software: 3 }],
    ["Menggambar diagram bagaimana sesuatu terhubung", { jaringan: 3 }],
    ["Membongkar dan memasang kembali benda", { iot: 3 }],
    ["Membandingkan angka dan mencari kesimpulan", { ai_data: 3 }],
  ]],
  ["Lima tahun lagi, kamu ingin dikenal sebagai orang yang…", [
    ["Membuat aplikasi yang dipakai banyak orang", { software: 3 }],
    ["Menjaga sistem dan data tetap aman", { jaringan: 3 }],
    ["Menciptakan alat pintar yang berguna", { iot: 3 }],
    ["Membuat komputer bisa belajar dari data", { ai_data: 3 }],
  ]],
].map(([teks, opsi], i) => ({
  id: `00000000-0000-4000-b000-${String(i + 1).padStart(12, "0")}`,
  urutan: i + 1,
  teks: teks as string,
  opsi: (opsi as [string, Partial<Record<Bidang, number>>][]).map(([t, bobot], j) => ({
    kode: (["A", "B", "C", "D"] as const)[j],
    teks: t,
    bobot,
  })),
}));
