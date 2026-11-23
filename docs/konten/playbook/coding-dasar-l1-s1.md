# Teaching Playbook: Coding Dasar — Level 1 Sesi 1

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Coding Dasar | 1 | 1 dari 4 | 60 menit | SD (Kelas 5–6) |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami konsep instruksi berurutan (*sequence*) sebagai dasar algoritma komputer.
2. Membuat program blok sederhana di Scratch untuk menggerakkan karakter dan bersuara.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://scratch.mit.edu/projects/editor/
- [ ] Siapkan proyek contoh "Kucing Menyapa dan Berjalan" untuk didemonstrasikan.
- [ ] Pastikan akun Google Meet siap dan uji *share screen* sebelum siswa bergabung.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–08 | Pembukaan | Menyapa, *ice breaking* tebak langkah membuat mie/roti agar paham konsep instruksi berurutan | Menjawab pertanyaan pemantik dengan menyebutkan langkah secara urut |
| 08–32 | Praktik terpandu | Membagikan layar Scratch, mengenalkan area *Stage*, *Sprite*, dan blok `Events`, `Motion`, `Looks` | Mengikuti langkah pengajar memasang blok `when green flag clicked`, `move 10 steps`, `say Halo!` |
| 32–47 | Tantangan | Memberikan tantangan memodifikasi karakter agar berjalan bolak-balik dan berganti kostum | Mengerjakan tantangan secara mandiri di Scratch masing-masing |
| 47–55 | Pamer hasil | Meminta 3–5 siswa *share screen* proyeknya dan memberi apresiasi spesifik | Menunjukkan karya ke teman sekelas dan memberi tepuk tangan |
| 55–60 | Penutup | Merangkum materi *sequence* dan memberi pratinjau materi perulangan (*loop*) di sesi 2 | Menyimak rangkuman dan menanyakan hal yang belum jelas |

## Tantangan untuk siswa

1. **Tantangan dasar:** Buat karakter bergerak maju 5 kali, lalu mengucapkan nama panggilanmu selama 2 detik.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan sprite kedua sebagai teman bicara, lalu atur dialog bergantian menggunakan blok `wait 1 seconds`.

## Kunci jawaban dan solusi umum

Bagian ini hanya untuk pengajar dan tidak pernah tampil ke siswa.

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Sprite menghilang ke pinggir layar | Terlalu banyak blok `move` tanpa kembali ke tengah | Tambahkan blok `go to x: 0 y: 0` di awal setelah `when green flag clicked` |
| Bendera hijau diklik tapi tidak jalan | Blok tidak menempel pada blok topi `when green flag clicked` | Pastikan ujung lekukan blok menempel rapat dengan bunyi klik visual |
| Suara tidak terdengar | Speaker siswa kecil atau memilih `play sound` bukan `start sound` | Gunakan blok `play sound Meow until done` dan cek volume perangkat |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Jika ada kejadian yang mengkhawatirkan, laporkan ke admin lewat fitur laporan masalah.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan untuk setiap siswa.
