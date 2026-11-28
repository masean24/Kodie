# Tes Minat Jurusan IT dan Rapor Rekomendasi Jurusan

## Tes Minat Jurusan IT (`/tes-minat`)

Tes Minat Jurusan IT adalah fitur kuis interaktif gratis di Kodie untuk membantu siswa dan orang tua mengetahui bidang teknologi serta program belajar yang paling cocok sebelum memesan kelas.

### Cara Kerja Tes Minat
- Terdiri dari **12 soal pilihan ganda**, masing-masing dengan 4 pilihan jawaban (A, B, C, D). Semua soal wajib dijawab.
- Setiap jawaban memberikan bobot poin ke empat bidang utama teknologi informasi:
  1. **Software Engineering (`software`)**
  2. **Jaringan Komputer & Keamanan Siber (`jaringan`)**
  3. **Internet of Things / Perangkat Pintar (`iot`)**
  4. **Kecerdasan Buatan & Sains Data (`ai_data`)**
- Jika ada dua bidang dengan skor tertinggi yang sama (seri), urutan prioritas rekomendasinya adalah: **Software > Jaringan > IoT > AI & Data**.
- **Siapa yang bisa mengerjakan?**
  - **Tamu (belum login):** Bisa langsung mengerjakan tes di `/tes-minat` dan melihat hasilnya, namun hasil tidak disimpan ke database.
  - **Siswa yang login:** Hasil tes otomatis tersimpan di profil siswa. Tes boleh diulang kapan saja dan dashboard menampilkan hasil terbaru.
  - **Orang tua yang login:** Bisa mengerjakan tes minat atas nama salah satu profil anaknya.
- **Apakah Tes Minat wajib sebelum booking?**
  - Tes minat **tidak memblokir booking** (bersifat sangat disarankan), sehingga siswa atau orang tua tetap bebas langsung memesan kelas.

### Pemetaan Rekomendasi Jurusan Kuliah & Program Belajar

| Bidang Tertinggi | Rekomendasi Jurusan Kuliah |
| --- | --- |
| **Software** | Informatika, Rekayasa Perangkat Lunak (RPL), Sistem Informasi |
| **Jaringan** | Teknik Komputer, Keamanan Siber |
| **IoT** | Teknik Komputer, Teknik Elektro |
| **AI & Data** | Informatika, Sains Data |

| Jenjang Siswa | Rekomendasi Program Kodie |
| --- | --- |
| **TK & SD Kelas 1 (Usia 5–7 tahun)** | Kenal Komputer |
| **SD (Kelas 2–6)** | Coding Dasar |
| **SMP (Kelas 7–8)** | Kelas Reguler Teknologi |
| **SMP Kelas 9 & SMA (Kelas 10–12)** | Simulasi Jurusan IT, lalu Kelas Reguler Teknologi |

> **Catatan Penting:** Hasil tes minat dan rapor rekomendasi adalah **saran eksplorasi**, bukan keputusan mutlak.

## Rapor Rekomendasi Jurusan Kuliah

Khusus bagi siswa yang mengikuti program **Simulasi Jurusan IT**, pada akhir **Sesi ke-4**, pengajar akan menyusun **Rapor Rekomendasi Jurusan** yang berisi:
- Skor pengamatan langsung pengajar (skala 1–5) untuk keempat bidang: **Software**, **Jaringan**, **IoT**, dan **AI & Data**.
- Bidang utama yang direkomendasikan pengajar beserta alasan lengkap dari performa praktik siswa selama 4 sesi.
- Saran langkah belajar berikutnya.
- Perbandingan berdampingan antara **penilaian praktik pengajar** dan **hasil Tes Minat mandiri siswa**.
- Rapor dapat dilihat di `/siswa/rapor/[id]` atau `/orang-tua/rapor/[id]` dan dapat **dicetak atau disimpan sebagai PDF** melalui fitur *Print* browser.
