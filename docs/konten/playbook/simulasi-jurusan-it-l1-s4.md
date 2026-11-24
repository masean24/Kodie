# Teaching Playbook: Simulasi Jurusan IT — Level 1 Sesi 4 (AI & Sains Data + Rapor Jurusan)

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Simulasi Jurusan IT | 1 | 4 dari 4 | 90 menit | SMP Kelas 9 & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami peran bidang **Kecerdasan Buatan (AI) & Sains Data** beserta gambaran kuliah Ilmu Komputer / Sains Data.
2. Mencoba eksperimen klasifikasi teks AI sederhana, mengevaluasi kapan model bisa keliru, dan merefleksikan minat pribadi dari keempat bidang IT.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan notebook starter: https://colab.research.google.com/ (atau jalankan latihan klasifikasi Python di `/lab` Kodie Lab bila akun Google tidak tersedia).
- [ ] Tinjau catatan Sesi 1 (Software), Sesi 2 (Jaringan), dan Sesi 3 (IoT) untuk setiap siswa guna mengisi **Rapor Rekomendasi Jurusan** di akhir sesi.
- [ ] Ingat kriteria rapor wajib (F11): setiap siswa yang **hadir** di Sesi 4 `simulasi-jurusan-it` wajib diisi skor 1–5 untuk ke-4 bidang + bidang rekomendasi + alasan + saran.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Mengulas pengalaman mencoba 3 bidang sebelumnya (Software, Jaringan, IoT) lalu memperkenalkan bagaimana AI belajar dari data | Berbagi momen paling seru dari Sesi 1–3 |
| 12–48 | Praktik terpandu | Menjalankan model klasifikasi sentimen kalimat sederhana (Naive Bayes / TF-IDF di Colab atau pembobotan kata di Kodie Lab) | Mengamati proses training data vs prediksi kalimat baru |
| 48–72 | Tantangan | Menantang siswa menguji 5 kalimat jebakan (sarkasme/negasi seperti *"tidak buruk"*) dan mencatat kapan AI salah tebak | Menemukan batas kemampuan model dan menjelaskan penyebab kesalahannya |
| 72–84 | Pamer hasil & refleksi | Memandu diskusi pemilihan bidang: Software Engineering, Jaringan & Keamanan Siber, IoT, atau AI & Sains Data | Menyampaikan peringkat minat masing-masing dan jurusan kuliah yang ingin dijajaki |
| 84–90 | Penutup | Menjelaskan bahwa **Rapor Rekomendasi Jurusan** akan segera terkirim ke dashboard siswa & orang tua sebagai saran eksplorasi | Menyimak penutup paket Simulasi Jurusan IT |

## Tantangan untuk siswa

1. **Tantangan dasar:** Uji minimal 5 kalimat komentar buatan sendiri dan catat berapa kalimat yang berhasil ditebak tepat oleh model.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan 4 data contoh kalimat bernegasi/sarkasme ke data latih, jalankan ulang pelatihan model, lalu amati apakah akurasi membaik.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| Kalimat *"tidak buruk"* terklasifikasi negatif | Model hanya melihat frekuensi kata terpisah (*bag-of-words*) sehingga kata *"buruk"* mendominasi tanpa memahami *"tidak"* | Jelaskan pentingnya konteks urutan kata (*n-gram* / *attention* pada model modern) serta menambah data contoh bervariasi |
| Google Colab meminta login yang tidak dimiliki siswa | Sesi diikuti tanpa akun Google pribadi | Arahkan siswa langsung menyalin logika Python ke **Kodie Lab (`/lab`) mode Python** tanpa akun |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Ingatkan siswa dan orang tua bahwa Rapor Rekomendasi Jurusan adalah **saran berbasis observasi praktik 4 sesi**, bukan penentu mutlak jurusan kuliah.

## Setelah kelas

**Wajib setelah sesi selesai:** Isi laporan sesi Sesi 4 sekaligus lengkapi **Rapor Rekomendasi Jurusan** (skor 1–5 Software, Jaringan, IoT, AI & Data, bidang rekomendasi, alasan min. 2 kalimat, serta saran lanjutan) untuk setiap siswa yang hadir.
