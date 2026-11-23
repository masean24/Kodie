# Log keputusan

Catat setiap keputusan baru dan setiap perubahan kontrak (nama tabel, kolom, view, RPC, parameter, status, kode error) di sini. Entri terbaru di paling atas. Jika bertentangan dengan `PRD.md`, entri terbaru di sini yang berlaku.

| Tanggal | Keputusan | Status | Catatan |
| --- | --- | --- | --- |
| 2026-11-23 | Nama dan identitas website ditetapkan sebagai **Kodie**, dengan asisten AI resmi bernama **Kiko** (dapat diatur dari tabel `pengaturan`) | Final | Menutup keputusan terbuka nama website di PRD bagian 12 |
| 2026-11-23 | Fitur nilai tambah MVP: **AI Chatbot Single-Tenant ("Kiko")** berbasis Supabase Edge Function `chat` (SSE streaming), Primary LLM: Agnes AI (`agnes-3.0-flash`), Fallback LLM: Google Gemini (`gemini-3.8-flash`, `reasoning_effort: "low"`), Embedding: `gemini-embedding-001` (768d + L2 Normalization), Hybrid RAG RRF di Supabase `pgvector`, 4-Layer Guardrail, Context Injection (katalog live + data pengguna login via JWT/RLS), serta 3 jalur Handoff (WA/Email, tiket `laporan_masalah`, dan Live Takeover Realtime Admin untuk pengguna login) | Final | Tabel baru: `knowledge_sources`, `document_chunks`, `percakapan_chat`, `pesan_chat`; View: `chatbot_konfigurasi_publik` |
| 2026-11-23 | Target deployment & pengembangan backend langsung menggunakan Supabase Cloud project (tanpa Docker lokal) | Final | Seluruh skema tetap dikelola lewat migration di `backend/supabase/migrations/` |
| 2026-11-23 | Akun Google platform memakai Google One AI Pro (2 TB); durasi program tetap 60 menit (SD) dan 90 menit (SMP/SMA); `rekaman_url` di `laporan_sesi` opsional (nullable); laporan bisa dikirim sejak `mulai_pada`; `link_masuk_sesi` aktif H-15 menit s.d. `selesai_pada` | Final | Menghindari hambatan saat live demo 5 menit sekaligus menjaga standar durasi katalog |
| 2026-11-23 | Konfigurasi ruang Google Meet (`spaces.create`) memakai `config.accessType = 'OPEN'` | Final | Pengajar dan siswa yang lolos RPC `link_masuk_sesi` bisa langsung masuk tanpa menunggu di-admit host akun platform |
| 2026-11-23 | Tes minat hanya disarankan (tidak memblokir `buat_booking` untuk Simulasi Jurusan IT) | Final | Alur booking tetap lancar bagi pengguna yang langsung memesan |
| 2026-11-23 | Harga paket (4 sesi) & honor per sesi seed: Coding Dasar (Rp200.000 / Rp50.000), Kelas Reguler Teknologi (Rp275.000 / Rp65.000), Simulasi Jurusan IT (Rp300.000 / Rp75.000) | Final | Tetap bisa diubah admin di tabel `program` |
| 2026-11-23 | Penyelarasan skema: tambah kolom `level integer NOT NULL DEFAULT 1` di `kelas` dan parameter `p_level integer DEFAULT 1` di RPC `buka_kelas` | Final | Menyelaraskan relasi `kelas` ke `playbook(program_id, level, nomor_sesi)` dan F8 |
| 2026-11-23 | Penyelarasan skema: tambah kolom `nama_orang_tua text` dan `email_orang_tua text` (nullable) di tabel `siswa` | Final | Menampung data input registrasi siswa mandiri F1 sebelum persetujuan F2 |
| 2026-11-23 | Pendaftaran pengajar (F1 & F7): pilihan program (`pengajar_program`) dan unggah dokumen diisi di `/mengajar/profil` setelah login, bukan saat `signUp` awal | Final | Mengikuti alur rute frontend `/mengajar/profil` |
| 2026-11-22 | Backend memakai Supabase (Auth, Postgres + RLS, RPC, Edge Function, Storage, Realtime, Cron) | Final | PRD bagian 8 |
| 2026-11-22 | Monorepo: `frontend/` (Claude Code) dan `backend/` (Antigravity) dalam satu repository publik | Final | Rulebook meminta satu link repository |
| 2026-11-22 | Link Google Meet dibuat otomatis per sesi lewat Google Meet REST API, memakai satu akun Google platform | Final | Edge Function `buat-meet` |
| 2026-11-22 | Kapasitas kelas maksimal 10 untuk program SD dan 15 untuk SMP dan SMA | Final | |
| 2026-11-22 | Pembayaran manual: transfer atau QRIS, unggah bukti, lalu diverifikasi admin | Final | Payment gateway di luar MVP |
| 2026-11-22 | Tes minat jurusan IT masuk MVP | Final | Status sebagai syarat booking belum diputuskan |
| 2026-11-22 | Siswa SMP dan SMA boleh mendaftar sendiri, tetapi akunnya aktif setelah persetujuan orang tua | Final | Pasal 25 UU Pelindungan Data Pribadi |
| 2026-11-22 | Frontend: Next.js + TypeScript + Tailwind CSS + `@supabase/ssr` | Asumsi | Konfirmasi oleh tim |
| 2026-11-22 | Rumus persentase tes minat: skor bidang ÷ jumlah skor keempat bidang × 100, dibulatkan ke bilangan bulat | Asumsi | PRD F4 belum menyebut rumusnya. Frontend (mock) dan backend (`hitung_tes_minat`) wajib memakai rumus yang sama |

## Belum diputuskan

Detail lengkapnya ada di `PRD.md` bagian 12.

- [x] Jenis akun Google untuk Meet — diputuskan memakai Google One AI Pro (2 TB), durasi 60/90 menit, `rekaman_url` opsional.
- [ ] Pembagian peran Khalil dan Raihan (backend, serta proposal, konten, dan video)
- [x] Pengaturan akses ruang Meet — diputuskan `accessType = 'OPEN'` pada `spaces.create`.
- [x] Harga paket dan honor per sesi setelah kapasitas berubah — diputuskan Rp200rb/50rb (SD), Rp275rb/65rb (Reguler), Rp300rb/75rb (Simulasi IT).
- [x] Tes minat sebagai syarat booking Simulasi Jurusan IT atau hanya disarankan — diputuskan hanya disarankan.
- [ ] Program SMK Tech-Booster
- [x] Nama dan identitas website — diputuskan bernama **Kodie** (asisten AI: **Kiko**).
