# Kodie Lab — Coding Playground di Browser (`/lab`)

## Apa itu Kodie Lab?

**Kodie Lab** adalah fitur *coding playground* bawaan di website Kodie (`/lab`) yang memungkinkan siswa belajar dan praktik coding langsung dari browser tanpa perlu menginstal aplikasi tambahan apa pun.

- **Gratis dan Terbuka:** Bisa langsung dicoba siapa saja (termasuk pengunjung tamu tanpa perlu membuat akun atau login).
- **Tanpa Install:** Semua kode berjalan langsung di browser pengguna (client-side), ringan, dan cepat diakses.
- **Penyimpanan Sementara Lokal:** Kode yang ditulis tersimpan otomatis di `localStorage` **hanya pada browser dan perangkat yang sedang digunakan** (tidak disinkronkan ke cloud/server Kodie; data bisa hilang jika cache/data situs browser dihapus).

## Bahasa dan Mode yang Didukung

### 1. Mode Blok (Blockly Visual)
- Mode bawaan yang ramah pemula dan siswa SD untuk belajar logika melalui susunan blok perintah berbahasa Indonesia.
- Dilengkapi pratinjau kanvas Turtle visual langsung di browser, tombol **Intip kode Python**, serta tombol **Buka di Python Turtle** untuk melanjutkan belajar dari blok ke kode teks.

### 2. Mode Python Turtle
- Siswa dapat menulis kode Python dengan perintah gambar grafis **Turtle** (`forward`, `right`, `color`, perulangan pola) dan melihat animasi gambar secara langsung di kanvas browser.

### 3. Mode Web (HTML, CSS, dan JavaScript)
- Menggunakan editor kode modern **CodeMirror 6** dengan penyorotan sintaks (*syntax highlighting*).
- Siswa dapat menulis kode **HTML, CSS, dan JavaScript** lalu langsung melihat hasilnya di panel pratinjau (*live preview*) di sebelah editor.
- Dilengkapi panel **Konsol** untuk melihat keluaran `console.log` maupun pesan error JavaScript.
- Pratinjau dijalankan di dalam *iframe sandbox* (`allow-scripts allow-modals`) yang aman sehingga terisolasi dari akun pengguna.

### 4. Mode Python (Pyodide di Browser)
- Siswa dapat menulis dan menjalankan kode **Python** langsung di browser menggunakan runtime **Pyodide** (WebAssembly) yang berjalan di Web Worker terpisah.
- Dilengkapi tombol **Jalankan** untuk mengeksekusi skrip dan tombol **Hentikan** untuk menghentikan kode (misalnya jika terjadi perulangan tak terbatas).
- Runtime Python hanya dimuat saat siswa memilih mode Python atau Python Turtle agar halaman lain tetap cepat.
- **Catatan:** Fungsi `input()` interaktif pada Python saat ini belum didukung di Kodie Lab; siswa dapat langsung mendefinisikan nilai variabel di dalam kode.

## Manfaat Kodie Lab untuk Siswa

Kodie Lab membantu siswa SD, SMP, dan SMA langsung bereksperimen saat mengikuti **Kelas Reguler Teknologi**, **Simulasi Jurusan IT**, atau berlatih mandiri di luar jam kelas. Jika mengalami error saat mencoba kode di Kodie Lab, siswa juga bisa langsung bertanya kepada asisten **Kiko** di halaman `/lab` karena Kiko memahami konteks halaman yang sedang dibuka.
