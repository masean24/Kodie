# Backend Supabase — Kodie (SEVENT X)

Seluruh skema database (**12 SQL migrations**, **27 tabel + RLS**, **9 View**, **29 RPC client-callable PL/pgSQL**, **4 Storage bucket**, Realtime publication `notifikasi`/`percakapan_chat`/`pesan_chat`, **6 job `pg_cron`**), **2 Edge Function** (`buat-meet` & `chat`), seed data, tipe TypeScript, dan skrip verifikasi tersedia di folder `backend/`.

## Struktur File

- `supabase/migrations/`
  1. `20261123000001_skema_awal.sql` — 15 enum awal, 22 tabel inti, constraint, index, trigger kapasitas & proteksi hapus siswa.
  2. `20261123000002_rls_dan_policy.sql` — helper `peran_saya()`, `status_saya()`, `adalah_siswa_saya()`, RLS aktif di seluruh tabel, serta proteksi kolom sensitif.
  3. `20261123000003_trigger_registrasi.sql` — trigger `auth.users` untuk registrasi `orang_tua`, `siswa` (SMP/SMA saja), dan `pengajar`, serta menolak `admin`.
  4. `20261123000004_views.sql` — 7 view kontrak (`kelas_katalog`, `pengajar_publik`, `soal_minat_publik`, `sesi_saya`, `laporan_saya`, `rapor_saya`, `admin_ringkasan`).
  5. `20261123000005_rpc_dan_trigger.sql` — seluruh RPC F2–F14, locking booking `FOR UPDATE`, trigger prioritas & notifikasi laporan masalah, serta log admin otomatis.
  6. `20261123000006_storage_buckets.sql` — 4 bucket (`bukti-bayar`, `foto-pengajar`, `dokumen-pengajar`, `pengaturan`) beserta batas format/ukuran & RLS storage.
  7. `20261123000007_realtime_dan_cron.sql` — publication `supabase_realtime` untuk `notifikasi` dan 6 job `pg_cron`.
  8. `20261123000008_grants_schema.sql` — `GRANT` hak dasar schema, tabel, view, dan sequence `public` untuk `anon`, `authenticated`, dan `service_role`.
  9. `20261123000009_fix_rls_recursion.sql` — helper `SECURITY DEFINER` anti-rekursi RLS antar `booking`, `kelas`, `sesi`, dan `siswa`.
  10. `20261123000010_chatbot_rag_dan_live_chat.sql` — ekstensi `pgvector`, tabel `knowledge_chunks`, `percakapan_chat`, `pesan_chat`, `chatbot_konfigurasi_publik`, Hybrid Search RRF (`cari_knowledge_rag`), & RPC Live Admin Takeover.
  11. `20261123000011_fix_rag_search_path.sql` — perbaikan `search_path = public, extensions` pada `cari_knowledge_rag` untuk operator `<=>` `pgvector`.
  12. `20261125000012_perbaikan_qa_dan_fitur_be.sql` — audit trail `pengguna.privasi_disetujui_pada`, bio pengajar (`profil_pengajar.bio` + `pengajar_publik.bio`), view ulasan anonim `ulasan_pengajar_publik`, silabus publik Sesi 1–4 (`program.silabus`), serta fitur **Waitlist Kelas Penuh** (`waitlist_kelas`, `daftar_waitlist_kelas`, `batal_waitlist_kelas`, dan trigger notifikasi kursi tersedia).
- `supabase/functions/`
  - `buat-meet/index.ts` — Edge Function pembuat ruang Google Meet (`spaces.create` dengan `accessType: "OPEN"`).
  - `chat/` (`index.ts`, `guardrails.ts`, `providers.ts`) — Edge Function AI Chatbot **"Kiko"** (SSE streaming, Hybrid RAG `pgvector`, Guardrail Privasi Anak PII Auto-Masking tanpa dikirim ke LLM, Anti-Prompt-Injection, Auto-Failover Agnes AI → Gemini → Groq, & Live Admin Takeover).
- `supabase/seed.sql` — 3 program lengkap dengan silabus Sesi 1–4, 12 soal tes minat, **12 Teaching Playbook** (Sesi 1–4 tiap program), konfigurasi Kiko, dan pengaturan rekening contoh.
- `supabase/types/database.ts` — tipe TypeScript (UTF-8 tanpa BOM) siap salin ke `frontend/src/types/database.ts`.
- `scripts/`
  - `seed-akun.ts` (`npm run seed:akun`) — skrip Admin API untuk membuat 9 akun demo, bio pengajar, kelas, sesi, booking di semua status, laporan, rapor, 3+ rating, dan aset storage contoh.
  - `demo-reset.ts` (`npm run demo:reset`) — skrip penyegar jadwal demo & QA pasca-login (`k1` batas bayar `+24 jam`, `k2Penuh` dijaga `+5 hari` untuk QA Waitlist & `test:rls`, kelas live `k7Live` H-15m `+5 menit` beserta Meet asli, `k5` `+18 jam` untuk jendela Playbook H-1).
  - `ingest-knowledge.ts` (`npm run ingest:knowledge`) — skrip pemecah & embedding dokumen `docs/knowledge/*.md` (`gemini-embedding-001` 768d L2-normalized) ke `knowledge_chunks`.
  - `test-chatbot-unit.ts` (`npm run test:chatbot`) — 28 unit test guardrail (termasuk sensor PII anak & pengecualian domain resmi), fast-path, SSRF, markdown splitter, dan L2 normalization.
  - `verify-backend.ts` (`npm run test:rls`) — 45 pengujian otomatis end-to-end RLS, View (termasuk bio & `ulasan_pengajar_publik`), silabus, Waitlist, RPC tiap peran, PII blocking di `chat`, & Live Admin Takeover.

## Cara Deploy & Menjalankan ke Supabase Cloud

1. Salin `.env.example` menjadi `.env` di dalam `backend/`, lalu isi nilai dari dashboard proyek Supabase Cloud Anda:
   - Wajib: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Google Meet: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
   - AI Chatbot Kiko & RAG Ingest: `GEMINI_API_KEY` (wajib untuk `ingest:knowledge` & fallback LLM/embedding `chat`), serta opsional `AGNES_API_KEY` dan `GROQ_API_KEY`

2. Login dan hubungkan ke proyek Supabase Cloud:
   ```bash
   cd backend
   npx supabase login
   npx supabase link --project-ref <PROJECT_REF_ANDA>
   ```

3. Push seluruh **12 migration** ke database Cloud:
   ```bash
   npm run db:push
   ```

4. Konfigurasi **Authentication** di **Supabase Dashboard → Authentication**:
   - **URL Configuration** (penting untuk alur registrasi & **Lupa Password / `resetPasswordForEmail`**):
     - **Site URL:** `https://kodie.xevora.me`
     - **Redirect URLs:** `https://kodie.xevora.me/**`, `http://localhost:3000/**`
   - **Providers → Email:** matikan opsi **Confirm email** untuk kelancaran demo (sesuai PRD bagian 8).

5. Jalankan seed akun, ingest knowledge RAG, dan reset jadwal demo QA:
   ```bash
   npm run seed:akun
   npm run ingest:knowledge
   npm run demo:reset
   ```

6. Deploy kedua Edge Function (`buat-meet` & `chat`) dan simpan secrets:
   ```bash
   npm run functions:deploy
   npx supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=... GEMINI_API_KEY=... AGNES_API_KEY=... GROQ_API_KEY=...
   ```
   *(Opsional untuk cron coba-ulang Meet via `pg_net`: simpan `project_url` dan `service_role_key` di Supabase Vault melalui Dashboard → Integrations → Vault).*

7. Cek tipe TypeScript dan jalankan seluruh rangkaian pengujian terhadap Cloud:
   ```bash
   npm run typecheck
   npm run test:chatbot
   npm run test:rls
   ```

8. (Opsional) Regenerasi tipe TypeScript langsung dari schema Cloud:
   ```bash
   npm run gen:types:linked
   ```
   > **Catatan PowerShell Windows:** Di Windows PowerShell 5.1, operator redirect `>` bawaan menulis file sebagai **UTF-16LE BOM** yang dapat memicu error `tsc` jika langsung dijalankan lewat `npm run gen:types:linked`. Jalankan dari Git Bash / PowerShell 7+, atau tulis stdout `npx supabase gen types typescript --linked` dengan encoding **UTF-8 tanpa BOM** sebelum menyalin `supabase/types/database.ts` ke `frontend/src/types/database.ts`.
