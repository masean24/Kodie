# Teaching Playbook: Coding Dasar — Level 1 Sesi 4

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Coding Dasar | 1 | 4 dari 4 | 60 menit | SD (Kelas 5–6) |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami konsep **variabel** untuk menyimpan data skor dan nyawa pemain.
2. Menggabungkan *sequence*, *loop*, kondisi *if-then*, dan variabel menjadi satu game mini utuh siap pamer ke orang tua.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://scratch.mit.edu/projects/editor/
- [ ] Siapkan proyek contoh "Game Tangkap Bintang" lengkap dengan variabel `Skor` dan layar kemenangan.
- [ ] Ingatkan siswa sejak awal sesi bahwa karya akhir bisa dibagikan tautannya di laporan sesi untuk orang tua.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–08 | Pembukaan | Menjelaskan konsep variabel dengan analogi "kotak penyimpan angka" (skor game) | Menebak apa saja angka yang berubah saat bermain game |
| 08–30 | Praktik terpandu | Membuat variabel `Skor`, mengaturnya `set Skor to 0` di awal, menambah `change Skor by 1` saat tangkap bintang | Menguji skor bertambah otomatis setiap sprite bintang tertangkap |
| 30–45 | Tantangan | Membantu siswa menambahkan kondisi menang ("Jika Skor = 10, tampilkan pesan Menang!") atau pengurangan nyawa | Memoles tampilan, suara efek, dan aturan menang/kalah game masing-masing |
| 45–55 | Pamer hasil | Mini showcase: semua siswa berkesempatan demo singkat karyanya dan saling mengapresiasi | Memainkan dan menjelaskan game mini buatan sendiri |
| 55–60 | Penutup | Merangkum seluruh perjalanan Sesi 1–4, mengajak mencoba Kodie Lab mode Blok, dan memberi ucapan selamat | Mencatat cara membagikan link karya ke orang tua |

## Tantangan untuk siswa

1. **Tantangan dasar:** Tambahkan variabel `Skor` yang dimulai dari `0` saat bendera hijau diklik dan bertambah `1` tiap kali objek sasaran berhasil disentuh.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan suara tepuk tangan dan hentikan permainan (`stop all`) ketika `Skor = 10`.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Skor terus bertambah ratusan dalam 1 detik | Objek tidak langsung berpindah/sembunyi setelah disentuh | Tambahkan `go to random position` setelah `change Skor by 1` |
| Skor tidak kembali nol saat game diulang | Lupa blok reset di awal program | Pasang `set Skor to 0` tepat di bawah `when green flag clicked` |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Pastikan judul dan teks di proyek Scratch siswa tidak memuat nama lengkap, alamat rumah, atau nomor kontak pribadi sebelum ditautkan di `karya_url`.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi Sesi 4, kehadiran, catatan apresiasi tiap siswa, serta tautan karya (`karya_url`) bila siswa sudah membagikan proyeknya.
