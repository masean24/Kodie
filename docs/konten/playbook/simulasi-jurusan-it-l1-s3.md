# Teaching Playbook: Simulasi Jurusan IT — Level 1 Sesi 3 (Internet of Things / IoT Virtual)

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Simulasi Jurusan IT | 1 | 3 dari 4 | 90 menit | SMP Kelas 9 & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Mengenal peran engineer **Internet of Things (IoT) & Sistem Tertanam** beserta gambaran mata kuliah Teknik Komputer / Teknik Elektro.
2. Merancang dan memprogram simulasi sistem rumah pintar (*smart home*) otomatis menggunakan sensor ultrasonik/suhu dan aktuator di **Wokwi**.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka simulator **Wokwi**: https://wokwi.com/ dengan proyek starter ESP32 / Arduino + sensor jarak HC-SR04 + LED & Buzzer.
- [ ] Siapkan diagram pin sederhana agar siswa tidak bingung saat menyambungkan `VCC`, `GND`, `TRIG`, dan `ECHO`.
- [ ] Catat observasi sementara siswa dari Sesi 1 (Software) dan Sesi 2 (Jaringan) sebagai perbandingan menuju rapor akhir di Sesi 4.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Memperkenalkan bidang IoT, sistem tertanam, serta perbedaan logika kode di layar vs kode yang mengendalikan perangkat fisik | Menjawab contoh sensor di sekitar (gerbang parkir, AC pintar, smartwatch) |
| 12–48 | Praktik terpandu | Membimbing wiring sensor HC-SR04 + LED pada ESP32 di Wokwi, lalu menulis logika pengukuran jarak (`pulseIn`) | Menguji penggeser jarak virtual di Wokwi dan melihat LED bereaksi |
| 48–72 | Tantangan | Memberikan tantangan skenario "Peringatan Garasi Pintar": nyalakan buzzer jika jarak < 50 cm dan kirim status ke Serial Monitor | Memodifikasi ambang batas jarak serta menambahkan indikator status aman vs dekat |
| 72–84 | Pamer hasil | Diskusi refleksi jurusan: apakah siswa menikmati kerja menggabungkan rangkaian perangkat keras dan kode pemrograman | Menjelaskan hasil simulasi dan ketertarikan terhadap bidang IoT |
| 84–90 | Penutup | Merangkum alur Input → Proses → Output fisik dan pratinjau Sesi 4 (AI, Sains Data & Rapor Rekomendasi Jurusan) | Mencatat refleksi pribadi untuk perbandingan di Sesi 4 |

## Tantangan untuk siswa

1. **Tantangan dasar:** Program ESP32 agar menyalakan LED merah jika objek terdeteksi dalam jarak di bawah `50 cm`, dan menyalakan LED hijau bila jarak aman.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan **buzzer** yang berbunyi lebih cepat ketika objek makin mendekat di bawah `25 cm`.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Hasil jarak sensor selalu terbaca `0 cm` | Pin `TRIG` dan `ECHO` tertukar saat wiring atau `TRIG` tidak diberi pulsa `10 microseconds` | Periksa kembali kabel pada simulator dan pastikan `digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10); digitalWrite(TRIG_PIN, LOW);` |
| LED menyala terus tanpa perubahan | Resistor atau `GND` belum tersambung rapat | Hubungkan kaki pendek LED ke resistor lalu ke pin `GND` papan |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan ingat untuk mencatat ketertarikan siswa pada bidang IoT untuk bahan pengisian Rapor Jurusan pada Sesi 4.

## Setelah kelas

Isi laporan sesi ke-3 di platform: ringkasan materi, kehadiran, catatan ketertarikan siswa terhadap bidang IoT, dan tautan simulasi Wokwi (`karya_url`).
