import type { SilabusSesi } from "@/types/database";

/**
 * Silabus Sesi 1–4 untuk mode mock, disalin dari kolom `program.silabus` di `backend/supabase/seed.sql`
 * (migration 12). Mode Supabase membaca kolom itu langsung.
 */
export const silabusMock: Record<string, SilabusSesi[]> = {
  // Paket baru 2026-11-28 (usia 5–7 tahun). Belum ada di seed backend; lihat spesifikasi di docs/KEPUTUSAN.md.
  "kenal-komputer": [
    {
      "sesi": 1,
      "judul": "Halo Komputer: Mouse, Keyboard, dan Layar",
      "topik": "Mengenal bagian komputer, menyalakan dan mematikan dengan benar, menggerakkan mouse, klik dan klik dua kali, serta posisi duduk yang sehat.",
      "hasil_proyek": "Mewarnai gambar di Paint dengan klik dan seret."
    },
    {
      "sesi": 2,
      "judul": "Jelajah Windows: Desktop, Ikon, dan Jendela",
      "topik": "Mengenal desktop, menu Start, membuka dan menutup aplikasi, memperbesar, mengecilkan, dan memindahkan jendela.",
      "hasil_proyek": "Membuka tiga aplikasi sendiri dan menatanya berdampingan."
    },
    {
      "sesi": 3,
      "judul": "Rumah untuk Karya: Folder dan File",
      "topik": "Membuat folder, memberi nama, menyimpan gambar ke folder yang tepat, menyalin, memindahkan, dan menghapus file dengan aman.",
      "hasil_proyek": "Folder \"Karyaku\" berisi gambar dari sesi 1 dan 2 yang tersusun rapi."
    },
    {
      "sesi": 4,
      "judul": "Mengetik Nama dan Aman di Internet",
      "topik": "Mengetik huruf dan angka di keyboard, membuka peramban bersama orang tua, dan aturan aman: tidak membagikan data pribadi.",
      "hasil_proyek": "Kartu nama digital sederhana disimpan di folder \"Karyaku\"."
    }
  ],
  "coding-dasar": [
    {
      "sesi": 1,
      "judul": "Logika Urutan & Karakter Pertama",
      "topik": "Mengenal instruksi berurutan (sequence), Stage, Sprite, serta blok Events, Motion, dan Looks di Scratch.",
      "hasil_proyek": "Animasi karakter menyapa dan berjalan mengikuti urutan perintah."
    },
    {
      "sesi": 2,
      "judul": "Perulangan (Loop) & Animasi Halus",
      "topik": "Menggunakan blok repeat dan forever, pergantian kostum, dan pantulan otomatis saat menyentuh tepi layar.",
      "hasil_proyek": "Animasi akuarium atau karakter bergerak terus dengan latar kustom."
    },
    {
      "sesi": 3,
      "judul": "Percabangan Kondisi (If-Then) & Kontrol Keyboard",
      "topik": "Memahami logika sebab-akibat dengan blok if-then, sensor sentuh objek/warna, dan kontrol tombol arah.",
      "hasil_proyek": "Karakter interaktif yang merespons tombol dan rintangan."
    },
    {
      "sesi": 4,
      "judul": "Variabel Skor & Game Mini Interaktif",
      "topik": "Membuat variabel skor/nyawa, menggabungkan urutan, loop, dan kondisi menjadi game mini utuh.",
      "hasil_proyek": "Game tangkap objek sederhana siap dipamerkan ke orang tua."
    }
  ],
  "kelas-reguler-teknologi": [
    {
      "sesi": 1,
      "judul": "Fondasi Struktur Web HTML5",
      "topik": "Memahami cara browser membaca HTML, struktur tag semantik (heading, paragraf, daftar, gambar, tautan), dan Inspect Element.",
      "hasil_proyek": "Halaman web profil pelajar satu halaman."
    },
    {
      "sesi": 2,
      "judul": "Styling Modern dengan CSS & Flexbox",
      "topik": "Menerapkan selektor CSS, Box Model (margin, padding, border), serta penataan responsif memakai Flexbox.",
      "hasil_proyek": "Kartu profil dan galeri hobi modern yang rapi di laptop dan ponsel."
    },
    {
      "sesi": 3,
      "judul": "Interaktivitas Web dengan JavaScript & DOM",
      "topik": "Mengenal variabel, fungsi, event listener tombol/form, dan manipulasi elemen DOM secara langsung.",
      "hasil_proyek": "Aplikasi web catatan atau daftar tugas interaktif di browser."
    },
    {
      "sesi": 4,
      "judul": "Simulasi IoT Virtual & Pengenalan AI Dasar",
      "topik": "Merancang logika sensor dan LED di simulator Wokwi serta mencoba klasifikasi teks sederhana dengan AI.",
      "hasil_proyek": "Purwarupa lampu otomatis virtual dan demo asisten teks sederhana."
    }
  ],
  "simulasi-jurusan-it": [
    {
      "sesi": 1,
      "judul": "Simulasi 1: Software Engineering",
      "topik": "Mengenal alur kerja Software Engineer, logika pemrograman antarmuka web, penanganan event, dan debugging dasar.",
      "hasil_proyek": "Aplikasi web mini Kalkulator Target Tabungan."
    },
    {
      "sesi": 2,
      "judul": "Simulasi 2: Jaringan Komputer & Keamanan Siber",
      "topik": "Memahami IP Address, DNS, router, protokol HTTP/HTTPS, inspeksi Network Tab, serta mengenali ancaman phishing.",
      "hasil_proyek": "Analisis lalu lintas request browser dan investigasi keamanan tautan."
    },
    {
      "sesi": 3,
      "judul": "Simulasi 3: Internet of Things (IoT) Virtual",
      "topik": "Mengenal mikrokontroler ESP32/Arduino, wiring sensor jarak & suhu, serta pemrograman logika perangkat di Wokwi.",
      "hasil_proyek": "Simulasi perangkat rumah pintar berbasis sensor otomatis."
    },
    {
      "sesi": 4,
      "judul": "Simulasi 4: AI & Sains Data + Rapor Jurusan",
      "topik": "Mencoba eksperimen klasifikasi teks AI, evaluasi kesalahan model, dan refleksi minat keempat bidang IT.",
      "hasil_proyek": "Notebook klasifikasi AI dan Rapor Rekomendasi Jurusan Kuliah."
    }
  ]
};
