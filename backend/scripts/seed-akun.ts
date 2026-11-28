import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../supabase/types/database.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPasswordEnv = process.env.DEMO_USER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'ERROR: SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di backend/.env',
  );
  process.exit(1);
}
if (!demoPasswordEnv) {
  console.error(
    'ERROR: DEMO_USER_PASSWORD wajib diisi di backend/.env (lihat backend/.env.example)',
  );
  process.exit(1);
}

const DEMO_PASSWORD: string = demoPasswordEnv;

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PROGRAM_IDS = {
  codingDasar: '11111111-1111-4111-8111-000000000001',
  kelasReguler: '11111111-1111-4111-8111-000000000002',
  simulasiIt: '11111111-1111-4111-8111-000000000003',
  kenalKomputer: '11111111-1111-4111-8111-000000000004',
} as const;

const KELAS_IDS = {
  k1: '22222222-2222-4222-8222-000000000001',
  k2Penuh: '22222222-2222-4222-8222-000000000002',
  k3: '22222222-2222-4222-8222-000000000003',
  k4: '22222222-2222-4222-8222-000000000004',
  k5: '22222222-2222-4222-8222-000000000005',
  k6Selesai: '22222222-2222-4222-8222-000000000006',
  k8Kenal: '22222222-2222-4222-8222-000000000008',
} as const;

// PNG 1x1 pixel valid untuk demo placeholder QRIS & bukti bayar
const DUMMY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function ensureAuthUser(params: {
  email: string;
  password: string;
  user_metadata: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): Promise<string> {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === params.email.toLowerCase(),
  );
  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: params.user_metadata,
    app_metadata: params.app_metadata,
  });

  if (error || !data.user) {
    throw new Error(`Gagal membuat user ${params.email}: ${error?.message}`);
  }
  return data.user.id;
}

function wibDateIso(daysOffset: number, hourWib: number, minuteWib = 0): string {
  const now = new Date();
  const target = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const wibDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target);
  const hh = String(hourWib).padStart(2, '0');
  const mm = String(minuteWib).padStart(2, '0');
  return new Date(`${wibDate}T${hh}:${mm}:00+07:00`).toISOString();
}

function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

async function ensureStaticSeed() {
  console.log('1. Memastikan data program, pengaturan, soal_minat, dan playbook...');

  const { error: progErr } = await supabase.from('program').upsert(
    [
      {
        id: PROGRAM_IDS.codingDasar,
        slug: 'coding-dasar',
        nama: 'Coding Dasar',
        jenjang: ['SD'],
        kelas_min: 5,
        kelas_maks: 6,
        level: 1,
        deskripsi:
          'Belajar logika, berpikir komputasional, dan pemrograman blok interaktif menggunakan Scratch. Setiap sesi menghasilkan proyek animasi atau game mini.',
        durasi_menit: 60,
        jumlah_sesi: 4,
        harga_paket: 250000,
        honor_per_sesi: 50000,
        aktif: true,
        silabus: [
          {
            sesi: 1,
            judul: 'Logika Urutan & Karakter Pertama',
            topik:
              'Mengenal instruksi berurutan (sequence), Stage, Sprite, serta blok Events, Motion, dan Looks di Scratch.',
            hasil_proyek: 'Animasi karakter menyapa dan berjalan mengikuti urutan perintah.',
          },
          {
            sesi: 2,
            judul: 'Perulangan (Loop) & Animasi Halus',
            topik:
              'Menggunakan blok repeat dan forever, pergantian kostum, dan pantulan otomatis saat menyentuh tepi layar.',
            hasil_proyek: 'Animasi akuarium atau karakter bergerak terus dengan latar kustom.',
          },
          {
            sesi: 3,
            judul: 'Percabangan Kondisi (If-Then) & Kontrol Keyboard',
            topik:
              'Memahami logika sebab-akibat dengan blok if-then, sensor sentuh objek/warna, dan kontrol tombol arah.',
            hasil_proyek: 'Karakter interaktif yang merespons tombol dan rintangan.',
          },
          {
            sesi: 4,
            judul: 'Variabel Skor & Game Mini Interaktif',
            topik:
              'Membuat variabel skor/nyawa, menggabungkan urutan, loop, dan kondisi menjadi game mini utuh.',
            hasil_proyek: 'Game tangkap objek sederhana siap dipamerkan ke orang tua.',
          },
        ] as unknown as Json,
      },
      {
        id: PROGRAM_IDS.kelasReguler,
        slug: 'kelas-reguler-teknologi',
        nama: 'Kelas Reguler Teknologi',
        jenjang: ['SMP', 'SMA'],
        kelas_min: 7,
        kelas_maks: 12,
        level: 1,
        deskripsi:
          'Kelas berjenjang yang membahas pemrograman web (HTML, CSS, JavaScript), simulasi IoT virtual, dan pengenalan AI dasar dengan proyek nyata.',
        durasi_menit: 90,
        jumlah_sesi: 4,
        harga_paket: 350000,
        honor_per_sesi: 65000,
        aktif: true,
        silabus: [
          {
            sesi: 1,
            judul: 'Fondasi Struktur Web HTML5',
            topik:
              'Memahami cara browser membaca HTML, struktur tag semantik (heading, paragraf, daftar, gambar, tautan), dan Inspect Element.',
            hasil_proyek: 'Halaman web profil pelajar satu halaman.',
          },
          {
            sesi: 2,
            judul: 'Styling Modern dengan CSS & Flexbox',
            topik:
              'Menerapkan selektor CSS, Box Model (margin, padding, border), serta penataan responsif memakai Flexbox.',
            hasil_proyek: 'Kartu profil dan galeri hobi modern yang rapi di laptop dan ponsel.',
          },
          {
            sesi: 3,
            judul: 'Interaktivitas Web dengan JavaScript & DOM',
            topik:
              'Mengenal variabel, fungsi, event listener tombol/form, dan manipulasi elemen DOM secara langsung.',
            hasil_proyek: 'Aplikasi web catatan atau daftar tugas interaktif di browser.',
          },
          {
            sesi: 4,
            judul: 'Simulasi IoT Virtual & Pengenalan AI Dasar',
            topik:
              'Merancang logika sensor dan LED di simulator Wokwi serta mencoba klasifikasi teks sederhana dengan AI.',
            hasil_proyek: 'Purwarupa lampu otomatis virtual dan demo asisten teks sederhana.',
          },
        ] as unknown as Json,
      },
      {
        id: PROGRAM_IDS.simulasiIt,
        slug: 'simulasi-jurusan-it',
        nama: 'Simulasi Jurusan IT',
        jenjang: ['SMP', 'SMA'],
        kelas_min: 9,
        kelas_maks: 12,
        level: 1,
        deskripsi:
          'Program eksplorasi 4 sesi (Software Engineering, Jaringan Komputer, IoT, dan Integrasi AI) untuk membantu siswa kelas 9–12 memilih jurusan kuliah IT.',
        durasi_menit: 90,
        jumlah_sesi: 4,
        harga_paket: 400000,
        honor_per_sesi: 75000,
        aktif: true,
        silabus: [
          {
            sesi: 1,
            judul: 'Simulasi 1: Software Engineering',
            topik:
              'Mengenal alur kerja Software Engineer, logika pemrograman antarmuka web, penanganan event, dan debugging dasar.',
            hasil_proyek: 'Aplikasi web mini Kalkulator Target Tabungan.',
          },
          {
            sesi: 2,
            judul: 'Simulasi 2: Jaringan Komputer & Keamanan Siber',
            topik:
              'Memahami IP Address, DNS, router, protokol HTTP/HTTPS, inspeksi Network Tab, serta mengenali ancaman phishing.',
            hasil_proyek: 'Analisis lalu lintas request browser dan investigasi keamanan tautan.',
          },
          {
            sesi: 3,
            judul: 'Simulasi 3: Internet of Things (IoT) Virtual',
            topik:
              'Mengenal mikrokontroler ESP32/Arduino, wiring sensor jarak & suhu, serta pemrograman logika perangkat di Wokwi.',
            hasil_proyek: 'Simulasi perangkat rumah pintar berbasis sensor otomatis.',
          },
          {
            sesi: 4,
            judul: 'Simulasi 4: AI & Sains Data + Rapor Jurusan',
            topik:
              'Mencoba eksperimen klasifikasi teks AI, evaluasi kesalahan model, dan refleksi minat keempat bidang IT.',
            hasil_proyek: 'Notebook klasifikasi AI dan Rapor Rekomendasi Jurusan Kuliah.',
          },
        ] as unknown as Json,
      },
      {
        id: PROGRAM_IDS.kenalKomputer,
        slug: 'kenal-komputer',
        nama: 'Kenal Komputer',
        jenjang: ['TK', 'SD'],
        kelas_min: 0,
        kelas_maks: 1,
        level: 1,
        deskripsi:
          'Kenalan dengan komputer untuk anak usia 5–7 tahun: memakai mouse dan keyboard, membuka aplikasi di Windows, menyimpan karya ke folder, dan aman di internet. Didampingi orang tua di setiap sesi.',
        durasi_menit: 45,
        jumlah_sesi: 4,
        harga_paket: 225000,
        honor_per_sesi: 0,
        aktif: true,
        silabus: [
          {
            sesi: 1,
            judul: 'Halo Komputer: Mouse, Keyboard, dan Layar',
            topik:
              'Mengenal bagian komputer, menyalakan dan mematikan dengan benar, menggerakkan mouse, klik dan klik dua kali, serta posisi duduk yang sehat.',
            hasil_proyek: 'Mewarnai gambar di Paint dengan klik dan seret.',
          },
          {
            sesi: 2,
            judul: 'Jelajah Windows: Desktop, Ikon, dan Jendela',
            topik:
              'Mengenal desktop, menu Start, membuka dan menutup aplikasi, memperbesar, mengecilkan, dan memindahkan jendela.',
            hasil_proyek: 'Membuka tiga aplikasi sendiri dan menatanya berdampingan.',
          },
          {
            sesi: 3,
            judul: 'Rumah untuk Karya: Folder dan File',
            topik:
              'Membuat folder, memberi nama, menyimpan gambar ke folder yang tepat, menyalin, memindahkan, dan menghapus file dengan aman.',
            hasil_proyek: 'Folder "Karyaku" berisi gambar dari sesi 1 dan 2 yang tersusun rapi.',
          },
          {
            sesi: 4,
            judul: 'Mengetik Nama dan Aman di Internet',
            topik:
              'Mengetik huruf dan angka di keyboard, membuka peramban bersama orang tua, dan aturan aman: tidak membagikan data pribadi.',
            hasil_proyek: 'Kartu nama digital sederhana disimpan di folder "Karyaku".',
          },
        ] as unknown as Json,
      },
    ],
    { onConflict: 'slug' },
  );
  if (progErr) throw progErr;

  const { error: pengErr } = await supabase.from('pengaturan').upsert(
    [
      { kunci: 'nama_bank', nilai: 'Bank Mandiri (Contoh Demo)' },
      { kunci: 'nomor_rekening', nilai: '1230009876543' },
      { kunci: 'nama_pemilik_rekening', nilai: 'Yayasan Edukasi Teknologi SEVENT X' },
      { kunci: 'qris_path', nilai: 'qris-demo.png' },
    ],
    { onConflict: 'kunci' },
  );
  if (pengErr) throw pengErr;

  await supabase.storage.from('pengaturan').upload('qris-demo.png', DUMMY_PNG, {
    contentType: 'image/png',
    upsert: true,
  });

  // Pastikan 12 soal minat ada (baca dari seed jika kosong)
  const { count: soalCount } = await supabase
    .from('soal_minat')
    .select('id', { count: 'exact', head: true });

  if (!soalCount || soalCount < 12) {
    const soalSeed = [
      {
        urutan: 1,
        teks: 'Saat ada waktu luang di depan komputer, kamu paling suka…',
        opsi: [
          { kode: 'A', teks: 'Membuat website atau aplikasi kecil', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Mengotak-atik pengaturan Wi-Fi dan koneksi internet', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Merakit atau memprogram alat seperti lampu otomatis', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Mencari pola dari data, misalnya statistik game favorit', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 2,
        teks: 'Jika sekolahmu mengadakan proyek teknologi, peran mana yang paling ingin kamu ambil?',
        opsi: [
          { kode: 'A', teks: 'Merancang tampilan dan alur fitur aplikasi untuk pengguna', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Memastikan semua perangkat terhubung lancar ke server sekolah', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Menghubungkan sensor suhu dan gerak ke papan mikrokontroler', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Mengolah hasil survei siswa menjadi grafik dan prediksi', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 3,
        teks: 'Masalah sehari-hari mana yang paling membuatmu tertantang untuk menyelesaikannya?',
        opsi: [
          { kode: 'A', teks: 'Aplikasi antrean kantin yang lambat dan membingungkan', software: 3, jaringan: 0, iot: 0, ai_data: 1 },
          { kode: 'B', teks: 'Jaringan internet rumah yang sering putus atau lambat', software: 0, jaringan: 3, iot: 1, ai_data: 0 },
          { kode: 'C', teks: 'Tanaman di rumah layu karena lupa disiram saat bepergian', software: 1, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Sulit memilih topik belajar yang paling efektif dari nilai ujian', software: 0, jaringan: 1, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 4,
        teks: 'Video atau tutorial teknologi apa yang paling sering menarik perhatianmu di media sosial?',
        opsi: [
          { kode: 'A', teks: 'Cara membuat game atau aplikasi mobile dari nol', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Cara kerja peretas (hacker) etis menjaga keamanan sistem', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Eksperimen robot mini atau smart home dengan Arduino/ESP32', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Bagaimana kecerdasan buatan (AI) mengenali gambar atau suara', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 5,
        teks: 'Ketika belajar hal baru di bidang teknologi, metode mana yang paling membuatmu bersemangat?',
        opsi: [
          { kode: 'A', teks: 'Menulis kode baris demi baris sampai fitur berjalan di layar', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Menguji jalur koneksi data dan menganalisis paket jaringan', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Menyambungkan kabel, resistor, LED, dan melihatnya menyala sesuai kode', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Melatih komputer menebak hasil berdasarkan kumpulan contoh data', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 6,
        teks: 'Bayangkan kamu bekerja di tim pembuat mobil pintar tanpa pengemudi. Bagian mana yang paling seru menurutmu?',
        opsi: [
          { kode: 'A', teks: 'Membuat layar dasbor navigasi yang dipakai penumpang', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Mengatur komunikasi data antara mobil dan server lalu lintas secara aman', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Mengatur sensor jarak, kamera, dan motor penggerak roda', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Melatih sistem agar mobil bisa mengenali rambu jalan dan pejalan kaki', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 7,
        teks: 'Jika sebuah aplikasi populer tiba-tiba bermasalah, apa hal pertama yang paling membuatmu penasaran?',
        opsi: [
          { kode: 'A', teks: 'Apakah ada kesalahan logika (bug) pada kode programnya?', software: 3, jaringan: 1, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Apakah servernya kelebihan beban atau ada serangan jaringan?', software: 0, jaringan: 3, iot: 0, ai_data: 1 },
          { kode: 'C', teks: 'Apakah perangkat keras atau sensor pengirim sinyalnya terputus?', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Apakah data masukan yang diproses sistemnya salah format?', software: 1, jaringan: 0, iot: 1, ai_data: 3 },
        ],
      },
      {
        urutan: 8,
        teks: 'Mata pelajaran atau topik sekolah mana yang paling sering terasa nyambung dengan caramu berpikir?',
        opsi: [
          { kode: 'A', teks: 'Membuat alur langkah (algoritma) yang rapi dan terstruktur', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Memahami sistem komunikasi, protokol, dan keamanan data', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Fisika listrik, rangkaian elektronik, dan cara kerja mesin', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Matematika statistika, peluang, dan membaca tren dari angka', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 9,
        teks: 'Di akhir pekan, kamu diberi satu paket proyek IT. Proyek mana yang langsung ingin kamu buka duluan?',
        opsi: [
          { kode: 'A', teks: 'Membangun website catatan tugas sekolah yang bisa diakses teman sekelas', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Membangun jaringan lokal (LAN) mini dan memblokir situs berbahaya', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Membuat tempat sampah pintar yang otomatis terbuka saat tangan mendekat', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Membuat program yang merekomendasikan film berdasarkan riwayat tontonan', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 10,
        teks: 'Alat atau lingkungan kerja mana yang paling membuatmu betah berlama-lama?',
        opsi: [
          { kode: 'A', teks: 'Editor kode untuk membangun tampilan dan logika aplikasi', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Terminal jaringan dan diagram topologi koneksi antar server', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Meja eksperimen berisi mikrokontroler, kabel jumper, dan simulator alat', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Notebook analisis data berisi tabel angka, grafik, dan model prediksi', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 11,
        teks: 'Saat kamu bermain game online bersama teman, hal teknis apa yang paling menarik perhatianmu?',
        opsi: [
          { kode: 'A', teks: 'Desain menu, sistem inventori, dan logika mekanik permainannya', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Bagaimana server menghubungkan jutaan pemain tanpa lag (ping kecil)', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Bagaimana controller atau perangkat VR mengirim getaran dan sensor gerak', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Bagaimana bot lawan (AI) belajar membaca strategi permainan kita', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
      {
        urutan: 12,
        teks: 'Lima tahun lagi, pencapaian kerja mana yang paling membuatmu bangga?',
        opsi: [
          { kode: 'A', teks: 'Aplikasi buatanku dipakai ratusan ribu pelajar di Indonesia', software: 3, jaringan: 0, iot: 0, ai_data: 0 },
          { kode: 'B', teks: 'Infrastruktur jaringan dan pertahanan siber perusahaan aman karena rancangan timku', software: 0, jaringan: 3, iot: 0, ai_data: 0 },
          { kode: 'C', teks: 'Alat pintar hasil rancanganku membantu petani atau rumah sakit bekerja otomatis', software: 0, jaringan: 0, iot: 3, ai_data: 0 },
          { kode: 'D', teks: 'Model data dan AI buatanku membantu mengambil keputusan penting secara akurat', software: 0, jaringan: 0, iot: 0, ai_data: 3 },
        ],
      },
    ];

    const { error: soalErr } = await supabase
      .from('soal_minat')
      .upsert(soalSeed as unknown as Database['public']['Tables']['soal_minat']['Insert'][], {
        onConflict: 'urutan',
      });
    if (soalErr) throw soalErr;
  }

  // Pastikan playbook sesi 1-4 setiap program tersinkron dari docs/konten/playbook
  const playbookDir = path.resolve(__dirname, '../../docs/konten/playbook');
  const playbookFiles: Array<{
    file: string;
    program_id: string;
    level: number;
    nomor_sesi: number;
    judul: string;
    starter_url: string | null;
    konten_md?: string;
  }> = [
    {
      file: 'coding-dasar-l1-s1.md',
      program_id: PROGRAM_IDS.codingDasar,
      level: 1,
      nomor_sesi: 1,
      judul: 'Coding Dasar Sesi 1: Logika Urutan & Karakter Scratch',
      starter_url: 'https://scratch.mit.edu/projects/editor/',
    },
    {
      file: 'coding-dasar-l1-s2.md',
      program_id: PROGRAM_IDS.codingDasar,
      level: 1,
      nomor_sesi: 2,
      judul: 'Coding Dasar Sesi 2: Perulangan (Loop) & Animasi',
      starter_url: 'https://scratch.mit.edu/projects/editor/',
    },
    {
      file: 'coding-dasar-l1-s3.md',
      program_id: PROGRAM_IDS.codingDasar,
      level: 1,
      nomor_sesi: 3,
      judul: 'Coding Dasar Sesi 3: Percabangan Kondisi (If-Then) & Kontrol Keyboard',
      starter_url: 'https://scratch.mit.edu/projects/editor/',
    },
    {
      file: 'coding-dasar-l1-s4.md',
      program_id: PROGRAM_IDS.codingDasar,
      level: 1,
      nomor_sesi: 4,
      judul: 'Coding Dasar Sesi 4: Variabel Skor & Game Mini Interaktif',
      starter_url: 'https://scratch.mit.edu/projects/editor/',
    },
    {
      file: 'kelas-reguler-l1-s1.md',
      program_id: PROGRAM_IDS.kelasReguler,
      level: 1,
      nomor_sesi: 1,
      judul: 'Kelas Reguler Teknologi Sesi 1: Fondasi Struktur Web HTML5',
      starter_url: 'https://codesandbox.io/s/vanilla',
    },
    {
      file: 'kelas-reguler-l1-s2.md',
      program_id: PROGRAM_IDS.kelasReguler,
      level: 1,
      nomor_sesi: 2,
      judul: 'Kelas Reguler Teknologi Sesi 2: Styling Modern dengan CSS & Flexbox',
      starter_url: 'https://codesandbox.io/s/vanilla',
    },
    {
      file: 'kelas-reguler-l1-s3.md',
      program_id: PROGRAM_IDS.kelasReguler,
      level: 1,
      nomor_sesi: 3,
      judul: 'Kelas Reguler Teknologi Sesi 3: Interaktivitas Web dengan JavaScript & DOM',
      starter_url: 'https://codesandbox.io/s/vanilla',
    },
    {
      file: 'kelas-reguler-l1-s4.md',
      program_id: PROGRAM_IDS.kelasReguler,
      level: 1,
      nomor_sesi: 4,
      judul: 'Kelas Reguler Teknologi Sesi 4: Simulasi IoT Virtual & Pengenalan AI Dasar',
      starter_url: 'https://wokwi.com/',
    },
    {
      file: 'simulasi-jurusan-it-l1-s1.md',
      program_id: PROGRAM_IDS.simulasiIt,
      level: 1,
      nomor_sesi: 1,
      judul: 'Simulasi Jurusan IT Sesi 1: Software Engineering',
      starter_url: 'https://codesandbox.io/s/vanilla',
    },
    {
      file: 'simulasi-jurusan-it-l1-s2.md',
      program_id: PROGRAM_IDS.simulasiIt,
      level: 1,
      nomor_sesi: 2,
      judul: 'Simulasi Jurusan IT Sesi 2: Jaringan Komputer & Keamanan Siber',
      starter_url: 'https://www.packettracernetwork.com/',
    },
    {
      file: 'simulasi-jurusan-it-l1-s3.md',
      program_id: PROGRAM_IDS.simulasiIt,
      level: 1,
      nomor_sesi: 3,
      judul: 'Simulasi Jurusan IT Sesi 3: Internet of Things (IoT) Virtual',
      starter_url: 'https://wokwi.com/',
    },
    {
      file: 'simulasi-jurusan-it-l1-s4.md',
      program_id: PROGRAM_IDS.simulasiIt,
      level: 1,
      nomor_sesi: 4,
      judul: 'Simulasi Jurusan IT Sesi 4: AI & Sains Data + Rapor Jurusan',
      starter_url: 'https://colab.research.google.com/',
    },
    {
      file: 'kenal-komputer-l1-s1.md',
      program_id: PROGRAM_IDS.kenalKomputer,
      level: 1,
      nomor_sesi: 1,
      judul: 'Kenal Komputer Sesi 1: Mouse, Keyboard, dan Layar',
      starter_url: null,
      konten_md: `## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengenal layar monitor, mouse, dan keyboard dengan posisi duduk yang nyaman.
2. Melakukan gerakan mouse, klik kiri, klik dua kali, dan klik-seret di Paint.

## Persiapan pengajar
- Pastikan orang tua mendampingi anak di samping perangkat pada awal kelas.
- Siapkan contoh gambar rumah sederhana di Paint.

## Alur kelas (45 menit)
- **00–07 Pembukaan:** Sapa anak dan orang tua, periksa layar serta posisi tangan di mouse.
- **07–25 Praktik terpandu:** Buka aplikasi Paint, pilih kuas dan warna, latih klik-seret membentuk garis dan lingkaran.
- **25–38 Tantangan:** Anak mewarnai bentuk matahari dan rumah dengan minimal 3 warna berbeda.
- **38–45 Penutup:** Anak memamerkan gambar di layar; apresiasi bersama orang tua.

## Tantangan untuk siswa
1. **Dasar:** Gambar satu bentuk rumah atau wajah tersenyum memakai kuas warna favorit di Paint.
2. **Lanjutan:** Isi warna di dalam gambar menggunakan ikon ember cat (*Fill*).

## Kunci jawaban dan solusi umum
- *Warna tumpah ke seluruh layar:* Pastikan bentuk bangun tertutup rapat atau gunakan tombol Undo (\`Ctrl+Z\`).
- *Mouse terasa terlalu cepat:* Minta orang tua membantu memegangi tangan anak perlahan di langkah awal.

## Catatan keamanan
- Kelas anak usia 5–7 tahun wajib didampingi orang tua dan selalu lewat link resmi platform.`,
    },
    {
      file: 'kenal-komputer-l1-s2.md',
      program_id: PROGRAM_IDS.kenalKomputer,
      level: 1,
      nomor_sesi: 2,
      judul: 'Kenal Komputer Sesi 2: Desktop, Ikon, dan Jendela',
      starter_url: null,
      konten_md: `## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengenali tampilan Desktop, menu Start, dan ikon aplikasi.
2. Membuka, memperbesar, mengecilkan, memindahkan, dan menutup jendela aplikasi.

## Persiapan pengajar
- Siapkan 3 aplikasi bawaan (Paint, Notepad, Kalkulator) untuk simulasi buka-tutup.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Ulas klik dan klik dua kali dari sesi 1.
- **06–25 Praktik terpandu:** Membuka menu Start, mengenali tombol minimalkan (\`_\`), maksimalkan (\`□\`), dan tutup (\`×\`).
- **25–38 Tantangan:** Anak membuka Paint dan Kalkulator bersamaan lalu menatanya berdampingan.
- **38–45 Penutup:** Rangkuman fungsi tombol jendela dan pratinjau folder di sesi 3.

## Tantangan untuk siswa
1. **Dasar:** Buka aplikasi Notepad lewat menu Start, lalu kecilkan dan besarkan lagi jendelanya.
2. **Lanjutan:** Susun jendela Paint di sebelah kiri dan Notepad di sebelah kanan.

## Kunci jawaban dan solusi umum
- *Jendela hilang ke bawah:* Arahkan anak melihat ikon aplikasi yang menyala di taskbar bawah.

## Catatan keamanan
- Pastikan orang tua mendampingi saat menavigasi menu sistem agar tidak menutup jendela Meet secara tidak sengaja.`,
    },
    {
      file: 'kenal-komputer-l1-s3.md',
      program_id: PROGRAM_IDS.kenalKomputer,
      level: 1,
      nomor_sesi: 3,
      judul: 'Kenal Komputer Sesi 3: Folder dan File Karyaku',
      starter_url: null,
      konten_md: `## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Memahami konsep folder sebagai "rumah" tempat menyimpan file karya.
2. Membuat folder bernama \`Karyaku\` dan menyimpan gambar Paint ke dalamnya.

## Persiapan pengajar
- Siapkan contoh folder rapi di Desktop untuk demonstrasi *File Explorer*.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Analogi lemari map dan laci penyimpanan untuk mengenalkan folder dan file.
- **06–25 Praktik terpandu:** Klik kanan di Desktop/Dokumen untuk membuat folder \`Karyaku\`, lalu simpan file gambar ke folder itu.
- **25–38 Tantangan:** Anak membuat satu gambar baru, menyimpannya dengan nama sendiri di folder \`Karyaku\`, lalu membukanya kembali.
- **38–45 Penutup:** Apresiasi anak karena sudah bisa merapikan karyanya sendiri.

## Tantangan untuk siswa
1. **Dasar:** Buat folder bernama \`Karyaku\` dan simpan minimal 1 gambar di dalamnya.
2. **Lanjutan:** Salin satu gambar ke folder tersebut atau ubah namanya menjadi \`gambar-aku\`.

## Kunci jawaban dan solusi umum
- *Lupa lokasi menyimpan file:* Cek bilah lokasi paling kiri di jendela Save As (\`Desktop\` atau \`Documents\`).

## Catatan keamanan
- Ingatkan anak hanya menghapus atau memindahkan file karyanya sendiri di folder \`Karyaku\`, jangan menyentuh folder sistem.`,
    },
    {
      file: 'kenal-komputer-l1-s4.md',
      program_id: PROGRAM_IDS.kenalKomputer,
      level: 1,
      nomor_sesi: 4,
      judul: 'Kenal Komputer Sesi 4: Mengetik Nama & Aman di Internet',
      starter_url: null,
      konten_md: `## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengetik huruf kapital, spasi, dan angka di keyboard untuk membuat kartu nama digital di Notepad/Paint.
2. Memahami aturan dasar aman berinternet bersama orang tua.

## Persiapan pengajar
- Siapkan ilustrasi lampu hijau/merah aturan aman internet untuk anak usia dini.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Kenali tombol \`Shift\`, \`Space\`, \`Enter\`, dan \`Backspace\` di keyboard.
- **06–25 Praktik terpandu:** Mengetik nama panggilan, kelas, dan hobi singkat di Notepad/Paint menjadi kartu nama digital.
- **25–37 Tantangan & Keamanan:** Menyimpan kartu nama ke folder \`Karyaku\`, lalu kuis singkat memilih hal yang boleh vs tidak boleh dibagikan online.
- **37–45 Penutup:** Showcase kartu nama karya semua anak; tutup program Kenal Komputer Level 1 bersama orang tua.

## Tantangan untuk siswa
1. **Dasar:** Ketik nama panggilan dan 1 benda/warna kesukaan, lalu simpan di folder \`Karyaku\`.
2. **Lanjutan:** Tambahkan gambar bintang di samping nama menggunakan aplikasi Paint.

## Kunci jawaban dan solusi umum
- *Huruf besar semua terus-menerus:* Cek lampu tombol \`Caps Lock\` dan tekan sekali untuk mematikannya.

## Catatan keamanan
- Tekankan aturan wajib: anak tidak pernah membuka peramban tanpa orang tua dan tidak membagikan alamat rumah, nomor HP, atau foto pribadi di internet.`,
    },
  ];

  for (const pb of playbookFiles) {
    const filePath = path.join(playbookDir, pb.file);
    const konten_md = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : (pb.konten_md ?? `# ${pb.judul}`);
    const { error: pbErr } = await supabase.from('playbook').upsert(
      {
        program_id: pb.program_id,
        level: pb.level,
        nomor_sesi: pb.nomor_sesi,
        judul: pb.judul,
        konten_md,
        starter_url: pb.starter_url,
      },
      { onConflict: 'program_id,level,nomor_sesi' },
    );
    if (pbErr) throw pbErr;
  }
}

async function main() {
  await ensureStaticSeed();

  console.log('2. Membuat akun demo (Admin, Pengajar, Orang Tua, Siswa)...');

  // 2.1 Admin (daftar sementara sebagai orang_tua agar lolos trigger anti-admin, lalu dipromosikan via service_role)
  const adminId = await ensureAuthUser({
    email: 'admin@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: { peran: 'orang_tua', nama: 'Admin Platform SEVENT X' },
  });
  const { error: adminPromoErr } = await supabase.from('pengguna').upsert(
    {
      id: adminId,
      peran: 'admin',
      nama: 'Admin Platform SEVENT X',
      no_wa: '081100000001',
      status: 'aktif',
    },
    { onConflict: 'id' },
  );
  if (adminPromoErr) throw adminPromoErr;
  await supabase.auth.admin.updateUserById(adminId, {
    user_metadata: { peran: 'admin', nama: 'Admin Platform SEVENT X' },
  });

  // 2.2 Tiga Pengajar Terverifikasi + 1 Pengajar Menunggu Verifikasi
  const pengajar1Id = await ensureAuthUser({
    email: 'pengajar1@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'pengajar',
      nama: 'Nadia Kusuma Putri',
      no_wa: '081211110001',
      status_kerja: 'mahasiswa',
      kampus: 'Institut Teknologi Bandung',
      jurusan: 'Teknik Informatika',
      keahlian: ['software', 'ai_data'],
      cv_url: 'https://example.com/cv-nadia',
    },
  });

  const pengajar2Id = await ensureAuthUser({
    email: 'pengajar2@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'pengajar',
      nama: 'Bagus Pratama Wijaya',
      no_wa: '081211110002',
      status_kerja: 'lulusan',
      kampus: 'Universitas Indonesia',
      jurusan: 'Teknik Komputer',
      keahlian: ['jaringan', 'iot'],
      cv_url: 'https://example.com/cv-bagus',
    },
  });

  const pengajar3Id = await ensureAuthUser({
    email: 'pengajar3@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'pengajar',
      nama: 'Citra Lestari Handayani',
      no_wa: '081211110003',
      status_kerja: 'mahasiswa',
      kampus: 'Universitas Gadjah Mada',
      jurusan: 'Ilmu Komputer',
      keahlian: ['software', 'iot'],
      cv_url: 'https://example.com/cv-citra',
    },
  });

  const pengajarPendingId = await ensureAuthUser({
    email: 'pengajar.baru@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'pengajar',
      nama: 'Dimas Putra Mahendra',
      no_wa: '081211110004',
      status_kerja: 'pencari_kerja',
      kampus: 'Institut Teknologi Sepuluh Nopember',
      jurusan: 'Sistem Informasi',
      keahlian: ['software', 'jaringan'],
      cv_url: 'https://example.com/cv-dimas',
    },
  });

  // Upload dokumen dummy pengajar ke storage agar admin bisa melihat/menguji verifikasi
  for (const pid of [pengajar1Id, pengajar2Id, pengajar3Id, pengajarPendingId]) {
    await supabase.storage
      .from('dokumen-pengajar')
      .upload(`${pid}/ktp-demo.png`, DUMMY_PNG, { contentType: 'image/png', upsert: true });
    await supabase.storage
      .from('dokumen-pengajar')
      .upload(`${pid}/skck-demo.png`, DUMMY_PNG, { contentType: 'image/png', upsert: true });
    await supabase.storage
      .from('foto-pengajar')
      .upload(`${pid}/avatar-demo.png`, DUMMY_PNG, { contentType: 'image/png', upsert: true });
  }

  const bioPengajar: Record<string, string> = {
    [pengajar1Id]:
      'Mahasiswa tingkat akhir Teknik Informatika ITB yang aktif membimbing proyek web & AI tingkat pemula. Gaya mengajar terstruktur berbasis analogi sehari-hari dan demo langsung sebelum praktik.',
    [pengajar2Id]:
      'Lulusan Teknik Komputer UI yang fokus di bidang jaringan komputer dan Internet of Things. Suka mengajak siswa memecahkan kasus nyata serta debugging bareng dengan sabar.',
    [pengajar3Id]:
      'Mahasiswa Ilmu Komputer UGM yang berpengalaman mengenalkan berpikir komputasional ke siswa SD melalui storytelling, game visual Scratch, dan eksperimen interaktif.',
    [pengajarPendingId]:
      'Lulusan Sistem Informasi ITS dengan pengalaman mentoring hackathon pelajar SMA dan penyusunan arsitektur aplikasi web modern.',
  };

  const slugPengajar: Record<string, string> = {
    [pengajar1Id]: 'nadia-kusuma-putri',
    [pengajar2Id]: 'bagus-pratama-wijaya',
    [pengajar3Id]: 'citra-lestari-handayani',
    [pengajarPendingId]: 'dimas-putra-mahendra',
  };

  for (const [pid, progs] of [
    [pengajar1Id, [PROGRAM_IDS.kelasReguler, PROGRAM_IDS.simulasiIt]],
    [pengajar2Id, [PROGRAM_IDS.kelasReguler, PROGRAM_IDS.simulasiIt]],
    [pengajar3Id, [PROGRAM_IDS.kenalKomputer, PROGRAM_IDS.codingDasar, PROGRAM_IDS.kelasReguler]],
  ] as Array<[string, string[]]>) {
    await supabase.from('pengguna').update({ status: 'terverifikasi' }).eq('id', pid);
    await supabase
      .from('profil_pengajar')
      .update({
        foto_path: `${pid}/avatar-demo.png`,
        identitas_path: `${pid}/ktp-demo.png`,
        skck_path: `${pid}/skck-demo.png`,
        wawancara_selesai: true,
        diverifikasi_pada: new Date().toISOString(),
        diverifikasi_oleh: adminId,
        bio: bioPengajar[pid],
        slug: slugPengajar[pid],
      })
      .eq('pengguna_id', pid);

    for (const progId of progs) {
      await supabase
        .from('pengajar_program')
        .upsert({ pengajar_id: pid, program_id: progId, disetujui: true });
    }
  }

  // Kode referral, pengalaman, dan sertifikat pengajar terverifikasi
  await supabase.from('kode_referral').upsert(
    [
      { pengajar_id: pengajar1Id, kode: 'NADIA-K7Q2' },
      { pengajar_id: pengajar2Id, kode: 'BAGUS-M4P9' },
      { pengajar_id: pengajar3Id, kode: 'CITRA-T8R3' },
    ],
    { onConflict: 'pengajar_id' },
  );

  await supabase.from('pengalaman_pengajar').upsert(
    [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
        pengajar_id: pengajar1Id,
        peran: 'Mentor Frontend & AI Pemula',
        tempat: 'Komunitas EduTech Bandung',
        periode: '2024 – Sekarang',
        deskripsi: 'Membimbing siswa SMP/SMA membangun proyek web interaktif dan eksperimen klasifikasi teks.',
        urutan: 1,
      },
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
        pengajar_id: pengajar1Id,
        peran: 'Asisten Praktikum Dasar Pemrograman',
        tempat: 'STEI ITB',
        periode: '2023 – 2024',
        deskripsi: 'Mendampingi sesi laboratorium algoritma dan debugging bagi mahasiswa tingkat awal.',
        urutan: 2,
      },
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
        pengajar_id: pengajar2Id,
        peran: 'Fasilitator Jaringan & IoT Remaja',
        tempat: 'MakerSpace Jakarta',
        periode: '2023 – Sekarang',
        deskripsi: 'Mengajar simulasi sensor ESP32 di Wokwi dan keamanan dasar internet.',
        urutan: 1,
      },
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000004',
        pengajar_id: pengajar3Id,
        peran: 'Pengajar Coding Anak & Literasi Digital',
        tempat: 'Klub Kreator Cilik Yogyakarta',
        periode: '2023 – Sekarang',
        deskripsi: 'Membimbing anak TK–SD mengenal komputer dasar dan game logika Scratch dengan ramah.',
        urutan: 1,
      },
    ],
    { onConflict: 'id' },
  );

  await supabase.from('sertifikat_pengajar').upsert(
    [
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
        pengajar_id: pengajar1Id,
        nama: 'Belajar Pengembangan Web & JavaScript Modern',
        penerbit: 'Dicoding Indonesia',
        tahun: 2024,
        tautan: 'https://www.dicoding.com/',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000002',
        pengajar_id: pengajar1Id,
        nama: 'AI Fundamentals for Educators',
        penerbit: 'Google Cloud Skills Boost',
        tahun: 2025,
        tautan: 'https://www.cloudskillsboost.google/',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000003',
        pengajar_id: pengajar2Id,
        nama: 'CCNA: Introduction to Networks & IoT',
        penerbit: 'Cisco Networking Academy',
        tahun: 2023,
        tautan: 'https://www.netacad.com/',
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000004',
        pengajar_id: pengajar3Id,
        nama: 'Creative Computing with Scratch',
        penerbit: 'Harvard Graduate School of Education',
        tahun: 2024,
        tautan: 'https://scratched.gse.harvard.edu/',
      },
    ],
    { onConflict: 'id' },
  );

  await supabase
    .from('profil_pengajar')
    .update({
      foto_path: `${pengajarPendingId}/avatar-demo.png`,
      identitas_path: `${pengajarPendingId}/ktp-demo.png`,
      skck_path: `${pengajarPendingId}/skck-demo.png`,
      wawancara_selesai: false,
      bio: bioPengajar[pengajarPendingId],
      slug: slugPengajar[pengajarPendingId],
    })
    .eq('pengguna_id', pengajarPendingId);
  await supabase.from('pengajar_program').upsert({
    pengajar_id: pengajarPendingId,
    program_id: PROGRAM_IDS.kelasReguler,
    disetujui: false,
  });

  // 2.3 Dua Orang Tua + 3 Profil Anak (termasuk 1 SD) + 2 Siswa Mandiri
  const ortu1Id = await ensureAuthUser({
    email: 'ortu1@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: { peran: 'orang_tua', nama: 'Ratna Sari Dewi', no_wa: '081322220001' },
  });
  const ortu2Id = await ensureAuthUser({
    email: 'ortu2@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: { peran: 'orang_tua', nama: 'Hendra Wijaya', no_wa: '081322220002' },
  });

  const siswaAktifUserId = await ensureAuthUser({
    email: 'siswa.aktif@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'siswa',
      nama: 'Fajar Nugroho',
      no_wa: '081533330001',
      tanggal_lahir: '2009-05-14',
      jenjang: 'SMA',
      kelas: 11,
      sekolah: 'SMAN 3 Bandung',
      nama_orang_tua: 'Ratna Sari Dewi',
      email_orang_tua: 'ortu1@seventx.id',
    },
  });
  await supabase.from('pengguna').update({ status: 'aktif' }).eq('id', siswaAktifUserId);
  await supabase.from('siswa').update({ orang_tua_id: ortu1Id }).eq('pengguna_id', siswaAktifUserId);

  const siswaPendingUserId = await ensureAuthUser({
    email: 'siswa.baru@seventx.id',
    password: DEMO_PASSWORD,
    user_metadata: {
      peran: 'siswa',
      nama: 'Laras Putri Kinanti',
      no_wa: '081533330002',
      tanggal_lahir: '2011-08-21',
      jenjang: 'SMP',
      kelas: 9,
      sekolah: 'SMPN 5 Yogyakarta',
      nama_orang_tua: 'Hendra Wijaya',
      email_orang_tua: 'ortu2@seventx.id',
    },
  });

  const { data: siswaAktifRow } = await supabase
    .from('siswa')
    .select('id')
    .eq('pengguna_id', siswaAktifUserId)
    .single();
  const { data: siswaPendingRow } = await supabase
    .from('siswa')
    .select('id')
    .eq('pengguna_id', siswaPendingUserId)
    .single();

  if (!siswaAktifRow || !siswaPendingRow) {
    throw new Error('Gagal menemukan baris siswa mandiri setelah registrasi.');
  }

  // 4 Profil anak tanpa akun login (termasuk 1 TK dan 1 SD)
  const anakIds = {
    bimaSd: '33333333-3333-4333-8333-000000000001',
    sintaSmp: '33333333-3333-4333-8333-000000000002',
    rakaSma: '33333333-3333-4333-8333-000000000003',
    kiranaTk: '33333333-3333-4333-8333-000000000004',
  };

  await supabase.from('siswa').upsert(
    [
      {
        id: anakIds.bimaSd,
        nama: 'Bima Aditya',
        tanggal_lahir: '2015-03-10',
        jenjang: 'SD',
        kelas: 5,
        sekolah: 'SDN Percobaan 1',
        orang_tua_id: ortu1Id,
      },
      {
        id: anakIds.sintaSmp,
        nama: 'Sinta Maharani',
        tanggal_lahir: '2012-11-02',
        jenjang: 'SMP',
        kelas: 8,
        sekolah: 'SMPN 2 Surabaya',
        orang_tua_id: ortu1Id,
      },
      {
        id: anakIds.rakaSma,
        nama: 'Raka Pratama',
        tanggal_lahir: '2009-09-18',
        jenjang: 'SMA',
        kelas: 11,
        sekolah: 'SMAN 1 Bekasi',
        orang_tua_id: ortu2Id,
      },
      {
        id: anakIds.kiranaTk,
        nama: 'Kirana Putri',
        tanggal_lahir: '2020-04-12',
        jenjang: 'TK',
        kelas: 0,
        sekolah: 'TK Pelita Harapan',
        orang_tua_id: ortu2Id,
      },
    ],
    { onConflict: 'id' },
  );

  // --------------------------------------------------------------------------
  // 3. TUJUH KELAS & 28 SESI (termasuk Kenal Komputer, kelas penuh & selesai)
  // --------------------------------------------------------------------------
  console.log('3. Membuat 7 kelas demo beserta 28 sesi...');

  const kelasSeeds: Array<{
    id: string;
    sesiUuidPrefix: string;
    program_id: string;
    pengajar_id: string;
    kapasitas: number;
    jam_mulai: string;
    status: Database['public']['Enums']['status_kelas'];
    startDaysOffset: number;
    hourWib: number;
    minuteWib: number;
    durasi: number;
    sesiSelesaiCount: number;
  }> = [
    {
      id: KELAS_IDS.k1,
      sesiUuidPrefix: '1',
      program_id: PROGRAM_IDS.codingDasar,
      pengajar_id: pengajar3Id,
      kapasitas: 10,
      jam_mulai: '16:00:00',
      status: 'terbuka',
      startDaysOffset: 3,
      hourWib: 16,
      minuteWib: 0,
      durasi: 60,
      sesiSelesaiCount: 0,
    },
    {
      id: KELAS_IDS.k2Penuh,
      sesiUuidPrefix: '2',
      program_id: PROGRAM_IDS.codingDasar,
      pengajar_id: pengajar3Id,
      kapasitas: 1, // Sengaja kapasitas 1 lalu diisi 1 booking -> Penuh di katalog!
      jam_mulai: '10:00:00',
      status: 'terbuka',
      startDaysOffset: 5,
      hourWib: 10,
      minuteWib: 0,
      durasi: 60,
      sesiSelesaiCount: 0,
    },
    {
      id: KELAS_IDS.k3,
      sesiUuidPrefix: '3',
      program_id: PROGRAM_IDS.kelasReguler,
      pengajar_id: pengajar1Id,
      kapasitas: 15,
      jam_mulai: '19:00:00',
      status: 'terbuka',
      startDaysOffset: 2,
      hourWib: 19,
      minuteWib: 0,
      durasi: 90,
      sesiSelesaiCount: 0,
    },
    {
      id: KELAS_IDS.k4,
      sesiUuidPrefix: '4',
      program_id: PROGRAM_IDS.kelasReguler,
      pengajar_id: pengajar2Id,
      kapasitas: 15,
      jam_mulai: '15:30:00',
      status: 'terbuka',
      startDaysOffset: 4,
      hourWib: 15,
      minuteWib: 30,
      durasi: 90,
      sesiSelesaiCount: 0,
    },
    {
      id: KELAS_IDS.k5,
      sesiUuidPrefix: '5',
      program_id: PROGRAM_IDS.simulasiIt,
      pengajar_id: pengajar1Id,
      kapasitas: 15,
      jam_mulai: '19:00:00',
      status: 'terbuka',
      startDaysOffset: 3,
      hourWib: 19,
      minuteWib: 0,
      durasi: 90,
      sesiSelesaiCount: 0,
    },
    {
      id: KELAS_IDS.k6Selesai,
      sesiUuidPrefix: '6',
      program_id: PROGRAM_IDS.simulasiIt,
      pengajar_id: pengajar2Id,
      kapasitas: 15,
      jam_mulai: '19:00:00',
      status: 'selesai',
      startDaysOffset: -28,
      hourWib: 19,
      minuteWib: 0,
      durasi: 90,
      sesiSelesaiCount: 4,
    },
    {
      id: KELAS_IDS.k8Kenal,
      sesiUuidPrefix: '8',
      program_id: PROGRAM_IDS.kenalKomputer,
      pengajar_id: pengajar3Id,
      kapasitas: 6,
      jam_mulai: '09:00:00',
      status: 'terbuka',
      startDaysOffset: 4,
      hourWib: 9,
      minuteWib: 0,
      durasi: 45,
      sesiSelesaiCount: 0,
    },
  ];

  const sesiMap: Record<string, string[]> = {};

  for (const k of kelasSeeds) {
    const { error: kErr } = await supabase.from('kelas').upsert(
      {
        id: k.id,
        program_id: k.program_id,
        pengajar_id: k.pengajar_id,
        level: 1,
        kapasitas: k.kapasitas,
        jam_mulai: k.jam_mulai,
        status: k.status,
      },
      { onConflict: 'id' },
    );
    if (kErr) throw kErr;

    sesiMap[k.id] = [];
    for (let sNum = 1; sNum <= 4; sNum++) {
      const sesiId = `44444444-4444-4444-8444-0000000000${k.sesiUuidPrefix}${sNum}`;
      const mulai = wibDateIso(k.startDaysOffset + (sNum - 1) * 7, k.hourWib, k.minuteWib);
      const selesai = addMinutesIso(mulai, k.durasi);
      const isDone = sNum <= k.sesiSelesaiCount;

      const { error: sErr } = await supabase.from('sesi').upsert(
        {
          id: sesiId,
          kelas_id: k.id,
          nomor: sNum,
          mulai_pada: mulai,
          selesai_pada: selesai,
          status: isDone ? 'selesai' : 'terjadwal',
          meet_uri: isDone ? 'https://meet.google.com/demo-seventx-selesai' : null,
          meet_dibuat_pada: isDone ? mulai : null,
        },
        { onConflict: 'kelas_id,nomor' },
      );
      if (sErr) throw sErr;

      // Ambil id aktual jika sudah ada sebelumnya
      const { data: actualSesi } = await supabase
        .from('sesi')
        .select('id')
        .eq('kelas_id', k.id)
        .eq('nomor', sNum)
        .single();
      sesiMap[k.id].push(actualSesi?.id ?? sesiId);
    }
  }

  // --------------------------------------------------------------------------
  // 4. BOOKING DI SETIAP STATUS + PEMBAYARAN
  // --------------------------------------------------------------------------
  console.log('4. Membuat booking di setiap status, laporan, rapor, rating, dan hasil tes minat...');

  const bookingSeeds: Array<{
    id: string;
    kode: string;
    kelas_id: string;
    siswa_id: string;
    dibuat_oleh: string;
    status: Database['public']['Enums']['status_booking'];
    total: number;
    batasOffsetHours: number;
  }> = [
    {
      id: '55555555-5555-4555-8555-000000000001',
      kode: 'BK-20261123-0001',
      kelas_id: KELAS_IDS.k1,
      siswa_id: anakIds.bimaSd,
      dibuat_oleh: ortu1Id,
      status: 'menunggu_pembayaran',
      total: 250000,
      batasOffsetHours: 24,
    },
    {
      id: '55555555-5555-4555-8555-000000000002',
      kode: 'BK-20261123-0002',
      kelas_id: KELAS_IDS.k2Penuh,
      siswa_id: anakIds.bimaSd,
      dibuat_oleh: ortu1Id,
      status: 'terkonfirmasi',
      total: 250000,
      batasOffsetHours: 24,
    },
    {
      id: '55555555-5555-4555-8555-000000000003',
      kode: 'BK-20261123-0003',
      kelas_id: KELAS_IDS.k3,
      siswa_id: anakIds.sintaSmp,
      dibuat_oleh: ortu1Id,
      status: 'menunggu_verifikasi',
      total: 350000,
      batasOffsetHours: 20,
    },
    {
      id: '55555555-5555-4555-8555-000000000004',
      kode: 'BK-20261123-0004',
      kelas_id: KELAS_IDS.k4,
      siswa_id: siswaAktifRow.id,
      dibuat_oleh: siswaAktifUserId,
      status: 'kedaluwarsa',
      total: 350000,
      batasOffsetHours: -12,
    },
    {
      id: '55555555-5555-4555-8555-000000000005',
      kode: 'BK-20261123-0005',
      kelas_id: KELAS_IDS.k5,
      siswa_id: anakIds.rakaSma,
      dibuat_oleh: ortu2Id,
      status: 'dibatalkan',
      total: 400000,
      batasOffsetHours: 24,
    },
    {
      id: '55555555-5555-4555-8555-000000000006',
      kode: 'BK-20261123-0006',
      kelas_id: KELAS_IDS.k6Selesai,
      siswa_id: siswaAktifRow.id,
      dibuat_oleh: siswaAktifUserId,
      status: 'selesai',
      total: 400000,
      batasOffsetHours: -600,
    },
    {
      id: '55555555-5555-4555-8555-000000000007',
      kode: 'BK-20261123-0007',
      kelas_id: KELAS_IDS.k6Selesai,
      siswa_id: anakIds.rakaSma,
      dibuat_oleh: ortu2Id,
      status: 'selesai',
      total: 400000,
      batasOffsetHours: -600,
    },
  ];

  for (const b of bookingSeeds) {
    const batas = new Date(Date.now() + b.batasOffsetHours * 3600 * 1000).toISOString();
    const { error: bErr } = await supabase.from('booking').upsert(
      {
        id: b.id,
        kode: b.kode,
        kelas_id: b.kelas_id,
        siswa_id: b.siswa_id,
        dibuat_oleh: b.dibuat_oleh,
        status: b.status,
        total: b.total,
        batas_bayar_pada: batas,
      },
      { onConflict: 'kode' },
    );
    if (bErr) throw bErr;
  }

  // Bukti bayar dummy + pembayaran untuk booking menunggu_verifikasi & terkonfirmasi
  await supabase.storage
    .from('bukti-bayar')
    .upload('55555555-5555-4555-8555-000000000003/bukti-demo.png', DUMMY_PNG, {
      contentType: 'image/png',
      upsert: true,
    });

  await supabase.from('pembayaran').upsert(
    [
      {
        id: '66666666-6666-4666-8666-000000000001',
        booking_id: '55555555-5555-4555-8555-000000000003',
        bukti_path: '55555555-5555-4555-8555-000000000003/bukti-demo.png',
        status: 'menunggu',
      },
      {
        id: '66666666-6666-4666-8666-000000000002',
        booking_id: '55555555-5555-4555-8555-000000000002',
        bukti_path: '55555555-5555-4555-8555-000000000002/bukti-demo.png',
        status: 'disetujui',
        diverifikasi_oleh: adminId,
        diverifikasi_pada: new Date().toISOString(),
      },
    ],
    { onConflict: 'id' },
  );

  // --------------------------------------------------------------------------
  // 5. LAPORAN SESI, RAPOR JURUSAN, HONOR, RATING (>=3), HASIL MINAT
  // --------------------------------------------------------------------------
  const sesiK6_1 = sesiMap[KELAS_IDS.k6Selesai][0];
  const sesiK6_2 = sesiMap[KELAS_IDS.k6Selesai][1];
  const sesiK6_4 = sesiMap[KELAS_IDS.k6Selesai][3];

  const laporanSesi4Id = '77777777-7777-4777-8777-000000000004';
  await supabase.from('laporan_sesi').upsert(
    {
      id: laporanSesi4Id,
      sesi_id: sesiK6_4,
      pengajar_id: pengajar2Id,
      ringkasan:
        'Siswa menyelesaikan proyek integrasi AI dan melakukan refleksi keempat bidang IT sepanjang program simulasi.',
      rekaman_url: null,
      kendala: null,
    },
    { onConflict: 'sesi_id' },
  );

  await supabase.from('laporan_siswa').upsert(
    [
      {
        laporan_sesi_id: laporanSesi4Id,
        siswa_id: siswaAktifRow.id,
        hadir: true,
        catatan:
          'Fajar sangat antusias merancang logika API dan analisis data; siap mendalami Software Engineering atau AI.',
        karya_url: 'https://codesandbox.io/s/demo-fajar-ai',
      },
      {
        laporan_sesi_id: laporanSesi4Id,
        siswa_id: anakIds.rakaSma,
        hadir: true,
        catatan:
          'Raka menonjol saat sesi jaringan komputer dan simulasi sensor IoT dengan Wokwi.',
        karya_url: 'https://wokwi.com/projects/demo-raka-iot',
      },
    ],
    { onConflict: 'laporan_sesi_id,siswa_id' },
  );

  await supabase.from('honor').upsert(
    {
      pengajar_id: pengajar2Id,
      sesi_id: sesiK6_4,
      jumlah: 60000,
      status: 'belum_dibayar',
    },
    { onConflict: 'sesi_id' },
  );

  await supabase.from('hasil_minat').upsert(
    {
      id: '88888888-8888-4888-8888-000000000001',
      siswa_id: siswaAktifRow.id,
      dikerjakan_oleh: siswaAktifUserId,
      jawaban: { '1': 'A', '2': 'A', '3': 'A', '4': 'D', '5': 'A', '6': 'A', '7': 'A', '8': 'A', '9': 'A', '10': 'A', '11': 'D', '12': 'A' } as Json,
      skor: { software: 78, jaringan: 6, iot: 0, ai_data: 16 } as Json,
      bidang_teratas: 'software',
    },
    { onConflict: 'id' },
  );

  await supabase.from('rapor_jurusan').upsert(
    [
      {
        sesi_id: sesiK6_4,
        siswa_id: siswaAktifRow.id,
        skor_software: 5,
        skor_jaringan: 3,
        skor_iot: 3,
        skor_ai_data: 4,
        bidang_rekomendasi: 'software',
        alasan:
          'Selama 4 sesi simulasi, Fajar paling cepat memahami struktur kode, debugging logika aplikasi, dan integrasi API dibanding sesi perangkat keras.',
        saran:
          'Lanjutkan ke Kelas Reguler Teknologi Level 2 atau ikuti proyek web kolaboratif untuk memperkuat portofolio menuju jurusan Informatika / RPL.',
      },
      {
        sesi_id: sesiK6_4,
        siswa_id: anakIds.rakaSma,
        skor_software: 3,
        skor_jaringan: 5,
        skor_iot: 5,
        skor_ai_data: 3,
        bidang_rekomendasi: 'iot',
        alasan:
          'Selama 4 sesi simulasi, Raka sangat menonjol pada arsitektur jaringan komputer, logika perangkat keras, dan simulasi sensor IoT dengan Wokwi.',
        saran:
          'Pertimbangkan jalur Teknik Komputer, Teknik Elektro, atau Sistem Tertanam/IoT sambil terus mengasah proyek mikrokontroler dan otomasi.',
      },
    ],
    { onConflict: 'sesi_id,siswa_id' },
  );

  // 3 rating untuk pengajar2 agar rata-rata rating tampil di pengajar_publik
  await supabase.from('rating').upsert(
    [
      {
        sesi_id: sesiK6_1,
        siswa_id: siswaAktifRow.id,
        pemberi_id: siswaAktifUserId,
        bintang: 5,
        komentar: 'Penjelasan Jaringan dan IoT sangat mudah dipahami!',
      },
      {
        sesi_id: sesiK6_2,
        siswa_id: siswaAktifRow.id,
        pemberi_id: siswaAktifUserId,
        bintang: 5,
        komentar: 'Praktik langsungnya seru banget.',
      },
      {
        sesi_id: sesiK6_4,
        siswa_id: anakIds.rakaSma,
        pemberi_id: ortu2Id,
        bintang: 4,
        komentar: 'Rapor rekomendasinya membantu diskusi jurusan kuliah anak saya.',
      },
    ],
    { onConflict: 'sesi_id,siswa_id' },
  );

  // Sample laporan masalah
  await supabase.from('laporan_masalah').upsert(
    {
      id: '99999999-9999-4999-8999-000000000001',
      pelapor_id: ortu2Id,
      sesi_id: sesiK6_2,
      pengajar_id: pengajar2Id,
      kategori: 'masalah_teknis',
      deskripsi: 'Audio sempat putus sebentar di menit ke-15 karena kendala koneksi, namun sudah teratasi.',
      status: 'baru',
    },
    { onConflict: 'id' },
  );

  console.log('\nSeed akun & data demo selesai dengan sukses!');
  console.log('===========================================================');
  console.log(`Password seluruh akun demo: ${DEMO_PASSWORD}`);
  console.log('1. Admin               : admin@seventx.id');
  console.log('2. Pengajar Verified 1 : pengajar1@seventx.id');
  console.log('3. Pengajar Verified 2 : pengajar2@seventx.id');
  console.log('4. Pengajar Verified 3 : pengajar3@seventx.id');
  console.log('5. Pengajar Pending    : pengajar.baru@seventx.id');
  console.log('6. Orang Tua 1         : ortu1@seventx.id (anak: Bima SD, Sinta SMP, Fajar SMA)');
  console.log('7. Orang Tua 2         : ortu2@seventx.id (anak: Raka SMA)');
  console.log('8. Siswa Aktif         : siswa.aktif@seventx.id');
  console.log('9. Siswa Menunggu Acc  : siswa.baru@seventx.id');
  console.log('===========================================================');
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
