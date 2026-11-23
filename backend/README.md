# Backend Supabase — SEVENT X Bimbel Teknologi Daring

Seluruh skema database, RLS, trigger, view, RPC, storage bucket, tugas terjadwal (`pg_cron`), Edge Function `buat-meet`, seed data, dan tipe TypeScript tersedia di folder `backend/`.

## Struktur File

- `supabase/migrations/`
  1. `20261123000001_skema_awal.sql` — 15 enum, 22 tabel, constraint, index, trigger kapasitas & proteksi hapus siswa.
  2. `20261123000002_rls_dan_policy.sql` — helper `peran_saya()`, `status_saya()`, `adalah_siswa_saya()`, RLS aktif di semua 22 tabel, serta proteksi kolom sensitif.
  3. `20261123000003_trigger_registrasi.sql` — trigger `auth.users` untuk registrasi `orang_tua`, `siswa` (SMP/SMA saja), dan `pengajar`, serta menolak `admin`.
  4. `20261123000004_views.sql` — 7 view kontrak (`kelas_katalog`, `pengajar_publik`, `soal_minat_publik`, `sesi_saya`, `laporan_saya`, `rapor_saya`, `admin_ringkasan`).
  5. `20261123000005_rpc_dan_trigger.sql` — seluruh RPC F2–F14, locking booking `FOR UPDATE`, trigger prioritas & notifikasi laporan masalah, serta log admin otomatis.
  6. `20261123000006_storage_buckets.sql` — 4 bucket (`bukti-bayar`, `foto-pengajar`, `dokumen-pengajar`, `pengaturan`) beserta batas format/ukuran & RLS storage.
  7. `20261123000007_realtime_dan_cron.sql` — publication `supabase_realtime` untuk `notifikasi` dan 6 job `pg_cron`.
- `supabase/functions/buat-meet/index.ts` — Edge Function pembuat ruang Google Meet (`spaces.create` dengan `accessType: "OPEN"`).
- `supabase/seed.sql` — 3 program, 12 soal tes minat, 6 playbook (sesi 1–2 tiap program), dan pengaturan rekening contoh.
- `supabase/types/database.ts` — tipe TypeScript siap salin ke `frontend/src/types/database.ts`.
- `scripts/seed-akun.ts` — skrip Admin API untuk membuat 9 akun demo, 6 kelas, 24 sesi, booking di semua status, laporan, rapor, rating, dan aset storage contoh.
- `scripts/verify-backend.ts` — skrip uji otomatis RLS, view, dan RPC untuk setiap peran.

## Cara Deploy & Menjalankan ke Supabase Cloud

1. Salin `.env.example` menjadi `.env` di dalam `backend/`, lalu isi nilai dari dashboard proyek Supabase Cloud Anda:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (untuk Google Meet)

2. Login dan hubungkan ke proyek Supabase Cloud:
   ```bash
   cd backend
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF_ANDA>
   ```

3. Push seluruh 7 migration ke database Cloud:
   ```bash
   npm run db:push
   ```
   *(Catatan: pastikan di Dashboard Supabase > Authentication > Providers > Email, opsi **Confirm email** dimatikan untuk kelancaran demo, sesuai PRD bagian 8).*

4. Jalankan seed akun & data demo lengkap:
   ```bash
   npm run seed:akun
   ```

5. Deploy Edge Function `buat-meet` dan simpan secrets Google OAuth:
   ```bash
   npm run functions:deploy
   npx supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=...
   ```
   *(Opsional untuk cron coba-ulang Meet via `pg_net`: simpan `project_url` dan `service_role_key` di Supabase Vault melalui Dashboard -> Integrations -> Vault).*

6. Uji seluruh RLS, view, dan RPC terhadap database Cloud:
   ```bash
   npm run test:rls
   ```

7. (Opsional) Regenerasi tipe TypeScript langsung dari schema Cloud:
   ```bash
   npm run gen:types:linked
   ```
