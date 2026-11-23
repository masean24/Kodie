# Teaching Playbook: Simulasi Jurusan IT — Level 1 Sesi 1 (Software Engineering)

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Simulasi Jurusan IT | 1 | 1 dari 4 | 90 menit | SMP Kelas 9 & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Mengenal alur kerja nyata *Software Engineer* (analisis masalah, logika kode, pengujian, dan antarmuka).
2. Membangun aplikasi web interaktif mini "Kalkulator Target Tabungan" menggunakan HTML + JavaScript di browser.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://codesandbox.io/s/vanilla
- [ ] Siapkan proyek starter HTML berisi form input target tabungan dan tabungan per minggu.
- [ ] Siapkan 1 slide ringkas gambaran kuliah jurusan Informatika / Rekayasa Perangkat Lunak (RPL).

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Memperkenalkan bidang *Software Engineering*, prospek kuliah RPL/Informatika, dan studi kasus produk nyata | Bertanya dan berbagi pengalaman memakai aplikasi favorit |
| 12–48 | Praktik terpandu | Membimbing siswa menulis fungsi JavaScript (`addEventListener`, `Number()`, percabangan `if-else`) untuk menghitung berapa minggu target tercapai | Menulis fungsi perhitungan dan menguji dengan berbagai angka input |
| 48–72 | Tantangan | Memberi tantangan menambahkan validasi input (menolak angka 0 atau negatif) dan menampilkan pesan motivasi dinamis | Mengimplementasikan validasi dan menguji kasus tepi (*edge cases*) |
| 72–84 | Pamer hasil | Diskusi refleksi: "Apakah kamu menikmati proses memecahkan bug dan merancang logika aplikasi?" | Mendemokan kalkulator dan menyampaikan kesan pribadi |
| 84–90 | Penutup | Mencatat minat siswa pada bidang Software untuk bahan rapor sesi 4, pratinjau bidang Jaringan Komputer untuk sesi 2 | Menyimak pratinjau simulasi jaringan |

## Tantangan untuk siswa

1. **Tantangan dasar:** Aplikasi menghitung `Math.ceil(target / mingguan)` dan menampilkan hasil dengan format rupiah rapi.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan fitur daftar riwayat simulasi menggunakan `document.createElement('li')` atau estimasi tanggal tercapai.

## Kunci jawaban dan solusi umum

Bagian ini hanya untuk pengajar dan tidak pernah tampil ke siswa.

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Hasil muncul `NaN` atau penjumlahan menjadi string (`"100" + "50" = "10050"`) | Nilai dari `input.value` bertipe string | Bungkus dengan `Number(input.value)` sebelum operasi aritmetika |
| Halaman *refresh* saat tombol diklik | Tombol di dalam `<form>` tanpa `event.preventDefault()` | Tambahkan `event.preventDefault()` di baris pertama fungsi handler |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Jika ada kejadian yang mengkhawatirkan, laporkan ke admin lewat fitur laporan masalah.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan ketertarikan siswa terhadap bidang Software.
