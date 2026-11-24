# Teaching Playbook: Kelas Reguler Teknologi — Level 1 Sesi 4

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Kelas Reguler Teknologi | 1 | 4 dari 4 | 90 menit | SMP & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami cara kerja sistem **IoT virtual** (input sensor → pemrosesan mikrokontroler → output aktuator LED/buzzer) di simulator **Wokwi**.
2. Mengenal konsep dasar **AI klasifikasi teks** sederhana dan menghubungkannya dengan proyek teknologi di browser.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka simulator IoT gratis: https://wokwi.com/ (proyek Arduino Uno / ESP32 starter dengan sensor cahaya LDR & LED).
- [ ] Siapkan tab Kodie Lab (`/lab`) mode Python atau JavaScript untuk demonstrasi aturan klasifikasi kata sederhana.
- [ ] Tinjau catatan perkembangan Sesi 1–3 agar dapat merekomendasikan Level 2 atau Simulasi Jurusan IT pada catatan laporan akhir.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Mengulas proyek web Sesi 1–3 dan memperlihatkan bagaimana komputer bisa "merasakan" dunia nyata lewat sensor IoT & memahami bahasa lewat AI | Menyebutkan contoh perangkat pintar dan fitur AI yang pernah mereka pakai |
| 12–48 | Praktik terpandu | Merakit rangkaian virtual LED + sensor LDR di Wokwi dan menulis fungsi `loop()` agar lampu menyala otomatis saat ruangan gelap | Mengubah nilai ambang batas (*threshold*) cahaya di simulator Wokwi dan mengamati perubahan nyala LED |
| 48–72 | Tantangan | Memberikan tantangan menyambungkan pengukur suhu/buzzer serta menyusun skrip Python pengelompokan komentar (positif vs perlu bantuan) di Kodie Lab | Menguji batas sensor dan memodifikasi daftar kata kunci klasifikasi teks |
| 72–84 | Pamer hasil | Showcase mini Sesi 4: siswa menunjukkan simulasi IoT atau skrip klasifikasi mereka dan merefleksikan bidang yang paling disukai | Berbagi karya terbaik selama 4 sesi dan bertanya jawab |
| 84–90 | Penutup | Merangkum seluruh Level 1 (Web, Logika JS/Python, IoT Virtual, AI Dasar) dan menyampaikan saran kelanjutan ke Level 2 atau Simulasi Jurusan IT | Menyimak rangkuman akhir paket |

## Tantangan untuk siswa

1. **Tantangan dasar (Wokwi):** Buat LED otomatis menyala ketika intensitas cahaya dari sensor LDR turun di bawah ambang `500`, dan padam saat terang.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan LED kedua sebagai indikator siaga dan cetak pembacaan nilai sensor ke *Serial Monitor* setiap 1 detik.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| LED virtual tidak menyala saat simulasi dijalankan | Pin di kode `pinMode` tidak sama dengan kabel di breadboard, atau LED terbalik polaritas | Cocokkan nomor pin GPIO pada diagram Wokwi dengan konstanta di kode, dan pastikan kaki katoda terhubung ke `GND` melalui resistor |
| Serial Monitor tidak memunculkan angka | Lupa memanggil `Serial.begin(115200)` / `Serial.begin(9600)` | Tambahkan `Serial.begin(115200);` di dalam `setup()` |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Pastikan siswa tidak menaruh data pribadi asli saat menguji teks masukan pada simulasi AI maupun web.

## Setelah kelas

Isi laporan sesi ke-4 di platform: ringkasan materi, kehadiran, evaluasi menyeluruh untuk orang tua, dan tautan karya terbaik siswa.
