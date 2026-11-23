# Teaching Playbook: Kelas Reguler Teknologi — Level 1 Sesi 2

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Kelas Reguler Teknologi | 1 | 2 dari 4 | 90 menit | SMP & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami cara kerja CSS selektor (tag, class, id) serta *Box Model* (`margin`, `padding`, `border`).
2. Menghias halaman profil dari sesi 1 menjadi kartu profil modern menggunakan Flexbox sederhana.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://codesandbox.io/s/vanilla
- [ ] Siapkan file `styles.css` starter dengan contoh kelas `.kartu` dan `.tombol`.
- [ ] Baca catatan siswa dari sesi 1 untuk mengidentifikasi siswa yang butuh bantuan sintaks tag.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Mengulas struktur HTML sesi 1 dan membandingkan website tanpa CSS vs dengan CSS | Menjawab perbedaan tata letak dan warna yang diamati |
| 12–48 | Praktik terpandu | Menghubungkan `<link rel="stylesheet" href="styles.css">`, mengatur `font-family`, warna, `padding`, `border-radius`, dan `display: flex` | Menerapkan styling bertahap pada kartu profil dan melihat perubahan di preview |
| 48–72 | Tantangan | Memberikan tantangan menata daftar hobi menjadi kartu berjajar rapi dan tombol interaktif `:hover` | Memodifikasi palet warna, jarak antar kartu, dan efek hover |
| 72–84 | Pamer hasil | Menampilkan 4 karya terbaik/paling kreatif dan membahas pemilihan warna kontras yang nyaman dibaca | Menjelaskan alasan memilih desain dan warna pada karyanya |
| 84–90 | Penutup | Merangkum Box Model dan Flexbox, lalu mengenalkan dasar JavaScript interaktif untuk sesi 3 | Mengumpulkan tautan CodeSandbox ke pengajar untuk dicatat di laporan |

## Tantangan untuk siswa

1. **Tantangan dasar:** Posisikan kartu profil di tengah layar menggunakan Flexbox, beri latar belakang lembut, sudut melengkung (`border-radius: 12px`), dan efek `:hover` pada tombol/tautan.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Gunakan `flex-wrap: wrap` dan `@media (max-width: 600px)` agar tata letak tetap rapi di layar ponsel.

## Kunci jawaban dan solusi umum

Bagian ini hanya untuk pengajar dan tidak pernah tampil ke siswa.

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| CSS sama sekali tidak berpengaruh | Salah nama file di `href` atau titik/pagar selektor tertukar (`.` untuk class, `#` untuk id) | Cek tag `<link rel="stylesheet" href="styles.css">` di dalam `<head>` dan samakan nama class |
| Elemen menempel rapat ke tepi kartu | Lupa memberi `padding` pada kontainer | Tambahkan `padding: 24px;` pada class pembungkus kartu |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Jika ada kejadian yang mengkhawatirkan, laporkan ke admin lewat fitur laporan masalah.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan untuk setiap siswa.
