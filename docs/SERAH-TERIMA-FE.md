# Serah Terima Backend ke Tim Frontend (SEVENT X)

Dokumen ini merangkum informasi koneksi, tipe data, kontrak API/RPC, penyesuaian skema dari `docs/KEPUTUSAN.md`, serta akun demo yang **sudah aktif di Supabase Cloud** sehingga tim Frontend (Claude Code) bisa langsung mengintegrasikan aplikasi Next.js (`NEXT_PUBLIC_USE_MOCK=false`).

> **Keamanan:** Repository ini publik. Jangan pernah menulis `SUPABASE_SERVICE_ROLE_KEY`, secret Google OAuth, atau kunci API pribadi ke dalam repository. Minta nilai `NEXT_PUBLIC_SUPABASE_ANON_KEY` lewat jalur pribadi tim (atau salin dari Dashboard Supabase → Project Settings → API).

---

## 1. Status & Konfigurasi Supabase Cloud

Backend sudah ter-deploy penuh (9 migration SQL, 22 tabel + RLS, 7 view, 23 RPC, 4 Storage bucket, Realtime publication `notifikasi`, 6 job `pg_cron`, Edge Function `buat-meet`, serta data seed demo).

### Setup `frontend/.env.local`

Salin `frontend/.env.example` menjadi `frontend/.env.local`, lalu isi:

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_SUPABASE_URL=https://auwmoqxkilpaxfwacozm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<minta_ke_tim_backend_atau_salin_dari_dashboard>
```

### Salin Tipe TypeScript Resmi

File tipe database yang sudah di-generate langsung dari schema Cloud tersedia di:

```text
backend/supabase/types/database.ts
```

Salin file tersebut ke `frontend/src/types/database.ts` agar seluruh query `supabase-js` memiliki *type-safety* penuh.

---

## 2. Daftar Akun Demo (Password: `DemoSeventX123!`)

Semua akun di bawah ini sudah ada di Supabase Auth (`email_confirm = true`) lengkap dengan data kelas, booking, laporan, rapor, dan rating.

| Peran | Email | Nama & Catatan Relasi |
| --- | --- | --- |
| **Admin** | `admin@seventx.id` | Admin Platform SEVENT X |
| **Pengajar Terverifikasi 1** | `pengajar1@seventx.id` | Nadia Kusuma Putri (Software & AI — mengajar *Kelas Reguler* & *Simulasi IT*; sesi kelasnya sudah punya link Google Meet asli) |
| **Pengajar Terverifikasi 2** | `pengajar2@seventx.id` | Bagus Pratama Wijaya (Jaringan & IoT — punya 3 rating sehingga `rata_rata_rating` tampil di `pengajar_publik`, serta 1 honor `belum_dibayar`) |
| **Pengajar Terverifikasi 3** | `pengajar3@seventx.id` | Citra Lestari Handayani (mengajar *Coding Dasar* SD — punya 1 kelas terbuka dan 1 kelas penuh) |
| **Pengajar Menunggu Verifikasi** | `pengajar.baru@seventx.id` | Dimas Putra Mahendra (dokumen KTP & SKCK demo sudah terunggah, siap diuji verifikasi oleh Admin) |
| **Orang Tua 1** | `ortu1@seventx.id` | Ratna Sari Dewi (punya profil anak: **Bima Aditya** SD kls 5, **Sinta Maharani** SMP kls 8, dan terhubung dengan **Fajar Nugroho** SMA kls 11) |
| **Orang Tua 2** | `ortu2@seventx.id` | Hendra Wijaya (punya profil anak: **Raka Pratama** SMA kls 11) |
| **Siswa Mandiri Aktif** | `siswa.aktif@seventx.id` | Fajar Nugroho (SMA kls 11 — sudah punya hasil tes minat, booking selesai, laporan sesi, dan rapor jurusan) |
| **Siswa Menunggu Persetujuan** | `siswa.baru@seventx.id` | Laras Putri Kinanti (SMP kls 9 — status `menunggu_persetujuan`, cocok untuk demo alur F2 persetujuan orang tua) |

---

## 3. Penyesuaian Kontrak Terbaru (`docs/KEPUTUSAN.md`)

Pastikan implementasi Frontend mengikuti detail berikut:

1. **Durasi & Rekaman (`F8`, `F10`):**
   - Durasi default program: **60 menit** (*Coding Dasar* SD) dan **90 menit** (*Kelas Reguler Teknologi* & *Simulasi Jurusan IT*).
   - Kolom `rekaman_url` pada `laporan_sesi` bersifat **opsional (`nullable`)** agar tidak menghambat pengajar saat demo.
   - Pengajar bisa mengirim laporan sejak sesi dimulai (`now() >= mulai_pada`), dan tombol **Masuk Kelas** (`link_masuk_sesi`) aktif dari **15 menit sebelum `mulai_pada` sampai `selesai_pada`**.
2. **Kolom Tambahan pada `siswa` & `kelas`:**
   - Tabel `siswa` memiliki kolom nullable `nama_orang_tua` dan `email_orang_tua` untuk menampung input registrasi siswa mandiri (F1).
   - Tabel `kelas` memiliki kolom `level` (`integer DEFAULT 1`), dan RPC `buka_kelas` menerima parameter opsional ke-5 `p_level?: number` (`DEFAULT 1`).
3. **Tes Minat (`F4`):**
   - Tes minat **tidak memblokir** `buat_booking` untuk *Simulasi Jurusan IT* (hanya bersifat saran).
   - Rumus persentase: `ROUND((skor_bidang / total_skor_4_bidang) * 100)`, dengan *tie-break* `software > jaringan > iot > ai_data`.
4. **Harga Paket (4 Sesi) & Honor Seed:**
   - *Coding Dasar* (SD, kapasitas maks 10): `Rp200.000` (honor `Rp50.000`/sesi).
   - *Kelas Reguler Teknologi* (SMP/SMA, kapasitas maks 15): `Rp275.000` (honor `Rp65.000`/sesi).
   - *Simulasi Jurusan IT* (SMP 9/SMA, kapasitas maks 15): `Rp300.000` (honor `Rp75.000`/sesi).
5. **Profil Pengajar (`F1` & `F7`):**
   - Pilihan program (`pengajar_program`) diisi/diubah pengajar di halaman `/mengajar/profil` (setelah login) dengan `disetujui = false`, bukan saat `signUp` awal.

---

## 4. Kontrak Integrasi Supabase

### A. Auth (`supabase.auth.signUp`)

Kirim field berikut di `options.data` (wajib ada `peran` dan `nama`):

- **Orang tua:** `{ peran: 'orang_tua', nama, no_wa }`
- **Siswa (hanya `SMP` / `SMA`; `SD` ditolak trigger):**
  `{ peran: 'siswa', nama, no_wa?, tanggal_lahir: 'YYYY-MM-DD', jenjang: 'SMP' | 'SMA', kelas: number, sekolah?, nama_orang_tua?, email_orang_tua? }`
- **Pengajar:**
  `{ peran: 'pengajar', nama, no_wa?, status_kerja?: 'mahasiswa' | 'lulusan' | 'pencari_kerja', kampus?, jurusan?, keahlian?: ('software'|'jaringan'|'iot'|'ai_data')[], cv_url? }`
- Peran `admin` akan selalu ditolak oleh trigger database.

### B. 7 View untuk Read Data (`supabase.from('<nama_view>').select(...)`)

| View | Akses | Catatan Penting |
| --- | --- | --- |
| `kelas_katalog` | Publik (`anon`, `authenticated`) | Berisi `sisa_kursi`, `kursi_terpakai`, `bisa_dibooking`, `hari_mingguan` (1=Senin..7=Minggu WIB), nama & foto pengajar. **Tanpa `meet_uri`.** |
| `pengajar_publik` | Publik | Hanya pengajar `terverifikasi`. `rata_rata_rating` bernilai `null` jika `jumlah_rating < 3`. Tanpa dokumen sensitif. |
| `soal_minat_publik` | Publik | 12 soal terurut, kolom `opsi` hanya berisi `[{ kode, teks }]` tanpa bobot. |
| `sesi_saya` | Login (pemilik / admin) | Berisi jadwal sesi & flag `bisa_masuk_kelas` (boolean). **Tanpa `meet_uri`.** |
| `laporan_saya` | Login (pemilik / admin) | Hanya mengembalikan catatan siswa milik peminta. Kolom `rekaman_url` otomatis `null` bagi siswa/orang tua. |
| `rapor_saya` | Login (pemilik / admin) | Menggabungkan `rapor_jurusan` dengan skor `hasil_minat` terbaru siswa. |
| `admin_ringkasan` | Admin saja | Angka statistik dashboard admin (non-admin mendapat 0 baris). |

> **Catatan keamanan:** Tabel `sesi`, `playbook`, dan `soal_minat` tidak dapat di-`select` langsung oleh non-admin. Gunakan `sesi_saya`, `soal_minat_publik`, serta RPC `link_masuk_sesi` dan `playbook_sesi`.

### C. Daftar RPC (`supabase.rpc('<nama>', { ... })`)

Error bisnis dilempar di `error.message` sesuai kode error PRD Bagian 8 (`VALIDASI_GAGAL`, `TIDAK_BERHAK`, `SISWA_BELUM_DISETUJUI`, `PENGAJAR_BELUM_TERVERIFIKASI`, `KAPASITAS_TIDAK_VALID`, `TOKEN_TIDAK_BERLAKU`, `KELAS_PENUH`, `BOOKING_GANDA`, `JADWAL_BENTROK`, `FILE_TIDAK_VALID`, `SESI_BELUM_DIBUKA`, `LINK_MEET_BELUM_ADA`, `LAPORAN_TERKUNCI`).

- **Persetujuan Orang Tua (F2):**
  - `buat_link_persetujuan()` *(siswa)* → `{ token, kedaluwarsa_pada }`
  - `info_persetujuan({ p_token })` *(publik)* → `{ siswa_id, nama, jenjang, kelas, sekolah, kedaluwarsa_pada }`
  - `putuskan_persetujuan({ p_token, p_keputusan: 'setujui' | 'tolak' })` *('setujui' wajib login `orang_tua`, 'tolak' boleh publik)* → `{ status, siswa_id, diputuskan_pada }`
- **Tes Minat (F4):**
  - `hitung_tes_minat({ p_jawaban, p_siswa_id? })` *(publik/login)*
    - `p_jawaban` mendukung objek `{"1": "A", ..., "12": "D"}` atau array `[{ urutan: 1, kode: "A" }, ...]`.
    - Return: `{ id, tersimpan, skor: { software, jaringan, iot, ai_data }, skor_mentah, bidang_teratas, rekomendasi_jurusan, rekomendasi_program }`.
- **Booking & Pembayaran (F6):**
  - `buat_booking({ p_kelas_id, p_siswa_id })` → `{ id, kode, status, total, batas_bayar_pada }`
  - `batalkan_booking({ p_booking_id })` → `{ id, status: 'dibatalkan' }`
  - `kirim_bukti_bayar({ p_booking_id, p_path })` → `{ pembayaran_id, booking_id, status: 'menunggu_verifikasi' }`
- **Kelas, Sesi & Meet (F8, F9):**
  - `buka_kelas({ p_program_id, p_tanggal_mulai, p_jam_mulai, p_kapasitas, p_level? })` → `{ kelas_id, sesi_ids }`
    - `p_tanggal_mulai` format `'YYYY-MM-DD'`, `p_jam_mulai` format `'HH:mm:ss'` (dalam WIB).
    - **Setelah `buka_kelas` sukses**, frontend langsung memanggil Edge Function:
      `await supabase.functions.invoke('buat-meet', { body: { kelas_id: data.kelas_id } })`
      *(Respons Edge Function berupa `{ berhasil, gagal }` dan tidak pernah mengembalikan `meet_uri`)*.
  - `geser_sesi({ p_sesi_id, p_mulai_pada })` → `{ id, mulai_pada, selesai_pada }` (`p_mulai_pada` ISO 8601 UTC)
  - `link_masuk_sesi({ p_sesi_id })` → `{ meet_uri }`
  - `playbook_sesi({ p_sesi_id })` → row `playbook` *(atau `null` jika belum ada)*
- **Laporan, Rapor & Rating (F10–F12):**
  - `kirim_laporan({ p_sesi_id, p_ringkasan, p_rekaman_url, p_kendala, p_siswa, p_rapor? })` → `{ laporan_sesi_id, sesi_id, status: 'selesai' }`
    - `p_siswa`: `Array<{ siswa_id: string, hadir: boolean, catatan?: string | null, karya_url?: string | null }>` *(wajib mencakup semua siswa `terkonfirmasi` di kelas tersebut; `catatan` wajib jika `hadir === true`)*.
    - `p_rapor` *(wajib untuk sesi ke-4 program `simulasi-jurusan-it` bagi setiap siswa yang `hadir === true`)*:
      `Array<{ siswa_id: string, skor_software: number, skor_jaringan: number, skor_iot: number, skor_ai_data: number, bidang_rekomendasi: 'software'|'jaringan'|'iot'|'ai_data', alasan: string, saran: string }>`.
  - `ubah_laporan({ p_sesi_id, p_ringkasan, p_rekaman_url, p_kendala, p_siswa, p_rapor? })` → `{ laporan_sesi_id, diubah_pada }` *(terkunci 24 jam setelah dikirim: `LAPORAN_TERKUNCI`)*.
  - `beri_rating({ p_sesi_id, p_siswa_id, p_bintang, p_komentar? })` → `{ id, bintang }`
- **Notifikasi & Admin (F7, F12–F14):**
  - `baca_semua_notifikasi()` → `number` (jumlah notifikasi ditandai terbaca)
  - `admin_wawancara_selesai({ p_pengajar_id, p_selesai? })`
  - `admin_setujui_pengajar({ p_pengajar_id, p_program_ids })`
  - `admin_tolak_pengajar({ p_pengajar_id, p_alasan })`
  - `admin_nonaktifkan_pengguna({ p_pengguna_id, p_alasan })` → `{ pengguna_id, status, booking_terdampak }`
  - `admin_setujui_pembayaran({ p_pembayaran_id })`
  - `admin_tolak_pembayaran({ p_pembayaran_id, p_alasan })`
  - `admin_ubah_laporan_masalah({ p_id, p_status })`
  - `admin_tandai_honor_dibayar({ p_id })`

### D. Storage Buckets & Format Path

Semua file privat dibuka dengan `supabase.storage.from(bucket).createSignedUrl(path, 300)`.

| Bucket | Sifat | Batas & Format | Path Wajib |
| --- | --- | --- | --- |
| `bukti-bayar` | Privat | JPG/PNG/PDF, maks 2 MB | `{booking_id}/{uuid}.{ext}` |
| `foto-pengajar` | Publik | JPG/PNG, maks 1 MB | `{auth.uid()}/{uuid}.{ext}` |
| `dokumen-pengajar` | Privat (baca: Admin) | JPG/PNG/PDF, maks 2 MB | `{auth.uid()}/{uuid}.{ext}` |
| `pengaturan` | Privat (baca: Login) | JPG/PNG, maks 1 MB | `qris-....png` (contoh seed: `qris-demo.png`) |

### E. Realtime Notifikasi

Berlangganan `postgres_changes` untuk event `INSERT` pada tabel `notifikasi` dengan filter `pengguna_id=eq.${userId}`, lalu muat ulang data terkait berdasarkan kolom `tipe` (`laporan_dikirim`, `booking_status`, `sesi_dijadwal_ulang`, `pembayaran_masuk`, `persetujuan_diputuskan`, `pengajar_status`, `laporan_masalah_baru`, `pengingat`, `chat_handoff`), sesuai PRD Bagian 9.

---

## 5. AI Chatbot "Kiko" & Live Admin Takeover (Migration 10 & Edge Function `chat`)

Detail prompt siap-pakai untuk membangun widget UI dan dashboard `/admin/chat` di Frontend tersedia di **`docs/PROMPT-CHATBOT-FE.md`**.

- **Endpoint SSE:** `POST ${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`
- **View Konfigurasi Publik:** `chatbot_konfigurasi_publik` (`chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`)
- **Tabel Live Chat (Realtime aktif):** `percakapan_chat` dan `pesan_chat`
- **RPC Live Takeover:**
  - `minta_bantuan_admin_chat({ p_percakapan_id, p_buat_tiket?, p_ringkasan_masalah? })`
  - `kirim_pesan_live_chat({ p_percakapan_id, p_isi })`
  - `admin_ambil_alih_chat({ p_percakapan_id })`
  - `admin_selesaikan_chat({ p_percakapan_id, p_kembali_ke_bot? })`
