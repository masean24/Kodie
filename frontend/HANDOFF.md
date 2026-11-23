# Handoff frontend Kodie

File ini diperbarui di setiap checkpoint supaya pekerjaan bisa dilanjutkan oleh agen lain (misalnya Antigravity) kapan saja. Baca dari atas ke bawah.

## Lokasi kerja

- Repository: monorepo `sevent-x-bimbel`. Area kerja frontend hanya `frontend/`. Jangan ubah `backend/` dan `docs/PRD.md`.
- Pekerjaan ini ada di git worktree `.claude/worktrees/prompt-revision-design-c2bf99`, branch `claude/frontend-fondasi`.
- Aturan wajib: `CLAUDE.md` (root), `frontend/CLAUDE.md`, `docs/PRD.md`, `docs/KEPUTUSAN.md`. Rencana per sesi: `docs/PROMPT-CLAUDE-CODE.md` (Prompt 1–9).

## Status per prompt

| Prompt | Isi | Status | Commit |
| --- | --- | --- | --- |
| 1 | Fondasi, halaman publik, mock | Selesai | `8c45c04` |
| 2 | Auth, route guard | Selesai | `2df6d26` |
| 3 | Persetujuan orang tua, profil anak, dashboard | Selesai | `1b2306b` |
| 4 | Booking dan pembayaran (F6) | Selesai | `08cfee1` |
| 5 | Area pengajar (F7–F11, F13) | Selesai | `c08b842` |
| 6 | Halaman sesi, notifikasi realtime, rating, lapor masalah, rapor (F8, F10–F12, bag. 9) | Selesai, **belum di-commit** | belum |
| 7–9 | Lihat `docs/PROMPT-CLAUDE-CODE.md` | Belum | |

## Checkpoint terakhir

**Prompt 6 selesai, belum di-commit** (tanggal 2026-11-23). `npm run lint`, `npm run typecheck`, `npm test` (54 uji di 7 file), dan `npm run build` (41 rute App Router) lolos. Keputusan dicatat di `docs/KEPUTUSAN.md`.

Langkah pertama untuk agen berikutnya: commit perubahan Prompt 6 di branch `claude/frontend-fondasi` (jangan ikutkan `.claude/` dan `.env.local`), lalu mulai Prompt 7 (Dashboard admin).

File baru dan yang diubah di Prompt 6:
- Data & validasi: `src/types/database.ts` (`LaporanSaya`, `RaporSaya`, `Rating`, `LaporanMasalah`, `Notifikasi`), `src/lib/sesi.ts`, `src/lib/validasi/sesi.ts`, `src/lib/sesi.test.ts` (7 uji baru), `src/lib/mock/store.ts` (seed rapor Raka, laporan sesi 1–4, notifikasi mock), `src/lib/api/mengajar.ts` (trigger notifikasi mock saat kirim laporan / geser jadwal), `src/lib/api/sesi.ts`, `src/lib/api/notifikasi.ts`, `src/lib/aksi/sesi.ts`.
- Tampilan & rute: `src/components/situs/lonceng-notifikasi.tsx`, `src/components/situs/kerangka-situs.tsx`, `src/components/sesi/{detail-sesi.tsx,interaksi-sesi.tsx}`, `src/components/rapor/tampilan-rapor.tsx`, `src/components/area/{menu-peran.ts,kartu-dashboard.tsx}`, `src/app/{orang-tua,siswa}/page.tsx`, `src/app/{orang-tua,siswa}/sesi/[id]/page.tsx`, `src/app/{orang-tua,siswa}/rapor/{page.tsx,[id]/page.tsx}`, dan tombol Laporkan masalah di `src/app/(publik)/pengajar/[id]/page.tsx`.

Belum diuji: pemeriksaan visual langsung di browser (360 dan 1440 px) + cetak PDF rapor untuk Prompt 6, serta mode Supabase asli (`NEXT_PUBLIC_USE_MOCK=false`, Realtime `postgres_changes` pada tabel `notifikasi`, view `sesi_saya`, `laporan_saya`, `rapor_saya`, RPC `beri_rating`, dan insert `laporan_masalah`).

## Berikutnya: Prompt 7 (dashboard admin)

Isi menurut `docs/PROMPT-CLAUDE-CODE.md`: dashboard admin (`/admin`, view `admin_ringkasan`), antrean verifikasi pengajar (`/admin/pengajar` & `/admin/pengajar/[id]`, signed URL `dokumen-pengajar`, centang wawancara, setujui/tolak/nonaktifkan), verifikasi pembayaran (`/admin/pembayaran` & `/admin/pembayaran/[id]`, signed URL `bukti-bayar`, setujui/tolak dengan alasan), laporan masalah (`/admin/laporan-masalah`, prioritas tinggi perilaku tidak pantas paling atas), honor (`/admin/honor`, tandai dibayar), kelola kelas & daftar sesi tanpa link Meet (`/admin/kelas`), kelola program (`/admin/program`), kelola rekening & QRIS (`/admin/pengaturan`), serta log admin (`/admin/log`). Fitur F14 dan aksi admin di PRD bagian 8. Tunjukkan rencana ke pengguna dan tunggu persetujuan sebelum menulis kode. Layar Figma: frame "11. Admin: verifikasi pembayaran" (node `26:3058`, file `bvc4Ub6KI68PvSf5Zors7a`).

## Kontrak backend yang dipakai Prompt 6

Sumber: `docs/PRD.md` bagian 7–9 dan `docs/SERAH-TERIMA-FE.md`.

- View `sesi_saya`, `laporan_saya` (`rekaman_url` null bagi non-pengajar/admin), dan `rapor_saya`.
- RPC `link_masuk_sesi({ p_sesi_id })` → `{ meet_uri }` (15 menit sebelum mulai s.d. selesai untuk booking `terkonfirmasi`).
- RPC `beri_rating({ p_sesi_id, p_siswa_id, p_bintang, p_komentar? })` (1x per sesi per siswa setelah laporan masuk).
- Tabel `laporan_masalah` (insert `pelapor_id`, `sesi_id`, `pengajar_id`, `kategori`, `deskripsi`; prioritas `tinggi` otomatis untuk `perilaku_tidak_pantas`).
- Tabel `notifikasi` (Realtime `INSERT` filter `pengguna_id=eq.${userId}`, fallback polling 30 detik) dan RPC `baca_semua_notifikasi()`.

## Pola kode yang sudah dipakai (ikuti)

- Komponen tidak memanggil Supabase langsung. Semua data lewat `src/lib/api/*` (kecuali langganan Realtime di `lonceng-notifikasi.tsx` dan unggah langsung di `src/lib/api/unggah.ts` via `buatClientBrowser()`). Fungsi yang memakai cookie hanya dipanggil di server.
- Aksi yang mengubah data lewat Server Function (`"use server"`) di `src/lib/aksi/*` atau `src/app/(auth)/aksi.ts`, mengembalikan `{ galat }` berisi pesan bahasa Indonesia dari `pesanError()` (`src/lib/errors.ts`).
- Data mock yang berubah disimpan di `globalThis` lewat `storeMock()` (`src/lib/mock/store.ts`). Akun mock: `*@contoh.id`, password `kodie-mock-123`.
- Next.js 16 dengan Cache Components: data yang membaca cookie, `searchParams`, `params`, atau waktu harus di dalam `<Suspense>` atau memanggil `await connection()`. `usePathname` di Client Component juga dibungkus `<Suspense>`.
- Jangan memanggil fungsi yang diekspor dari modul `"use client"` di Server Component (pindahkan ke modul biasa).
- Token desain di `src/app/globals.css`; komponen dasar di `src/components/ui/`. Teks antarmuka bahasa Indonesia, tanggal WIB (`src/lib/format.ts`), uang `Rp275.000`.

## Cara menjalankan

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true
npm run dev
npx next typegen && npm run lint && npm run typecheck && npm test && npm run build
```
