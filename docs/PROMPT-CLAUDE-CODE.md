# Prompt untuk Claude Code (Frontend — Kodie)

Cara pakai: buka Claude Code di **root repository** (bukan di dalam `frontend/`), lalu salin isi blok prompt apa adanya. Kirim satu prompt per sesi. Mulai prompt berikutnya setelah sesi sebelumnya selesai dan sudah kamu cek.

> **PENTING UNTUK TIM FRONTEND (FAHIM):**
> Backend Supabase Cloud (`https://auwmoqxkilpaxfwacozm.supabase.co`) **SUDAH 100% SELESAI DAN AKTIF** beserta 26 tabel, RLS, 8 view, 28 RPC, 4 Storage bucket, 2 Edge Functions (`buat-meet` & `chat`), data seed lengkap, dan 9 akun demo.
> Baca **`docs/SERAH-TERIMA-FE.md`** terlebih dahulu dan isi `frontend/.env.local` sebelum memulai!

---

## Prompt 1: Fondasi Frontend, Koneksi Supabase Cloud & Halaman Publik

```text
Kamu mengerjakan frontend untuk karya lomba SEVENT X (nama website: **Kodie**) di monorepo ini. Area kerjamu hanya folder `frontend/`. Jangan mengubah `backend/` dan jangan mengubah `docs/PRD.md`.

Sebelum menulis kode apa pun, baca file ini secara berurutan:
1. `CLAUDE.md`
2. `frontend/CLAUDE.md`
3. `docs/KEPUTUSAN.md` (berisi keputusan terbaru yang meng-override PRD, termasuk nama website **Kodie**, harga program, kolom tambahan, dan fitur AI Chatbot **Kiko**)
4. `docs/SERAH-TERIMA-FE.md` (berisi kontrak lengkap Backend Supabase Cloud yang SUDAH 100% aktif, daftar 8 view, 28 RPC, dan 9 akun demo)
5. `docs/PRD.md`, fokus pada bagian 1, 2, 3, 4 (terutama F4 dan F5), 6, 7, 8, dan 10

Tujuan sesi ini: fondasi frontend, menyalin tipe resmi dari `backend/supabase/types/database.ts`, menyiapkan lapisan data `src/lib/api/` (lengkap implementasi Supabase asli DAN mock), serta membangun semua halaman publik.

Kerjakan dengan urutan ini:

1. Tulis rencana singkat: struktur folder, daftar halaman, dan daftar fungsi di `src/lib/api/`. Tunjukkan ke saya dan TUNGGU persetujuan sebelum lanjut.

2. Scaffold Next.js (App Router, TypeScript, Tailwind CSS, ESLint, folder `src/`) ke dalam `frontend/`. Folder itu sudah berisi `CLAUDE.md` dan `.env.example`, jadi scaffold dulu ke folder sementara, lalu pindahkan isinya ke `frontend/` tanpa menimpa dua file tersebut. Tambahkan script `"typecheck": "tsc --noEmit"`. Jika `frontend/.env.local` belum ada, salin dari `.env.example`.

3. Pasang `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `zod`, dan `lucide-react`.
   - Salin file tipe resmi `backend/supabase/types/database.ts` ke `frontend/src/types/database.ts` (JANGAN menulis tipe manual karena backend sudah selesai dan file tipe resmi sudah tersedia!).
   - Siapkan client Supabase bertipe `Database` untuk browser dan server di `src/lib/supabase/` sesuai dokumentasi resmi `@supabase/ssr` untuk versi Next.js yang terpasang.

4. Buat lapisan data `src/lib/api/` dengan dua implementasi (**Supabase asli** dan **mock**) yang dipilih lewat `NEXT_PUBLIC_USE_MOCK === 'true'`. Karena backend Supabase Cloud sudah siap, **implementasikan keduanya sekaligus** (jangan buat stub untuk Supabase!) untuk fungsi berikut:
   - `ambilDaftarProgram()` dan `ambilProgram(slug)`, dari tabel `program` (`aktif = true`)
   - `ambilKatalogKelas(filter)` dan `ambilKelas(id)`, dari view `kelas_katalog` (termasuk `sisa_kursi`, `kursi_terpakai`, `bisa_dibooking`, `hari_mingguan`, tanpa `meet_uri`)
   - `ambilDaftarPengajarPublik()` dan `ambilPengajarPublik(id)`, dari view `pengajar_publik`
   - `ambilSoalMinat()`, dari view `soal_minat_publik` (tanpa bobot)
   - `hitungTesMinat(jawaban, siswaId?)`, memanggil RPC `hitung_tes_minat`

5. Isi data mock di `src/lib/mock/` sebagai fallback yang bentuknya sama persis dengan tipe `Database`:
   - 3 program sesuai `docs/KEPUTUSAN.md`: Coding Dasar (SD kls 5–6, 60 menit, Rp200.000), Kelas Reguler Teknologi (SMP/SMA kls 7–12, 90 menit, Rp275.000), Simulasi Jurusan IT (SMP 9/SMA 10–12, 90 menit, Rp300.000).
   - 6 kelas (termasuk 1 kelas penuh), 3 pengajar terverifikasi, dan 12 soal tes minat dari `docs/konten/soal-tes-minat.md`.

6. Buat utilitas di `src/lib/`:
   - `format.ts`: format tanggal WIB (`"Senin, 24 November 2026, 19.00 WIB"`) dan format rupiah (`"Rp275.000"`).
   - `errors.ts`: peta seluruh kode error PRD bagian 8 (`VALIDASI_GAGAL`, `TIDAK_BERHAK`, `SISWA_BELUM_DISETUJUI`, `PENGAJAR_BELUM_TERVERIFIKASI`, `KAPASITAS_TIDAK_VALID`, `TOKEN_TIDAK_BERLAKU`, `KELAS_PENUH`, `BOOKING_GANDA`, `JADWAL_BENTROK`, `FILE_TIDAK_VALID`, `SESI_BELUM_DIBUKA`, `LINK_MEET_BELUM_ADA`, `LAPORAN_TERKUNCI`) ke pesan bahasa Indonesia yang ramah.
   - `peran.ts`: aturan akses rute per peran (PRD bagian 3 dan 6).

7. Buat layout dan komponen dasar:
   - Skip link, Header dengan brand **Kodie**, navigasi publik (`/program`, `/kelas`, `/tes-minat`), tombol Masuk (`/masuk`) dan Daftar (`/daftar`), serta Footer (termasuk link `/kebijakan-privasi`).
   - Komponen `src/components/ui/`: `Button`, `Card`, `Badge`, `Input`, `Select`, `Skeleton`, `EmptyState`, dan `ErrorState`. Simpan semua token desain sebagai CSS variables.

8. Buat halaman publik sesuai PRD bagian 6:
   - `/` : beranda **Kodie** (masalah, cara kerja, tiga program, pengajar terverifikasi, ajakan tes minat)
   - `/program` dan `/program/[slug]`
   - `/kelas` : katalog dengan filter program, jenjang, hari, dan jam. Tampilkan sisa kursi (`"3 dari 15 kursi tersisa"`). Kelas dengan `bisa_dibooking === false` (penuh atau sesi pertama lewat) ditampilkan tetapi tombol pesannya nonaktif
   - `/kelas/[id]` : detail kelas dan jadwal 4 sesi, tombol **Pesan**
   - `/pengajar/[id]` : profil publik pengajar terverifikasi; rata-rata rating hanya tampil jika `jumlah_rating >= 3` (`rata_rata_rating !== null`)
   - `/tes-minat` : kuis 12 soal, indikator progres (`5/12`), semua soal wajib dijawab
   - `/tes-minat/hasil` : persentase 4 bidang, bidang teratas, rekomendasi jurusan kuliah & program, kalimat bahwa hasil ini saran dan bukan keputusan, serta ajakan mendaftar/memesan kelas
   - `/kebijakan-privasi` : kebijakan privasi & perlindungan data anak sesuai PRD bagian 10 dan `docs/knowledge/05-faq-dan-kebijakan-privasi.md`
   - halaman 404 dan 403

9. Pastikan setiap halaman yang memuat data punya state loading (skeleton), kosong, dan error. Pastikan mobile-first tanpa scroll horizontal di lebar 360 px dan memenuhi aksesibilitas PRD bagian 10.

10. Jalankan `npm run lint`, `npm run typecheck`, dan `npm run build` sampai semuanya bersih.
```

---

## Prompt 2: Autentikasi, Registrasi 3 Peran, Route Guard & Redirect (F1)

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 3, 4 (F1 & F7), 6, dan 8. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini: mengimplementasikan autentikasi penuh dengan Supabase Auth (`signUp`, `signInWithPassword`, `signOut`, pembacaan profil `pengguna`) beserta route guard per peran.

Pastikan hal berikut:
1. Halaman `/masuk`: login email & password. Setelah berhasil login, arahkan ke halaman tujuan semula atau dashboard sesuai `peran` (`/orang-tua`, `/siswa`, `/mengajar`, `/admin`).
2. Halaman `/daftar`: pilihan 3 peran (`orang_tua`, `siswa`, `pengajar` — `admin` tidak bisa dipilih):
   - Jika memilih `siswa` lalu memilih jenjang `SD`, hentikan form dan tampilkan pesan bahwa siswa SD didaftarkan oleh orang tua beserta tombol pindah ke pendaftaran Orang Tua.
   - Kirim metadata di `options.data` pada `supabase.auth.signUp` persis sesuai kontrak trigger di `docs/SERAH-TERIMA-FE.md` bagian 4A (`peran`, `nama`, `no_wa`, dan untuk siswa: `tanggal_lahir`, `jenjang`, `kelas`, `sekolah`, `nama_orang_tua`, `email_orang_tua`; untuk pengajar: `status_kerja`, `kampus`, `jurusan`, `keahlian`, `cv_url`).
   - Setelah daftar: siswa (`menunggu_persetujuan`) diarahkan ke `/siswa/persetujuan`; pengajar (`menunggu_verifikasi`) diarahkan ke `/mengajar`; orang tua diarahkan ke `/orang-tua`.
3. Route guard (`middleware.ts`) dan pembacaan sesi pengguna aktif di header (menu akun + tombol keluar). Pengguna yang membuka rute di luar perannya diarahkan ke halaman 403.
4. Uji login menggunakan akun demo di `docs/SERAH-TERIMA-FE.md` dan pastikan `lint`, `typecheck`, serta `build` lolos.
```

---

## Prompt 3: Persetujuan Orang Tua (F2), Profil Anak (F3) & Dashboard Orang Tua/Siswa

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 4 (F2, F3), 6, dan 8. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini:
1. Halaman `/siswa/persetujuan`: memanggil RPC `buat_link_persetujuan()` untuk mendapatkan token sekali pakai (berlaku 7 hari), menampilkan URL `/persetujuan/[token]`, tombol **Salin link**, tombol **Kirim via WhatsApp** (`wa.me` dengan teks siap kirim), dan tombol **Buat link baru**.
2. Halaman publik `/persetujuan/[token]`:
   - Memanggil RPC `info_persetujuan({ p_token })` untuk menampilkan nama, jenjang, kelas, sekolah siswa, data yang dikumpulkan, tujuan pemakaian data, dan aturan keamanan kelas.
   - Jika token tidak berlaku (`TOKEN_TIDAK_BERLAKU`), tampilkan pesan "Link tidak berlaku".
   - Tombol **Tolak** memanggil `putuskan_persetujuan({ p_token, p_keputusan: 'tolak' })` (bisa tanpa login).
   - Tombol **Setujui** mewajibkan centang persetujuan dan login/daftar sebagai `orang_tua` di halaman yang sama, lalu memanggil `putuskan_persetujuan({ p_token, p_keputusan: 'setujui' })`.
3. Halaman `/orang-tua/anak`: CRUD tabel `siswa` milik orang tua (`orang_tua_id = auth.uid()`). Tampilkan label "Punya akun sendiri" jika `pengguna_id !== null`. Tangani error `VALIDASI_GAGAL` jika orang tua mencoba menghapus profil anak yang masih punya booking aktif.
4. Halaman ringkasan `/orang-tua` dan `/siswa`: menampilkan status persetujuan (untuk siswa), sesi terdekat (`sesi_saya`), laporan terbaru (`laporan_saya`), booking yang perlu dibayar, dan hasil tes minat terbaru (`hasil_minat`).
5. Pastikan `lint`, `typecheck`, dan `build` lolos.
```

---

## Prompt 4: Booking, Pembayaran Manual & Unggah Bukti Bayar (F6)

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 4 (F6), 5, 6, 8, dan 9. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini:
1. Alur pemesanan dari `/kelas/[id]`:
   - Untuk `orang_tua`: memilih salah satu profil anak (otomatis menyaring yang jenjang & kelasnya sesuai program), lalu memanggil RPC `buat_booking({ p_kelas_id, p_siswa_id })`.
   - Untuk `siswa`: langsung memanggil `buat_booking` untuk dirinya sendiri (tangani kode error `SISWA_BELUM_DISETUJUI`, `KELAS_PENUH`, `BOOKING_GANDA`).
2. Halaman daftar & detail booking (`/orang-tua/booking`, `/orang-tua/booking/[id]`, `/siswa/booking`, `/siswa/booking/[id]`):
   - Menampilkan kode booking, status, total, hitung mundur/batas bayar (`batas_bayar_pada`), informasi rekening dari tabel `pengaturan`, dan gambar QRIS lewat signed URL dari bucket `pengaturan` (`qris_path`).
   - Komponen unggah bukti bayar: validasi format JPG/PNG/PDF dan ukuran maksimal 2 MB di frontend, unggah ke bucket `bukti-bayar` pada path `{booking_id}/{uuid}.{ext}`, lalu panggil RPC `kirim_bukti_bayar({ p_booking_id, p_path })`.
   - Jika pembayaran pernah ditolak admin, tampilkan `alasan_penolakan` dari tabel `pembayaran` dan izinkan unggah ulang.
   - Tombol **Batalkan Booking** (`batalkan_booking({ p_booking_id })`) hanya tampil selama status `menunggu_pembayaran` dan bukti bayar belum diunggah.
3. Pastikan `lint`, `typecheck`, dan `build` lolos.
```

---

## Prompt 5: Area Pengajar — Profil & Dokumen (F7), Buka Kelas + Meet (F8), Playbook (F9), Laporan & Rapor (F10–F11), Penghasilan (F13)

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 4 (F7–F11, F13), 6, 8, dan 9. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini: membangun seluruh halaman di `/mengajar`:
1. `/mengajar`: ringkasan status verifikasi pengajar (termasuk `alasan_penolakan` jika ditolak), jadwal sesi hari ini/terdekat (`sesi_saya`), dan pengingat jika ada sesi yang selesai > 2 jam lalu tapi belum dikirim laporannya.
2. `/mengajar/profil`:
   - Form data diri (`status_kerja`, `kampus`, `jurusan`, `keahlian`, `cv_url`) dan pilihan program yang ingin diajar (`pengajar_program` dengan `disetujui = false`).
   - Unggah foto profil ke bucket `foto-pengajar` (maks 1 MB, JPG/PNG) serta KTP/KTM dan SKCK ke bucket `dokumen-pengajar` (maks 2 MB, JPG/PNG/PDF) di path `{auth.uid()}/{uuid}.{ext}`, lalu simpan path-nya ke `profil_pengajar`.
3. `/mengajar/kelas`, `/mengajar/kelas/baru`, `/mengajar/kelas/[id]`:
   - Form buka kelas (hanya untuk program yang `pengajar_program.disetujui === true`): memanggil RPC `buka_kelas({ p_program_id, p_tanggal_mulai, p_jam_mulai, p_kapasitas, p_level })`.
   - **Wajib:** tepat setelah `buka_kelas` berhasil, panggil Edge Function `supabase.functions.invoke('buat-meet', { body: { kelas_id: data.kelas_id } })` agar ke-4 sesi langsung dibuatkan ruang Google Meet otomatis.
   - Di detail kelas (`/mengajar/kelas/[id]`): daftar 4 sesi, daftar peserta terkonfirmasi, tombol **Masuk Kelas** (memanggil `link_masuk_sesi({ p_sesi_id })` saat `bisa_masuk_kelas === true`), dan fitur **Geser Jadwal Sesi** (`geser_sesi({ p_sesi_id, p_mulai_pada })`, maks H-1).
4. `/mengajar/sesi/[id]/playbook`: memanggil RPC `playbook_sesi({ p_sesi_id })`, me-render Markdown dengan rapi, dan menyediakan tombol **Cetak / Simpan PDF** (`window.print()`) dengan print CSS yang bersih.
5. `/mengajar/sesi/[id]/laporan`:
   - Form laporan sesi (`ringkasan` maks 500 karakter, `rekaman_url` **opsional**, `kendala` opsional) + kehadiran dan catatan tiap siswa (`catatan` wajib jika hadir, maks 300 karakter; `karya_url` opsional).
   - Khusus sesi ke-4 program **Simulasi Jurusan IT**: tampilkan form **Rapor Rekomendasi Jurusan** (skor 1–5 untuk Software, Jaringan, IoT, AI & Data, bidang rekomendasi, alasan maks 1000 karakter, saran maks 500 karakter) yang wajib diisi untuk setiap siswa yang hadir.
   - Memanggil `kirim_laporan` (atau `ubah_laporan` jika laporan sudah ada dan masih dalam 24 jam setelah dikirim).
6. `/mengajar/penghasilan`: membaca tabel `honor` milik pengajar, menampilkan total honor bulan berjalan, total `belum_dibayar`, dan riwayat per sesi.
7. Pastikan `lint`, `typecheck`, dan `build` lolos.
```

---

## Prompt 6: Halaman Sesi Siswa/Ortu, Rapor, Rating, Lapor Masalah & Notifikasi Realtime (F8, F10–F12)

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 4 (F8, F10–F12), 6, 8, dan 9. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini:
1. Halaman `/orang-tua/sesi/[id]` dan `/siswa/sesi/[id]`:
   - Menampilkan info sesi dari `sesi_saya`.
   - Tombol **Masuk Kelas** yang memanggil RPC `link_masuk_sesi({ p_sesi_id })` lalu membuka `meet_uri` di tab baru (hanya aktif dalam jendela 15 menit sebelum mulai s.d. selesai untuk booking `terkonfirmasi`).
   - Menampilkan laporan sesi & catatan siswa dari `laporan_saya` begitu tersedia.
   - Form **Beri Rating** (1–5 bintang + komentar opsional maks 300 karakter) lewat RPC `beri_rating` setelah laporan sesi dikirim.
   - Form/modal **Laporkan Masalah** (insert ke `laporan_masalah` dengan kategori `perilaku_tidak_pantas`, `pengajar_tidak_hadir`, `masalah_teknis`, atau `lainnya`).
2. Halaman `/orang-tua/rapor/[id]` dan `/siswa/rapor/[id]`:
   - Membaca view `rapor_saya`, menampilkan skor penilaian pengajar (1–5) berdampingan dengan persentase hasil tes minat terbaru siswa (`tes_minat_skor`), bidang rekomendasi, alasan, saran, kalimat bahwa rapor adalah saran dan bukan keputusan, serta tombol **Cetak / Simpan PDF** dengan print CSS yang rapi.
3. Lonceng Notifikasi Realtime di Header:
   - Berlangganan Supabase Realtime (`postgres_changes` event `INSERT` pada tabel `notifikasi` dengan filter `pengguna_id=eq.${user.id}`), dengan fallback polling setiap 30 detik jika koneksi terputus.
   - Saat notifikasi baru masuk (`aria-live="polite"`), tambah badge angka belum dibaca dan otomatis muat ulang data halaman terkait sesuai kolom `tipe` (`laporan_dikirim`, `booking_status`, `sesi_dijadwal_ulang`, `pembayaran_masuk`, `persetujuan_diputuskan`, `pengajar_status`, `laporan_masalah_baru`, `pengingat`, `chat_handoff`).
   - Mendukung tandai satu notifikasi terbaca dan tombol **Tandai semua dibaca** (`baca_semua_notifikasi()`).
4. Pastikan `lint`, `typecheck`, dan `build` lolos.
```

---

## Prompt 7: Dashboard Admin Lengkap (F14)

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/KEPUTUSAN.md`, `docs/SERAH-TERIMA-FE.md`, dan `docs/PRD.md` bagian 4 (F6, F7, F12–F14), 6, 8, dan 9. Tunjukkan rencana singkat dulu, lalu tunggu persetujuan saya.

Tujuan sesi ini: membangun seluruh area `/admin` (responsif: tabel berubah menjadi kartu di layar < 768 px):
1. `/admin`: kartu ringkasan angka dari view `admin_ringkasan` dan pintasan ke antrean.
2. `/admin/pengajar` dan `/admin/pengajar/[id]`:
   - Filter berdasarkan status dan urutkan dari yang paling lama menunggu.
   - Buka dokumen KTP/KTM, SKCK (`dokumen-pengajar` lewat signed URL 5 menit), foto, dan CV.
   - Checkbox **Wawancara selesai** (`admin_wawancara_selesai`), pilihan program yang disetujui, tombol **Setujui** (`admin_setujui_pengajar` — hanya aktif jika KTP, SKCK, dan wawancara selesai), tombol **Tolak** dengan alasan wajib (`admin_tolak_pengajar`), serta tombol **Nonaktifkan Pengajar** (`admin_nonaktifkan_pengguna` yang juga menampilkan daftar booking terdampak).
3. `/admin/pembayaran` dan `/admin/pembayaran/[id]`:
   - Pratinjau bukti bayar lewat signed URL dari bucket `bukti-bayar`.
   - Tombol **Setujui** (`admin_setujui_pembayaran`) dan **Tolak** dengan alasan wajib (`admin_tolak_pembayaran`).
4. `/admin/laporan-masalah`:
   - Laporan kategori `perilaku_tidak_pantas` (`prioritas === 'tinggi'`) tampil paling atas dengan badge prioritas tinggi.
   - Ubah status (`baru`, `ditinjau`, `selesai`) lewat RPC `admin_ubah_laporan_masalah`.
5. `/admin/kelas`: daftar semua kelas (ubah/sembunyikan status kelas) dan daftar sesi terjadwal yang belum punya link Meet (`meet_uri === null`) beserta tombol **Coba Ulang Buat Meet** yang memanggil Edge Function `buat-meet`.
6. `/admin/program`: kelola data `program` (harga paket, durasi, tarif honor per sesi, aktif/nonaktif).
7. `/admin/honor`: daftar honor pengajar (`belum_dibayar` / `dibayar`) dan tombol **Tandai Dibayar** (`admin_tandai_honor_dibayar`).
8. `/admin/pengaturan`: kelola `nama_bank`, `nomor_rekening`, `nama_pemilik_rekening`, unggah gambar QRIS ke bucket `pengaturan` (`qris_path`), serta pengaturan Chatbot Kiko (`chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`).
9. `/admin/log`: tabel riwayat `log_admin`.
10. Pastikan `lint`, `typecheck`, dan `build` lolos.
```

---

## Prompt 8: AI Chatbot Widget "Kiko" & Halaman Live Admin Takeover (`/admin/chat`)

```text
Baca `docs/PROMPT-CHATBOT-FE.md`, `docs/KEPUTUSAN.md`, dan `docs/SERAH-TERIMA-FE.md` bagian 5.

Ikuti seluruh spesifikasi di `docs/PROMPT-CHATBOT-FE.md` untuk membangun:
1. Floating AI Chatbot Widget **Kiko** (`src/components/chatbot/`) yang terhubung ke Edge Function SSE `POST ${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`, membaca `chatbot_konfigurasi_publik`, menampilkan sitasi `[1]`, memiliki animasi buka-tutup 2 arah, tombol Stop elegan, serta 3 jalur handoff (WhatsApp/Email, Buat Tiket, dan Live Chat Realtime dengan Admin).
2. Halaman **`/admin/chat`** di dashboard Admin untuk memantau `percakapan_chat`, mengambil alih percakapan (`admin_ambil_alih_chat`), membalas pesan secara realtime (`kirim_pesan_live_chat`), dan mengembalikan percakapan ke Kiko (`admin_selesaikan_chat`).
3. Pastikan `npm run lint`, `npm run typecheck`, dan `npm run build` lolos tanpa error.
```

---

## Prompt 9: Poles UI/UX Final, Uji End-to-End Demo & Lighthouse

```text
Baca `CLAUDE.md`, `frontend/CLAUDE.md`, `docs/PRD.md` bagian 10 dan 11, serta `docs/SERAH-TERIMA-FE.md`.

Tujuan sesi ini:
1. Poles konsistensi visual, tipografi, kontras warna (minimal 4,5:1), fokus keyboard, area sentuh minimal 44x44 px, dan responsivitas di lebar 360 px sampai 1440 px.
2. Pastikan seluruh 6 langkah skenario video demo di PRD bagian 11 berjalan mulus dengan `NEXT_PUBLIC_USE_MOCK=false` terhadap Supabase Cloud.
3. Optimalkan performa halaman publik untuk mencapai skor Lighthouse Performance dan Accessibility minimal 90.
4. Pastikan `npm run lint`, `npm run typecheck`, dan `npm run build` bersih 100%.
```
