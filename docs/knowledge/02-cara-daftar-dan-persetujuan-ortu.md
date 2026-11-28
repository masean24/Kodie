# Cara Pendaftaran Akun, Persetujuan Orang Tua, dan Verifikasi Pengajar

## Peran Pengguna di Kodie

Di platform Kodie terdapat 3 peran pendaftaran:
1. **Orang Tua / Wali Siswa** — daftar melalui halaman `/daftar`.
2. **Siswa Mandiri (khusus SMP dan SMA)** — daftar melalui halaman `/daftar`.
3. **Pengajar** — melamar dan membuat akun pengajar melalui halaman rekrutmen **`/karier`** (tautan `/daftar?peran=pengajar` otomatis diarahkan ke `/karier`).

## Aturan Pendaftaran Siswa TK/SD vs SMP/SMA

### Siswa TK dan SD
- Siswa jenjang **TK** dan **SD** **tidak memiliki akun login sendiri**.
- Orang tua mendaftar menggunakan peran **Orang Tua**, lalu masuk ke menu **Profil Anak** (`/orang-tua/anak`) untuk menambahkan data anak (nama lengkap, tanggal lahir, jenjang **TK** atau **SD**, tingkat kelas: **0** untuk TK atau **1–6** untuk SD, serta nama sekolah/TK).
- Satu akun orang tua dapat mendaftarkan dan mengelola satu atau beberapa profil anak sekaligus (baik TK, SD, SMP, maupun SMA).

### Siswa SMP dan SMA yang Mendaftar Sendiri (Persetujuan Orang Tua)
Sesuai **Pasal 25 UU Pelindungan Data Pribadi (UU PDP)**, akun siswa di bawah 18 tahun yang mendaftar sendiri wajib mendapat persetujuan orang tua sebelum dapat memesan kelas:
1. Siswa SMP atau SMA mendaftar di halaman `/daftar` dengan mengisi nama lengkap, tanggal lahir, jenjang (SMP/SMA), kelas, nama sekolah, serta nama dan email orang tua.
2. Setelah mendaftar, status akun siswa adalah **`menunggu_persetujuan`** dan siswa diarahkan ke halaman `/siswa/persetujuan`.
3. Selama menunggu persetujuan, siswa **sudah boleh** melihat katalog program dan mengerjakan **Tes Minat Jurusan IT**, tetapi **belum bisa membuat booking kelas**.
4. Di halaman `/siswa/persetujuan`, sistem membuat **Link Persetujuan sekali pakai** yang berlaku selama **7 hari**. Siswa dapat menekan tombol **Salin Link** atau **Kirim via WhatsApp** ke orang tuanya.
5. Orang tua membuka link `/persetujuan/{token}` tersebut, membaca rincian data yang dikumpulkan serta aturan keamanan kelas, lalu memilih:
   - **Setujui:** Orang tua login atau membuat akun orang tua di halaman tersebut. Status siswa langsung berubah menjadi **`aktif`**, akun siswa otomatis terhubung ke dashboard orang tua, dan siswa sudah bisa memesan kelas.
   - **Tolak:** Status siswa berubah menjadi **`ditolak_orang_tua`** dan tidak dapat memesan kelas.
6. Jika link sudah kedaluwarsa (lewat 7 hari), siswa dapat membuat link persetujuan baru dari halaman `/siswa/persetujuan` (link lama otomatis tidak berlaku).

## Pendaftaran dan Verifikasi Pengajar (`/karier`)

Mahasiswa, lulusan, atau pencari kerja paruh waktu dapat bergabung menjadi pengajar di Kodie:
1. Buka halaman **Karier Pengajar** di `/karier`, pilih salah satu dari 6 posisi yang tersedia (misalnya *Pengajar Coding Dasar*, *Pengajar Python*, *Pengajar Pengembangan Web*, *Pengajar Jaringan Komputer*, *Pengajar IoT dan Arduino*, atau *Pengajar AI dan Data*), lalu buat akun pengajar pada halaman detail posisi tersebut (`/karier/[slug]`). Status awal akun adalah **`menunggu_verifikasi`**.
2. Setelah login, buka halaman **Profil Pengajar** (`/mengajar/profil`) untuk melengkapi:
   - Status kerja (Mahasiswa, Lulusan, atau Pencari Kerja), nama kampus, dan jurusan.
   - Bidang keahlian (Software, Jaringan, IoT, AI & Data) dan **program yang ingin diajar**.
   - Tautan CV atau portofolio, foto profil, unggahan **Kartu Identitas (KTP atau KTM)**, dan unggahan **SKCK** (format JPG/PNG/PDF, maksimal 2 MB).
3. Tim Admin Kodie akan memeriksa dokumen dan melakukan wawancara singkat.
4. Setelah **KTP/KTM, SKCK, dan wawancara selesai** diverifikasi Admin, status pengajar berubah menjadi **`terverifikasi`**.
5. Hanya pengajar berstatus **`terverifikasi`** yang profilnya tampil di halaman publik dan dapat membuka kelas baru sesuai program yang disetujui Admin. Pengajar juga dapat menambahkan riwayat **pengalaman** dan **sertifikat** pada halaman `/mengajar/profil` agar tampil di profil publik pengajar, serta membuat **kode referral pengajar** unik.
6. Pengajar menerima **bagi hasil per sesi** setiap kali selesai mengajar dan mengirimkan **Laporan Sesi**: **30%** dari pendapatan paket berbayar per sesi (atau **40%** untuk siswa paket yang mendaftar memakai kode referral milik pengajar tersebut), dibagi jumlah sesi program.
