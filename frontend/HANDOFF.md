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
| 7 | Dashboard admin & seluruh kelola admin (F5–F8, F12–F14, bag. 8) | Selesai | `f2ef0ee` |
| 8 | Integrasi Supabase Cloud sungguhan (`NEXT_PUBLIC_USE_MOCK=false`, sinkronisasi tipe & view) | Selesai, **belum di-commit** | belum |
| 9 | Penerapan desain UI/UX final, Lighthouse, aksesibilitas, deploy + opsional Chatbot Kiko (`docs/PROMPT-CHATBOT-FE.md`) | Belum | |

## Checkpoint terakhir

**Prompt 8 selesai, belum di-commit** (tanggal 2026-11-23). `frontend/src/types/database.ts` sudah disinkronkan dari `backend/supabase/types/database.ts` (`masean24/Kodie` `main`), seluruh query view/RPC disesuaikan dan diverifikasi terhadap Supabase Cloud dengan akun demo `DemoSeventX123!`, serta `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test` (60 uji di 8 file), dan `npm run build` (51 static/PPR output App Router) lolos. `frontend/.env.local` terisi dengan `NEXT_PUBLIC_USE_MOCK=false`.

Langkah pertama untuk agen berikutnya: commit perubahan Prompt 8 di branch `claude/frontend-fondasi` (jangan ikutkan `.claude/` dan `.env.local`), lalu lanjut Prompt 9 (cek Lighthouse >= 90, audit aksesibilitas, serta widget AI Chatbot "Kiko" & Live Admin Takeover sesuai `docs/PROMPT-CHATBOT-FE.md` jika dikerjakan).

File baru dan yang diubah di Prompt 8:
- Konfigurasi & tipe: `frontend/.env.local` (lokal, tidak di-commit; `NEXT_PUBLIC_USE_MOCK=false`), `src/types/database.ts` (digabung dengan generate resmi `backend/supabase/types/database.ts`, termasuk `Chat`, `TipeNotifikasi` + `"chat_handoff"`, dan kolom asli semua view).
- Lapisan API & tampilan: `src/lib/api/{program.ts,pengajar.ts,kelas.ts,booking.ts,sesi.ts,tes-minat.ts,mengajar.ts,admin.ts}`, `src/components/rapor/tampilan-rapor.tsx`, `src/components/auth/form-masuk.tsx`, `src/app/(auth)/masuk/page.tsx`.
- Pengujian terotomasi: skrip cek Supabase Cloud memverifikasi view publik (`program`, `kelas_katalog`, `pengajar_publik`, `soal_minat_publik`), RPC `hitung_tes_minat`, serta login + RLS + signed URL untuk `siswa.aktif@seventx.id`, `siswa.baru@seventx.id`, `ortu1@seventx.id`, `pengajar1@seventx.id`, `pengajar2@seventx.id`, dan `admin@seventx.id`.

Belum diuji: pengujian interaktif mutasi ujung-ke-ujung penuh di browser (`360 px` & `1440 px`), deploy Vercel, audit Lighthouse >= 90, serta UI Chatbot Kiko (`docs/PROMPT-CHATBOT-FE.md`).

## Berikutnya: Prompt 9 (Lighthouse, aksesibilitas, deploy Vercel & opsional Chatbot Kiko)

Isi menurut `docs/PROMPT-CLAUDE-CODE.md` & `docs/PROMPT-CHATBOT-FE.md`: cek Lighthouse (minimal 90), audit aksesibilitas 360 px & 1440 px, bangun widget Chatbot "Kiko" + halaman `/admin/chat` jika masuk cakupan final, lalu deploy ke Vercel dengan environment variables Supabase Cloud.

## Kontrak backend yang dipakai Prompt 8

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
