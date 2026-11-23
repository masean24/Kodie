# Panduan Booking Kelas, Pembayaran, Masuk Kelas, dan Laporan Sesi

## 1. Memilih Kelas dan Membuat Booking (`/kelas`)

1. Buka katalog kelas di `/kelas`. Anda dapat menyaring kelas berdasarkan **Program**, **Jenjang (SD/SMP/SMA)**, **Hari**, dan **Jam**.
2. Setiap kartu kelas menampilkan nama pengajar terverifikasi, jadwal mingguan (4 sesi), harga paket, serta **sisa kursi** (misalnya *"3 dari 15 kursi tersisa"*).
3. Kelas yang kursinya sudah penuh atau sesi pertamanya sudah lewat tidak dapat dipesan.
4. Klik **Pesan** pada kelas yang sesuai dengan jenjang dan kelas siswa. Satu siswa tidak bisa memiliki dua booking aktif di kelas yang sama.
5. Setelah booking dibuat:
   - Kursi otomatis **ditahan selama 24 jam** dengan status **`menunggu_pembayaran`**.
   - Anda mendapatkan kode booking unik (contoh: `BK-20261124-0007`).

## 2. Cara Pembayaran Manual (Transfer Bank / QRIS)

1. Buka halaman detail booking Anda di `/orang-tua/booking/[id]` atau `/siswa/booking/[id]`.
2. Halaman pembayaran menampilkan:
   - Total tagihan rupiah dan batas waktu pembayaran (24 jam).
   - Nomor rekening tujuan, nama bank, nama pemilik rekening resmi platform, serta gambar **QRIS** yang dapat dipindai.
3. Lakukan transfer atau pembayaran QRIS sesuai nominal, lalu **unggah bukti bayar** (format **JPG, PNG, atau PDF**, ukuran maksimal **2 MB**).
4. Setelah bukti diunggah, status booking berubah menjadi **`menunggu_verifikasi`**.
5. Admin Kodie akan memeriksa bukti pembayaran Anda:
   - **Jika Disetujui:** Status booking berubah menjadi **`terkonfirmasi`** dan Anda mendapatkan notifikasi real-time.
   - **Jika Ditolak:** Status booking kembali ke **`menunggu_pembayaran`** disertai alasan penolakan dari Admin, dan batas waktu pembayaran otomatis **diperpanjang 24 jam** sejak saat ditolak agar Anda bisa mengunggah ulang bukti yang benar.
6. **Pembatalan & Kedaluwarsa:**
   - Anda dapat membatalkan booking sendiri selama bukti bayar belum diunggah.
   - Jika melewati batas 24 jam tanpa unggahan bukti bayar, booking otomatis berstatus **`kedaluwarsa`** dan kursi dilepas kembali ke katalog.

## 3. Cara Masuk Kelas Google Meet

- Semua sesi kelas daring dilaksanakan melalui **Google Meet** yang ruang rapatnya dibuat otomatis oleh sistem Kodie untuk setiap sesi.
- Demi keamanan siswa, **link Google Meet tidak pernah ditampilkan di halaman publik**.
- Tombol **Masuk Kelas** di halaman detail sesi (`/orang-tua/sesi/[id]`, `/siswa/sesi/[id]`, atau `/mengajar/kelas/[id]`) hanya aktif apabila:
  1. Status booking sudah **`terkonfirmasi`** (atau Anda adalah pengajar pemilik kelas tersebut).
  2. Waktu saat ini berada dalam jendela **15 menit sebelum sesi dimulai sampai jam sesi berakhir**.
- Sistem juga mengirimkan pengingat notifikasi di aplikasi **1 jam sebelum sesi dimulai**.
- Pengajar dapat menggeser jadwal sesi maksimal **24 jam sebelum sesi dimulai**; jika jadwal digeser, siswa dan orang tua otomatis menerima notifikasi di aplikasi.

## 4. Laporan Setelah Kelas, Rating, dan Lapor Masalah

- **Laporan Sesi Real-time:** Setelah kelas selesai, pengajar mengisi ringkasan materi, daftar kehadiran, catatan perkembangan individu untuk setiap siswa yang hadir, dan tautan hasil karya siswa. Begitu laporan dikirim, laporan langsung muncul **secara real-time tanpa refresh** di dashboard siswa dan orang tua.
- **Privasi Catatan Siswa:** Siswa dan orang tua hanya dapat melihat catatan untuk siswa mereka sendiri, tidak pernah bisa melihat catatan siswa lain di kelas yang sama.
- **Memberi Rating:** Setelah laporan sesi dikirim pengajar, siswa atau orang tua dapat memberikan rating **1–5 bintang** dan komentar ulasan untuk sesi tersebut.
- **Melaporkan Masalah:** Jika terdapat kendala (kategori: *Perilaku tidak pantas*, *Pengajar tidak hadir*, *Masalah teknis*, atau *Lainnya*), siswa atau orang tua dapat mengirim **Laporan Masalah** dari halaman sesi atau profil pengajar. Laporan kategori *Perilaku tidak pantas* otomatis mendapat **prioritas tinggi** di antrean Admin.
