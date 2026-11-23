# Teaching Playbook: Simulasi Jurusan IT — Level 1 Sesi 2 (Jaringan Komputer & Keamanan Siber)

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Simulasi Jurusan IT | 1 | 2 dari 4 | 90 menit | SMP Kelas 9 & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami cara data berpindah di internet melalui alamat IP, DNS, router, dan protokol HTTP/HTTPS.
2. Melakukan simulasi inspeksi jaringan (*Network Tab* browser & simulator alur paket) serta membedakan koneksi aman vs rentan.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://www.packettracernetwork.com/ atau Chrome DevTools (`Network` tab) & simulator DNS.
- [ ] Siapkan skenario studi kasus: "Apa yang terjadi saat mengetik `google.com` sampai halaman muncul?"
- [ ] Baca catatan sesi 1 agar tahu siswa mana yang lebih tertarik pada logika sistem vs visual.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Memperkenalkan bidang Jaringan Komputer & Keamanan Siber (*Cybersecurity*), gambaran kuliah Teknik Komputer | Menjawab kuis singkat tentang IP Address dan fungsi Wi-Fi router |
| 12–48 | Praktik terpandu | Membimbing siswa membuka DevTools > Network untuk melihat HTTP Request, Status Code (`200`, `404`, `500`), latency, dan sertifikat HTTPS | Memeriksa request di browser masing-masing dan mencatat kode status serta waktu respons |
| 48–72 | Tantangan | Memberikan skenario investigasi masalah jaringan (situs error 404, server down, serta simulasi mengenali tautan *phishing* dan header keamanan) | Menganalisis 4 kasus studi jaringan dan mempresentasikan temuannya |
| 72–84 | Pamer hasil | Diskusi kelompok dan refleksi: apakah siswa menyukai pekerjaan investigasi sistem, arsitektur koneksi, dan pertahanan siber | Menyampaikan temuan kasus dan ketertarikannya terhadap bidang jaringan |
| 84–90 | Penutup | Merangkum materi jaringan & keamanan, memberi pratinjau sesi 3 (IoT menggunakan simulator mikrokontroler Wokwi) | Menyimak instruksi persiapan sesi IoT |

## Tantangan untuk siswa

1. **Tantangan dasar:** Temukan 3 tipe file berbeda di tab Network (HTML, CSS/JS, Gambar), catat status code dan ukurannya, lalu identifikasi mana yang paling lambat dimuat.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Lakukan pengecekan pesan JSON dari API publik sederhana dan jelaskan bagian *Request Headers* vs *Response Headers*.

## Kunci jawaban dan solusi umum

Bagian ini hanya untuk pengajar dan tidak pernah tampil ke siswa.

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Tab Network terlihat kosong saat dibuka | Tab dibuka setelah halaman selesai dimuat | Tekan `Ctrl+R` / `Cmd+R` setelah tab Network dibuka agar semua request terekam |
| Siswa bingung membedakan `404` dan `500` | Belum paham posisi klien vs server | Jelaskan analogi restoran: `404` = menu tidak ada di daftar, `500` = dapur rusak saat memasak |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Tekankan etika keamanan siber: pengujian hanya dilakukan pada sistem sendiri atau simulator legal, dilarang keras menyerang situs pihak lain.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, dan catatan ketertarikan siswa terhadap bidang Jaringan & Keamanan Siber.
