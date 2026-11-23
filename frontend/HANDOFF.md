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
| 6 | Halaman sesi, notifikasi realtime, rating, lapor masalah, rapor (F8, F10–F12, bag. 9) | Selesai | `f9c3558` |
| 7 | Dashboard admin & seluruh kelola admin (F5–F8, F12–F14, bag. 8) | Selesai, **belum di-commit** | belum |
| 8–9 | Lihat `docs/PROMPT-CLAUDE-CODE.md` | Belum | |

## Checkpoint terakhir

**Prompt 7 selesai, belum di-commit** (tanggal 2026-11-23). `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test` (60 uji di 8 file), dan `npm run build` (51 static/PPR output di App Router) lolos. Keputusan dicatat di `docs/KEPUTUSAN.md`.

Langkah pertama untuk agen berikutnya: commit perubahan Prompt 7 di branch `claude/frontend-fondasi` (jangan ikutkan `.claude/` dan `.env.local`), lalu lanjut Prompt 8 (integrasi dengan backend Supabase + verifikasi end-to-end dengan `NEXT_PUBLIC_USE_MOCK=false`).

File baru dan yang diubah di Prompt 7:
- Data, validasi & tes: `src/types/database.ts` (`AdminRingkasan`, `SesiAdmin`, `LogAdmin`), `src/lib/admin.ts`, `src/lib/validasi/admin.ts`, `src/lib/admin.test.ts` (6 uji baru), `src/lib/mock/store.ts` (seed pembayaran menunggu, dokumen KTP/SKCK pengajar baru, 2 laporan masalah termasuk prioritas tinggi `perilaku_tidak_pantas`, `sesiTanpaMeetIds`, `logAdmin`, pengaturan bank/QRIS), `src/lib/api/auth.ts`, `src/lib/api/booking.ts`, `src/lib/api/unggah.ts` (`unggahGambarQris`), `src/lib/api/admin.ts`, `src/lib/aksi/admin.ts`.
- Tampilan & rute: `src/components/area/{menu-peran.ts,nav-peran.tsx}`, `src/components/admin/{filter-antrean.tsx,aksi-pembayaran.tsx,aksi-pengajar.tsx,aksi-kelola.tsx}`, dan `src/app/admin/{page.tsx,loading.tsx,error.tsx}`, `/admin/pembayaran/{page.tsx,[id]/page.tsx}`, `/admin/pengajar/{page.tsx,[id]/page.tsx}`, `/admin/laporan-masalah/page.tsx`, `/admin/honor/page.tsx`, `/admin/kelas/page.tsx`, `/admin/program/page.tsx`, `/admin/pengaturan/page.tsx`, `/admin/log/page.tsx`.

Belum diuji: pemeriksaan visual langsung di browser (360 dan 1440 px) pada area `/admin/*` serta mode Supabase asli (`NEXT_PUBLIC_USE_MOCK=false`: view `admin_ringkasan`, signed URL bucket `bukti-bayar`, `dokumen-pengajar`, dan `pengaturan`, serta semua RPC admin di `docs/SERAH-TERIMA-FE.md`).

## Berikutnya: Prompt 8 (integrasi backend Supabase)

Isi menurut `docs/PROMPT-CLAUDE-CODE.md`: mencocokkan `src/types/database.ts` dengan hasil `supabase gen types` dari `backend/supabase/types/database.ts` (semua kolom bertanda `PERKIRAAN`), menguji seluruh alur dengan `NEXT_PUBLIC_USE_MOCK=false`, Realtime notifikasi, Storage privat, dan RPC backend.

## Kontrak backend yang dipakai Prompt 7

Sumber: `docs/PRD.md` bagian 7–9 dan `docs/SERAH-TERIMA-FE.md`.

- View `admin_ringkasan`, tabel `log_admin`, `pengaturan`, `program`, `kelas`, `sesi`, `honor`, `laporan_masalah`, `pembayaran`, `pengajar_program`, `profil_pengajar`.
- RPC `admin_setujui_pembayaran(p_pembayaran_id)`, `admin_tolak_pembayaran(p_pembayaran_id, p_alasan)`.
- RPC `admin_wawancara_selesai(p_pengajar_id, p_selesai)`, `admin_setujui_pengajar(p_pengajar_id, p_program_ids)`, `admin_tolak_pengajar(p_pengajar_id, p_alasan)`, `admin_nonaktifkan_pengguna(p_pengguna_id, p_alasan)`.
- RPC `admin_ubah_laporan_masalah(p_id, p_status)`, `admin_tandai_honor_dibayar(p_id)`, serta Edge Function `buat-meet({ kelas_id })`.
- Bucket privat `bukti-bayar`, `dokumen-pengajar`, dan `pengaturan` diakses via signed URL 5 menit (`createSignedUrl(..., 300)`).

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
