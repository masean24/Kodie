# Teaching Playbook: Coding Dasar — Level 1 Sesi 3

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Coding Dasar | 1 | 3 dari 4 | 60 menit | SD (Kelas 5–6) |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami konsep percabangan kondisi (*if-then*) di Scratch sebagai cara komputer mengambil keputusan.
2. Membuat interaksi karakter yang merespons sentuhan warna/rintangan serta tombol arah keyboard.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://scratch.mit.edu/projects/editor/
- [ ] Siapkan proyek contoh "Kucing Hindari Rintangan" dengan dua warna jalur berbeda.
- [ ] Baca catatan siswa dari sesi 2 untuk menyiapkan pendampingan tambahan bila perlu.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–08 | Pembukaan | Bermain kuis "Jika hujan → buka payung; jika panas → pakai topi" untuk mengenalkan logika *if-then* | Menjawab contoh sebab-akibat di kehidupan sehari-hari |
| 08–32 | Praktik terpandu | Mendemonstrasikan blok `if ... then`, `touching color?`, dan kontrol `when [up/down/left/right arrow] key pressed` | Menggerakkan sprite dengan tombol panah dan memberi reaksi saat menyentuh warna rintangan |
| 32–47 | Tantangan | Memberi tantangan menambahkan objek bintang bonus yang hilang dan berbunyi saat disentuh | Membuat dua kondisi berbeda: satu untuk rintangan dan satu untuk bonus |
| 47–55 | Pamer hasil | Meminta 3–4 siswa membagikan layar dan mencoba kontrol keyboard karyanya | Menunjukkan mekanik kondisi yang sudah dibuat |
| 55–60 | Penutup | Merangkum hubungan *sequence*, *loop*, dan *if-then*; memberi pratinjau pembuatan skor game di sesi 4 | Menyimpan proyek Scratch agar bisa dilanjutkan minggu depan |

## Tantangan untuk siswa

1. **Tantangan dasar:** Buat karakter bergerak dengan 4 tombol panah dan kembali ke titik awal (`go to x: -180 y: 0`) jika menyentuh garis rintangan merah.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan rintangan kedua yang bergerak perlahan dengan loop `forever` sehingga permainan lebih menantang.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Blok `if touching color` hanya jalan sekali di awal | Blok `if` tidak dibungkus loop `forever` | Masukkan seluruh blok `if ... then` ke dalam blok `forever` |
| Warna pada `touching color` tidak terdeteksi | Warna dipilih manual, bukan memakai pipet (*eyedropper*) | Klik kotak warna pada blok lalu pakai ikon pipet ke rintangan di Stage |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Jika ada kejadian yang mengkhawatirkan, laporkan ke admin lewat fitur laporan masalah.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan perkembangan logika setiap siswa.
