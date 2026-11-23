# Teaching Playbook: Coding Dasar — Level 1 Sesi 2

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Coding Dasar | 1 | 2 dari 4 | 60 menit | SD (Kelas 5–6) |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami konsep perulangan (*loop*) menggunakan blok `repeat` dan `forever` di Scratch.
2. Membuat animasi sederhana di mana karakter berjalan terus dan memantul saat menyentuh tepi layar.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://scratch.mit.edu/projects/editor/
- [ ] Siapkan proyek contoh "Akuarium Ikan Berenang".
- [ ] Baca catatan siswa dari sesi 1 untuk memastikan siswa yang sempat kesulitan mendapat pendampingan lebih awal.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–08 | Pembukaan | Mengulas kembali konsep *sequence* dari sesi 1 dan memperkenalkan masalah: bagaimana jika ingin mengulang 100 kali? | Menjawab dan membandingkan cara menumpuk 100 blok vs memakai 1 blok perulangan |
| 08–32 | Praktik terpandu | Mendemonstrasikan blok `repeat (10)`, `forever`, `next costume`, dan `if on edge, bounce` | Membuat karakter ikan atau kucing berjalan terus dan berganti kostum |
| 32–47 | Tantangan | Memberikan tantangan mengubah latar belakang (*Backdrop*) dan menambahkan musik latar berulang | Mendesain latar akuarium/taman dan menguji animasi masing-masing |
| 47–55 | Pamer hasil | Meminta siswa yang belum tampil di sesi 1 untuk mempresentasikan animasinya | Memperlihatkan proyek animasi dan menjelaskan blok loop yang dipakai |
| 55–60 | Penutup | Merangkum perbedaan `repeat` (jumlah pasti) dan `forever` (tanpa henti), pratinjau kondisi `if-then` untuk sesi 3 | Menyimak dan mencatat pengingat tugas opsional |

## Tantangan untuk siswa

1. **Tantangan dasar:** Buat karakter berjalan dengan `forever`, berganti kostum dengan jeda `0.2 seconds`, dan memantul di tepi layar.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan tombol spasi untuk membuat karakter melompat ke atas (`change y by 50`, tunggu, turun `-50`) menggunakan `when space key pressed`.

## Kunci jawaban dan solusi umum

Bagian ini hanya untuk pengajar dan tidak pernah tampil ke siswa.

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Karakter berjalan terbalik (kepala di bawah) saat memantul | Mode rotasi default Scratch adalah `all around` | Tambahkan blok `set rotation style left-right` di awal program |
| Animasi berganti kostum terlalu cepat | Tidak ada blok jeda di dalam loop | Sisipkan blok `wait 0.2 seconds` setelah `next costume` |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Jika ada kejadian yang mengkhawatirkan, laporkan ke admin lewat fitur laporan masalah.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan untuk setiap siswa.
