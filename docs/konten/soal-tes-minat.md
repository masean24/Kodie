# Soal tes minat jurusan IT

Digunakan sebagai sumber resmi untuk `seed.sql` (backend) dan data mock (frontend). Aturan mengacu pada PRD F4 dan `docs/KEPUTUSAN.md`.

## Aturan

- Ada 12 soal, masing-masing dengan 4 opsi (`A`, `B`, `C`, `D`).
- Setiap opsi memberi bobot 0–3 ke satu atau lebih bidang: **software**, **jaringan**, **iot**, **ai_data**.
- Total bobot maksimal dan agregat keempat bidang seimbang (maksimal 36 per bidang, total bobot per bidang = 39).
- Rumus persentase: `ROUND(skor_bidang / jumlah_skor_keempat_bidang * 100)`.
- Jika nilainya seri, prioritasnya: `software` > `jaringan` > `iot` > `ai_data`.

---

### Soal 1

**Teks:** Saat ada waktu luang di depan komputer, kamu paling suka…

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Membuat website atau aplikasi kecil | 3 | 0 | 0 | 0 |
| B | Mengotak-atik pengaturan Wi-Fi dan koneksi internet | 0 | 3 | 0 | 0 |
| C | Merakit atau memprogram alat seperti lampu otomatis | 0 | 0 | 3 | 0 |
| D | Mencari pola dari data, misalnya statistik game favorit | 0 | 0 | 0 | 3 |

### Soal 2

**Teks:** Jika sekolahmu mengadakan proyek teknologi, peran mana yang paling ingin kamu ambil?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Merancang tampilan dan alur fitur aplikasi untuk pengguna | 3 | 0 | 0 | 0 |
| B | Memastikan semua perangkat terhubung lancar ke server sekolah | 0 | 3 | 0 | 0 |
| C | Menghubungkan sensor suhu dan gerak ke papan mikrokontroler | 0 | 0 | 3 | 0 |
| D | Mengolah hasil survei siswa menjadi grafik dan prediksi | 0 | 0 | 0 | 3 |

### Soal 3

**Teks:** Masalah sehari-hari mana yang paling membuatmu tertantang untuk menyelesaikannya?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Aplikasi antrean kantin yang lambat dan membingungkan | 3 | 0 | 0 | 1 |
| B | Jaringan internet rumah yang sering putus atau lambat | 0 | 3 | 1 | 0 |
| C | Tanaman di rumah layu karena lupa disiram saat bepergian | 1 | 0 | 3 | 0 |
| D | Sulit memilih topik belajar yang paling efektif dari nilai ujian | 0 | 1 | 0 | 3 |

### Soal 4

**Teks:** Video atau tutorial teknologi apa yang paling sering menarik perhatianmu di media sosial?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Cara membuat game atau aplikasi mobile dari nol | 3 | 0 | 0 | 0 |
| B | Cara kerja peretas (hacker) etis menjaga keamanan sistem | 0 | 3 | 0 | 0 |
| C | Eksperimen robot mini atau smart home dengan Arduino/ESP32 | 0 | 0 | 3 | 0 |
| D | Bagaimana kecerdasan buatan (AI) mengenali gambar atau suara | 0 | 0 | 0 | 3 |

### Soal 5

**Teks:** Ketika belajar hal baru di bidang teknologi, metode mana yang paling membuatmu bersemangat?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Menulis kode baris demi baris sampai fitur berjalan di layar | 3 | 0 | 0 | 0 |
| B | Menguji jalur koneksi data dan menganalisis paket jaringan | 0 | 3 | 0 | 0 |
| C | Menyambungkan kabel, resistor, LED, dan melihatnya menyala sesuai kode | 0 | 0 | 3 | 0 |
| D | Melatih komputer menebak hasil berdasarkan kumpulan contoh data | 0 | 0 | 0 | 3 |

### Soal 6

**Teks:** Bayangkan kamu bekerja di tim pembuat mobil pintar tanpa pengemudi. Bagian mana yang paling seru menurutmu?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Membuat layar dasbor navigasi yang dipakai penumpang | 3 | 0 | 0 | 0 |
| B | Mengatur komunikasi data antara mobil dan server lalu lintas secara aman | 0 | 3 | 0 | 0 |
| C | Mengatur sensor jarak, kamera, dan motor penggerak roda | 0 | 0 | 3 | 0 |
| D | Melatih sistem agar mobil bisa mengenali rambu jalan dan pejalan kaki | 0 | 0 | 0 | 3 |

### Soal 7

**Teks:** Jika sebuah aplikasi populer tiba-tiba bermasalah, apa hal pertama yang paling membuatmu penasaran?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Apakah ada kesalahan logika (bug) pada kode programnya? | 3 | 1 | 0 | 0 |
| B | Apakah servernya kelebihan beban atau ada serangan jaringan? | 0 | 3 | 0 | 1 |
| C | Apakah perangkat keras atau sensor pengirim sinyalnya terputus? | 0 | 0 | 3 | 0 |
| D | Apakah data masukan yang diproses sistemnya salah format? | 1 | 0 | 1 | 3 |

### Soal 8

**Teks:** Mata pelajaran atau topik sekolah mana yang paling sering terasa nyambung dengan caramu berpikir?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Membuat alur langkah (algoritma) yang rapi dan terstruktur | 3 | 0 | 0 | 0 |
| B | Memahami sistem komunikasi, protokol, dan keamanan data | 0 | 3 | 0 | 0 |
| C | Fisika listrik, rangkaian elektronik, dan cara kerja mesin | 0 | 0 | 3 | 0 |
| D | Matematika statistika, peluang, dan membaca tren dari angka | 0 | 0 | 0 | 3 |

### Soal 9

**Teks:** Di akhir pekan, kamu diberi satu paket proyek IT. Proyek mana yang langsung ingin kamu buka duluan?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Membangun website catatan tugas sekolah yang bisa diakses teman sekelas | 3 | 0 | 0 | 0 |
| B | Membangun jaringan lokal (LAN) mini dan memblokir situs berbahaya | 0 | 3 | 0 | 0 |
| C | Membuat tempat sampah pintar yang otomatis terbuka saat tangan mendekat | 0 | 0 | 3 | 0 |
| D | Membuat program yang merekomendasikan film berdasarkan riwayat tontonan | 0 | 0 | 0 | 3 |

### Soal 10

**Teks:** Alat atau lingkungan kerja mana yang paling membuatmu betah berlama-lama?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Editor kode untuk membangun tampilan dan logika aplikasi | 3 | 0 | 0 | 0 |
| B | Terminal jaringan dan diagram topologi koneksi antar server | 0 | 3 | 0 | 0 |
| C | Meja eksperimen berisi mikrokontroler, kabel jumper, dan simulator alat | 0 | 0 | 3 | 0 |
| D | Notebook analisis data berisi tabel angka, grafik, dan model prediksi | 0 | 0 | 0 | 3 |

### Soal 11

**Teks:** Saat kamu bermain game online bersama teman, hal teknis apa yang paling menarik perhatianmu?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Desain menu, sistem inventori, dan logika mekanik permainannya | 3 | 0 | 0 | 0 |
| B | Bagaimana server menghubungkan jutaan pemain tanpa lag (ping kecil) | 0 | 3 | 0 | 0 |
| C | Bagaimana controller atau perangkat VR mengirim getaran dan sensor gerak | 0 | 0 | 3 | 0 |
| D | Bagaimana bot lawan (AI) belajar membaca strategi permainan kita | 0 | 0 | 0 | 3 |

### Soal 12

**Teks:** Lima tahun lagi, pencapaian kerja mana yang paling membuatmu bangga?

| Opsi | Teks | software | jaringan | iot | ai_data |
| --- | --- | --- | --- | --- | --- |
| A | Aplikasi buatanku dipakai ratusan ribu pelajar di Indonesia | 3 | 0 | 0 | 0 |
| B | Infrastruktur jaringan dan pertahanan siber perusahaan aman karena rancangan timku | 0 | 3 | 0 | 0 |
| C | Alat pintar hasil rancanganku membantu petani atau rumah sakit bekerja otomatis | 0 | 0 | 3 | 0 |
| D | Model data dan AI buatanku membantu mengambil keputusan penting secara akurat | 0 | 0 | 0 | 3 |
