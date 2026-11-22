# Log keputusan

Catat setiap keputusan baru dan setiap perubahan kontrak (nama tabel, kolom, view, RPC, parameter, status, kode error) di sini. Entri terbaru di paling atas. Jika bertentangan dengan `PRD.md`, entri terbaru di sini yang berlaku.

| Tanggal | Keputusan | Status | Catatan |
| --- | --- | --- | --- |
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

- [ ] Jenis akun Google untuk Meet. Akun gratis membatasi rapat 3 peserta atau lebih maksimal 60 menit dan tidak bisa merekam. Rekomendasi sementara: semua sesi 55 menit.
- [ ] Pembagian peran Khalil dan Raihan (backend, serta proposal, konten, dan video)
- [ ] Pengaturan akses ruang Meet (siapa boleh langsung masuk)
- [ ] Harga paket dan honor per sesi setelah kapasitas berubah
- [ ] Tes minat sebagai syarat booking Simulasi Jurusan IT atau hanya disarankan
- [ ] Program SMK Tech-Booster
- [ ] Nama dan identitas website
