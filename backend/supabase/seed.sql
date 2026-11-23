-- ============================================================================
-- Seed Data Inti: Program, 12 Soal Tes Minat, Playbook Sesi 1-2, Pengaturan
-- Catatan: Akun demo (auth.users) + 6 kelas + booking + laporan dibuat lewat
--          skrip Admin API `backend/scripts/seed-akun.ts` agar 100% valid
--          di Supabase Cloud tanpa menyentuh tabel internal auth secara manual.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROGRAM (3 program sesuai PRD Bagian 1 & KEPUTUSAN.md)
-- ----------------------------------------------------------------------------

INSERT INTO public.program (
  id,
  slug,
  nama,
  jenjang,
  kelas_min,
  kelas_maks,
  level,
  deskripsi,
  durasi_menit,
  jumlah_sesi,
  harga_paket,
  honor_per_sesi,
  aktif
)
VALUES
  (
    '11111111-1111-4111-8111-000000000001',
    'coding-dasar',
    'Coding Dasar',
    ARRAY['SD']::public.jenjang_pendidikan[],
    5,
    6,
    1,
    'Belajar logika, berpikir komputasional, dan pemrograman blok interaktif menggunakan Scratch. Setiap sesi menghasilkan proyek animasi atau game mini.',
    60,
    4,
    200000,
    50000,
    true
  ),
  (
    '11111111-1111-4111-8111-000000000002',
    'kelas-reguler-teknologi',
    'Kelas Reguler Teknologi',
    ARRAY['SMP', 'SMA']::public.jenjang_pendidikan[],
    7,
    12,
    1,
    'Kelas berjenjang yang membahas pemrograman web (HTML, CSS, JavaScript), simulasi IoT virtual, dan pengenalan AI dasar dengan proyek nyata.',
    90,
    4,
    275000,
    65000,
    true
  ),
  (
    '11111111-1111-4111-8111-000000000003',
    'simulasi-jurusan-it',
    'Simulasi Jurusan IT',
    ARRAY['SMP', 'SMA']::public.jenjang_pendidikan[],
    9,
    12,
    1,
    'Program eksplorasi 4 sesi (Software Engineering, Jaringan Komputer, IoT, dan Integrasi AI) untuk membantu siswa kelas 9–12 memilih jurusan kuliah IT.',
    90,
    4,
    300000,
    75000,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  nama = EXCLUDED.nama,
  jenjang = EXCLUDED.jenjang,
  kelas_min = EXCLUDED.kelas_min,
  kelas_maks = EXCLUDED.kelas_maks,
  level = EXCLUDED.level,
  deskripsi = EXCLUDED.deskripsi,
  durasi_menit = EXCLUDED.durasi_menit,
  jumlah_sesi = EXCLUDED.jumlah_sesi,
  harga_paket = EXCLUDED.harga_paket,
  honor_per_sesi = EXCLUDED.honor_per_sesi,
  aktif = EXCLUDED.aktif;

-- ----------------------------------------------------------------------------
-- 2. SOAL TES MINAT (12 soal sesuai docs/konten/soal-tes-minat.md)
-- ----------------------------------------------------------------------------

INSERT INTO public.soal_minat (urutan, teks, opsi)
VALUES
  (
    1,
    'Saat ada waktu luang di depan komputer, kamu paling suka…',
    '[
      {"kode": "A", "teks": "Membuat website atau aplikasi kecil", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Mengotak-atik pengaturan Wi-Fi dan koneksi internet", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Merakit atau memprogram alat seperti lampu otomatis", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Mencari pola dari data, misalnya statistik game favorit", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    2,
    'Jika sekolahmu mengadakan proyek teknologi, peran mana yang paling ingin kamu ambil?',
    '[
      {"kode": "A", "teks": "Merancang tampilan dan alur fitur aplikasi untuk pengguna", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Memastikan semua perangkat terhubung lancar ke server sekolah", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Menghubungkan sensor suhu dan gerak ke papan mikrokontroler", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Mengolah hasil survei siswa menjadi grafik dan prediksi", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    3,
    'Masalah sehari-hari mana yang paling membuatmu tertantang untuk menyelesaikannya?',
    '[
      {"kode": "A", "teks": "Aplikasi antrean kantin yang lambat dan membingungkan", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 1},
      {"kode": "B", "teks": "Jaringan internet rumah yang sering putus atau lambat", "software": 0, "jaringan": 3, "iot": 1, "ai_data": 0},
      {"kode": "C", "teks": "Tanaman di rumah layu karena lupa disiram saat bepergian", "software": 1, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Sulit memilih topik belajar yang paling efektif dari nilai ujian", "software": 0, "jaringan": 1, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    4,
    'Video atau tutorial teknologi apa yang paling sering menarik perhatianmu di media sosial?',
    '[
      {"kode": "A", "teks": "Cara membuat game atau aplikasi mobile dari nol", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Cara kerja peretas (hacker) etis menjaga keamanan sistem", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Eksperimen robot mini atau smart home dengan Arduino/ESP32", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Bagaimana kecerdasan buatan (AI) mengenali gambar atau suara", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    5,
    'Ketika belajar hal baru di bidang teknologi, metode mana yang paling membuatmu bersemangat?',
    '[
      {"kode": "A", "teks": "Menulis kode baris demi baris sampai fitur berjalan di layar", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Menguji jalur koneksi data dan menganalisis paket jaringan", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Menyambungkan kabel, resistor, LED, dan melihatnya menyala sesuai kode", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Melatih komputer menebak hasil berdasarkan kumpulan contoh data", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    6,
    'Bayangkan kamu bekerja di tim pembuat mobil pintar tanpa pengemudi. Bagian mana yang paling seru menurutmu?',
    '[
      {"kode": "A", "teks": "Membuat layar dasbor navigasi yang dipakai penumpang", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Mengatur komunikasi data antara mobil dan server lalu lintas secara aman", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Mengatur sensor jarak, kamera, dan motor penggerak roda", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Melatih sistem agar mobil bisa mengenali rambu jalan dan pejalan kaki", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    7,
    'Jika sebuah aplikasi populer tiba-tiba bermasalah, apa hal pertama yang paling membuatmu penasaran?',
    '[
      {"kode": "A", "teks": "Apakah ada kesalahan logika (bug) pada kode programnya?", "software": 3, "jaringan": 1, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Apakah servernya kelebihan beban atau ada serangan jaringan?", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 1},
      {"kode": "C", "teks": "Apakah perangkat keras atau sensor pengirim sinyalnya terputus?", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Apakah data masukan yang diproses sistemnya salah format?", "software": 1, "jaringan": 0, "iot": 1, "ai_data": 3}
    ]'::jsonb
  ),
  (
    8,
    'Mata pelajaran atau topik sekolah mana yang paling sering terasa nyambung dengan caramu berpikir?',
    '[
      {"kode": "A", "teks": "Membuat alur langkah (algoritma) yang rapi dan terstruktur", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Memahami sistem komunikasi, protokol, dan keamanan data", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Fisika listrik, rangkaian elektronik, dan cara kerja mesin", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Matematika statistika, peluang, dan membaca tren dari angka", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    9,
    'Di akhir pekan, kamu diberi satu paket proyek IT. Proyek mana yang langsung ingin kamu buka duluan?',
    '[
      {"kode": "A", "teks": "Membangun website catatan tugas sekolah yang bisa diakses teman sekelas", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Membangun jaringan lokal (LAN) mini dan memblokir situs berbahaya", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Membuat tempat sampah pintar yang otomatis terbuka saat tangan mendekat", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Membuat program yang merekomendasikan film berdasarkan riwayat tontonan", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    10,
    'Alat atau lingkungan kerja mana yang paling membuatmu betah berlama-lama?',
    '[
      {"kode": "A", "teks": "Editor kode untuk membangun tampilan dan logika aplikasi", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Terminal jaringan dan diagram topologi koneksi antar server", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Meja eksperimen berisi mikrokontroler, kabel jumper, dan simulator alat", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Notebook analisis data berisi tabel angka, grafik, dan model prediksi", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    11,
    'Saat kamu bermain game online bersama teman, hal teknis apa yang paling menarik perhatianmu?',
    '[
      {"kode": "A", "teks": "Desain menu, sistem inventori, dan logika mekanik permainannya", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Bagaimana server menghubungkan jutaan pemain tanpa lag (ping kecil)", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Bagaimana controller atau perangkat VR mengirim getaran dan sensor gerak", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Bagaimana bot lawan (AI) belajar membaca strategi permainan kita", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  ),
  (
    12,
    'Lima tahun lagi, pencapaian kerja mana yang paling membuatmu bangga?',
    '[
      {"kode": "A", "teks": "Aplikasi buatanku dipakai ratusan ribu pelajar di Indonesia", "software": 3, "jaringan": 0, "iot": 0, "ai_data": 0},
      {"kode": "B", "teks": "Infrastruktur jaringan dan pertahanan siber perusahaan aman karena rancangan timku", "software": 0, "jaringan": 3, "iot": 0, "ai_data": 0},
      {"kode": "C", "teks": "Alat pintar hasil rancanganku membantu petani atau rumah sakit bekerja otomatis", "software": 0, "jaringan": 0, "iot": 3, "ai_data": 0},
      {"kode": "D", "teks": "Model data dan AI buatanku membantu mengambil keputusan penting secara akurat", "software": 0, "jaringan": 0, "iot": 0, "ai_data": 3}
    ]'::jsonb
  )
ON CONFLICT (urutan) DO UPDATE SET
  teks = EXCLUDED.teks,
  opsi = EXCLUDED.opsi;

-- ----------------------------------------------------------------------------
-- 3. PLAYBOOK (Sesi 1 dan 2 setiap program)
-- ----------------------------------------------------------------------------

INSERT INTO public.playbook (program_id, level, nomor_sesi, judul, konten_md, starter_url)
VALUES
  (
    '11111111-1111-4111-8111-000000000001',
    1,
    1,
    'Coding Dasar Sesi 1: Logika Urutan & Karakter Scratch',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami konsep instruksi berurutan (*sequence*) sebagai dasar algoritma komputer.
2. Membuat program blok sederhana di Scratch untuk menggerakkan karakter dan bersuara.

## Persiapan pengajar
- Buka tautan starter Scratch dan siapkan contoh "Kucing Menyapa dan Berjalan".
- Uji *share screen* sebelum kelas dimulai.

## Alur kelas (60 menit)
- **00–08 Pembukaan:** Ice breaking tebak urutan langkah membuat roti/mie agar paham konsep *sequence*.
- **08–32 Praktik terpandu:** Mengenalkan Stage, Sprite, serta blok `Events`, `Motion`, dan `Looks`.
- **32–47 Tantangan:** Karakter berjalan bolak-balik dan berganti kostum.
- **47–55 Pamer hasil:** 3–5 siswa menunjukkan karyanya.
- **55–60 Penutup:** Rangkuman *sequence* dan pratinjau materi *loop* di sesi 2.

## Tantangan untuk siswa
1. **Dasar:** Gerakkan karakter maju 5 langkah berurutan dan ucapkan nama panggilan selama 2 detik.
2. **Lanjutan:** Tambahkan sprite kedua dan buat dialog bergantian dengan blok `wait 1 seconds`.

## Kunci jawaban dan solusi umum
- *Sprite hilang ke tepi:* Tambahkan `go to x: 0 y: 0` di awal.
- *Bendera hijau tidak jalan:* Pastikan blok menempel rapat pada `when green flag clicked`.

## Catatan keamanan
- Kelas hanya lewat link resmi platform. Jangan meminta kontak pribadi siswa.$md$,
    'https://scratch.mit.edu/projects/editor/'
  ),
  (
    '11111111-1111-4111-8111-000000000001',
    1,
    2,
    'Coding Dasar Sesi 2: Perulangan (Loop) & Animasi',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami konsep perulangan (*loop*) memakai blok `repeat` dan `forever` di Scratch.
2. Membuat animasi karakter yang berjalan terus dan memantul di tepi layar.

## Persiapan pengajar
- Buka proyek contoh "Akuarium Ikan Berenang".
- Baca catatan siswa dari sesi 1.

## Alur kelas (60 menit)
- **00–08 Pembukaan:** Mengulas *sequence* dan membandingkan menumpuk 100 blok vs 1 blok loop.
- **08–32 Praktik terpandu:** Blok `repeat (10)`, `forever`, `next costume`, dan `if on edge, bounce`.
- **32–47 Tantangan:** Desain latar belakang (*Backdrop*) dan animasi bergerak halus.
- **47–55 Pamer hasil:** Siswa menampilkan animasi masing-masing.
- **55–60 Penutup:** Perbedaan `repeat` dan `forever`, pratinjau kondisi `if-then`.

## Tantangan untuk siswa
1. **Dasar:** Buat karakter bergerak dengan `forever`, berganti kostum tiap `0.2 seconds`, dan memantul di tepi.
2. **Lanjutan:** Tambahkan aksi melompat saat tombol Spasi ditekan.

## Kunci jawaban dan solusi umum
- *Karakter terbalik saat memantul:* Pasang `set rotation style left-right`.
- *Kostum berganti terlalu cepat:* Sisipkan `wait 0.2 seconds` setelah `next costume`.

## Catatan keamanan
- Kelas hanya lewat link resmi platform. Jangan menghubungi siswa di luar platform.$md$,
    'https://scratch.mit.edu/projects/editor/'
  ),
  (
    '11111111-1111-4111-8111-000000000002',
    1,
    1,
    'Kelas Reguler Teknologi Sesi 1: Fondasi Struktur Web HTML5',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami struktur dasar dokumen HTML (`html`, `head`, `body`, heading, paragraf, gambar, tautan).
2. Membangun halaman web profil pribadi satu halaman di editor CodeSandbox.

## Persiapan pengajar
- Buka starter CodeSandbox dan siapkan contoh "Kartu Profil Pelajar".

## Alur kelas (90 menit)
- **00–12 Pembukaan:** Cara browser membaca HTML dan demo *Inspect Element*.
- **12–48 Praktik terpandu:** Menulis `<h1>`, `<p>`, `<ul>`, `<img>`, `<a>`.
- **48–72 Tantangan:** Membangun halaman "Tentang Saya & Hobi" minimal 3 bagian.
- **72–84 Pamer hasil:** Review 4–5 proyek siswa.
- **84–90 Penutup:** Rangkuman tag semantik dan pratinjau CSS di sesi 2.

## Tantangan untuk siswa
1. **Dasar:** Nama lengkap (`<h1>`), deskripsi (`<p>`), 3 hobi (`<ul><li>`), dan 1 link eksternal (`<a target="_blank">`).
2. **Lanjutan:** Tambahkan tabel jadwal belajar memakai `<table>`.

## Kunci jawaban dan solusi umum
- *Gambar pecah:* Gunakan URL gambar langsung dan isi atribut `alt`.
- *Semua teks jadi biru:* Periksa tag penutup `</a>`.

## Catatan keamanan
- Kelas hanya lewat link resmi platform. Laporkan kendala lewat fitur laporan masalah.$md$,
    'https://codesandbox.io/s/vanilla'
  ),
  (
    '11111111-1111-4111-8111-000000000002',
    1,
    2,
    'Kelas Reguler Teknologi Sesi 2: Styling Modern dengan CSS & Flexbox',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami selektor CSS (tag, class, id) dan *Box Model* (`margin`, `padding`, `border`).
2. Menghias halaman profil sesi 1 menjadi kartu profil modern dengan Flexbox.

## Persiapan pengajar
- Siapkan starter `styles.css` dengan contoh `.kartu` dan `.tombol`.

## Alur kelas (90 menit)
- **00–12 Pembukaan:** Membandingkan website tanpa CSS vs dengan CSS.
- **12–48 Praktik terpandu:** Menghubungkan `styles.css`, mengatur font, warna, `padding`, `border-radius`, dan `display: flex`.
- **48–72 Tantangan:** Menata daftar hobi menjadi kartu berjajar rapi dan efek `:hover`.
- **72–84 Pamer hasil:** Presentasi desain dan evaluasi kontras keterbacaan.
- **84–90 Penutup:** Rangkuman Box Model & Flexbox, pratinjau JavaScript untuk sesi 3.

## Tantangan untuk siswa
1. **Dasar:** Tengahkan kartu dengan Flexbox, beri `border-radius: 12px` dan efek `:hover`.
2. **Lanjutan:** Buat responsif dengan `flex-wrap: wrap` dan `@media (max-width: 600px)`.

## Kunci jawaban dan solusi umum
- *CSS tidak ngefek:* Cek `<link rel="stylesheet" href="styles.css">` dan awalan titik `.` pada class.
- *Teks menempel tepi:* Tambahkan `padding: 24px`.

## Catatan keamanan
- Kelas hanya lewat link resmi platform.$md$,
    'https://codesandbox.io/s/vanilla'
  ),
  (
    '11111111-1111-4111-8111-000000000003',
    1,
    1,
    'Simulasi Jurusan IT Sesi 1: Software Engineering',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Mengenal alur kerja nyata *Software Engineer* (analisis, logika kode, pengujian, antarmuka).
2. Membangun aplikasi web interaktif mini "Kalkulator Target Tabungan" dengan HTML + JavaScript.

## Persiapan pengajar
- Buka CodeSandbox starter kalkulator tabungan dan slide gambaran kuliah Informatika/RPL.

## Alur kelas (90 menit)
- **00–12 Pembukaan:** Pengenalan dunia Software Engineering dan prospek kuliah RPL/Informatika.
- **12–48 Praktik terpandu:** Menulis `addEventListener`, konversi `Number()`, dan percabangan `if-else`.
- **48–72 Tantangan:** Menambahkan validasi input 0/negatif dan pesan motivasi dinamis.
- **72–84 Pamer hasil:** Refleksi ketertarikan siswa terhadap pemecahan masalah logika.
- **84–90 Penutup:** Catat minat bidang Software untuk bahan rapor sesi 4, pratinjau sesi 2 (Jaringan).

## Tantangan untuk siswa
1. **Dasar:** Hitung `Math.ceil(target / mingguan)` dan tampilkan format rupiah.
2. **Lanjutan:** Tambahkan riwayat perhitungan dengan `document.createElement('li')`.

## Kunci jawaban dan solusi umum
- *Muncul NaN atau string concat:* Bungkus nilai input dengan `Number(input.value)`.
- *Halaman reload saat submit:* Panggil `event.preventDefault()`.

## Catatan keamanan
- Kelas hanya lewat link resmi platform.$md$,
    'https://codesandbox.io/s/vanilla'
  ),
  (
    '11111111-1111-4111-8111-000000000003',
    1,
    2,
    'Simulasi Jurusan IT Sesi 2: Jaringan Komputer & Keamanan Siber',
    $md$## Tujuan sesi
Setelah sesi ini, siswa bisa:
1. Memahami cara kerja IP Address, DNS, router, dan protokol HTTP/HTTPS.
2. Melakukan inspeksi jaringan lewat *Network Tab* browser dan membedakan koneksi aman vs rentan.

## Persiapan pengajar
- Siapkan studi kasus alur request saat membuka `google.com` dan contoh header HTTP.

## Alur kelas (90 menit)
- **00–12 Pembukaan:** Pengenalan Jaringan Komputer, Keamanan Siber, dan kuliah Teknik Komputer.
- **12–48 Praktik terpandu:** Membuka DevTools > Network, mengamati status code (`200`, `404`, `500`), latency, dan sertifikat HTTPS.
- **48–72 Tantangan:** Investigasi 4 skenario masalah jaringan & mengenali ciri tautan *phishing*.
- **72–84 Pamer hasil:** Presentasi temuan dan refleksi ketertarikan pada investigasi sistem.
- **84–90 Penutup:** Rangkuman materi dan pratinjau sesi 3 (IoT menggunakan Wokwi).

## Tantangan untuk siswa
1. **Dasar:** Catat 3 tipe aset (HTML, JS/CSS, Gambar) di Network tab beserta status code dan ukurannya.
2. **Lanjutan:** Inspeksi response JSON dari API publik dan bedakan Request Headers vs Response Headers.

## Kunci jawaban dan solusi umum
- *Tab Network kosong:* Tekan `Ctrl+R` / `Cmd+R` setelah tab Network dibuka.
- *Beda 404 vs 500:* 404 = halaman tidak ditemukan, 500 = error internal server.

## Catatan keamanan
- Tekankan etika keamanan siber: uji hanya pada simulator atau sistem milik sendiri.$md$,
    'https://www.packettracernetwork.com/'
  )
ON CONFLICT (program_id, level, nomor_sesi) DO UPDATE SET
  judul = EXCLUDED.judul,
  konten_md = EXCLUDED.konten_md,
  starter_url = EXCLUDED.starter_url;

-- ----------------------------------------------------------------------------
-- 4. PENGATURAN PEMBAYARAN CONTOH (PRD F6 & Bagian 7)
-- ----------------------------------------------------------------------------

INSERT INTO public.pengaturan (kunci, nilai)
VALUES
  ('nama_bank', 'Bank Mandiri (Contoh Demo)'),
  ('nomor_rekening', '1230009876543'),
  ('nama_pemilik_rekening', 'Yayasan Edukasi Teknologi SEVENT X'),
  ('qris_path', 'qris-demo.png')
ON CONFLICT (kunci) DO UPDATE SET
  nilai = EXCLUDED.nilai;
