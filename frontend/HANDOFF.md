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
| 5 | Area pengajar (F7–F11, F13) | Selesai, **belum di-commit** | belum |
| 6–9 | Lihat `docs/PROMPT-CLAUDE-CODE.md` | Belum | |

## Checkpoint terakhir

**Prompt 5 selesai, belum di-commit** (tanggal 2026-11-23). `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test` (47 uji di 6 file), dan `npm run build` lolos. Keputusan dicatat di `docs/KEPUTUSAN.md`.

Langkah pertama untuk agen berikutnya: commit perubahan Prompt 5 di branch `claude/frontend-fondasi` (jangan ikutkan `.claude/` dan `.env.local`), cek tampilan `/mengajar/*` di browser (360 dan 1440 px) bila perlu, lalu mulai Prompt 6.

File baru dan yang diubah di Prompt 5:
- Data & validasi: `src/types/database.ts` (`ProfilPengajar`, `PengajarProgram`, `SesiSaya`, `Playbook`, `LaporanSesi`, `LaporanSiswa`, `RaporJurusan`, `Honor`, dsb.), `src/lib/mengajar.ts`, `src/lib/validasi/mengajar.ts`, `src/lib/mengajar.test.ts` (10 uji baru), `src/lib/mock/store.ts`, `src/lib/mock/data.ts`, `src/lib/api/auth.ts`, `src/lib/api/unggah.ts`, `src/lib/api/mengajar.ts`, `src/lib/aksi/mengajar.ts`.
- Tampilan & rute: `src/components/area/menu-peran.ts`, `src/components/area/layout-area.tsx`, `src/components/ui/formulir.tsx` (`Textarea`), `src/app/globals.css` (print CSS), `src/components/mengajar/*`, `src/app/mengajar/{page.tsx,loading.tsx,error.tsx,profil/page.tsx,kelas/page.tsx,kelas/baru/page.tsx,kelas/[id]/page.tsx,sesi/[id]/playbook/page.tsx,sesi/[id]/laporan/page.tsx,penghasilan/page.tsx}`.

Belum diuji: pemeriksaan visual langsung di browser (360 dan 1440 px) + cetak PDF playbook untuk Prompt 5, serta integrasi mode Supabase (`NEXT_PUBLIC_USE_MOCK=false`, Edge Function `buat-meet`, unggah bucket `foto-pengajar` dan `dokumen-pengajar`).

## Berikutnya: Prompt 6 (halaman sesi, notifikasi realtime, dan rapor)

Isi menurut `docs/PROMPT-CLAUDE-CODE.md`: halaman sesi untuk orang tua dan siswa (`/orang-tua/sesi/[id]` & `/siswa/sesi/[id]` — tombol Masuk kelas via `link_masuk_sesi`, laporan sesi, beri rating `beri_rating`, lapor masalah `laporan_masalah`), notifikasi realtime (`notifikasi` + fallback polling 30 detik + lonceng header), serta rapor rekomendasi jurusan (`/orang-tua/rapor/[id]` & `/siswa/rapor/[id]` dari view `rapor_saya`, beserta print CSS), plus menyambungkan kartu sesi terdekat dan laporan terbaru di dashboard orang tua dan siswa (`sesi_saya`, `laporan_saya`). Fitur F8, F10–F12, dan PRD bagian 9. Tunjukkan rencana ke pengguna dan tunggu persetujuan sebelum menulis kode. Layar Figma: frame "9. Halaman sesi" (node `24:2472`, file `bvc4Ub6KI68PvSf5Zors7a`).

## Kontrak backend yang dipakai Prompt 5

Sumber: `docs/PRD.md` bagian 7–9 dan `docs/SERAH-TERIMA-FE.md`.

- Profil & dokumen (F7): tabel `profil_pengajar`, `pengajar_program`; bucket `foto-pengajar` (publik, JPG/PNG ≤ 1 MB) & `dokumen-pengajar` (privat, JPG/PNG/PDF ≤ 2 MB) di path `{auth.uid()}/{uuid}.{ext}`.
- Kelas & sesi (F8): RPC `buka_kelas({ p_program_id, p_tanggal_mulai, p_jam_mulai, p_kapasitas, p_level? })` → `{ kelas_id, sesi_ids }`, lalu Edge Function `buat-meet` dengan `{ kelas_id }`; RPC `geser_sesi({ p_sesi_id, p_mulai_pada })`; RPC `link_masuk_sesi({ p_sesi_id })` → `{ meet_uri }`; view `sesi_saya` (tanpa `meet_uri`).
- Playbook (F9): RPC `playbook_sesi({ p_sesi_id })` → row `playbook` atau `null`.
- Laporan & rapor (F10–F11): RPC `kirim_laporan({ p_sesi_id, p_ringkasan, p_rekaman_url, p_kendala, p_siswa, p_rapor })` & `ubah_laporan(...)` (terkunci 24 jam: `LAPORAN_TERKUNCI`).
- Penghasilan (F13): tabel `honor` (`jumlah`, `status`: `belum_dibayar` / `dibayar`, `dibayar_pada`).

## Pola kode yang sudah dipakai (ikuti)

- Komponen tidak memanggil Supabase langsung. Semua data lewat `src/lib/api/*` (cek `pakaiMock` dari `src/lib/api/sumber.ts`). Fungsi yang memakai cookie hanya dipanggil di server.
- Aksi yang mengubah data lewat Server Function (`"use server"`) di `src/lib/aksi/*` atau `src/app/(auth)/aksi.ts`, mengembalikan `{ galat }` berisi pesan bahasa Indonesia dari `pesanError()` (`src/lib/errors.ts`).
- Data mock yang berubah disimpan di `globalThis` lewat `storeMock()` (`src/lib/mock/store.ts`). Akun mock: `*@contoh.id`, password `kodie-mock-123` (pengajar terverifikasi: `pengajar@contoh.id`; menunggu verifikasi: `pengajar.baru@contoh.id`).
- Next.js 16 dengan Cache Components: data yang membaca cookie, `searchParams`, `params`, atau waktu harus di dalam `<Suspense>` atau memanggil `await connection()` sebelum menyentuh `storeMock()` / `new Date()`. `usePathname` di Client Component juga dibungkus `<Suspense>`.
- Jangan memanggil fungsi yang diekspor dari modul `"use client"` di Server Component (pindahkan ke modul biasa, misalnya `src/components/mengajar/konstanta.ts`).
- Token desain di `src/app/globals.css`; komponen dasar di `src/components/ui/`. Teks antarmuka bahasa Indonesia, tanggal WIB (`src/lib/format.ts`), uang `Rp275.000`.

## Cara menjalankan

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true
npm run dev
npx next typegen && npm run lint && npm run typecheck && npm test && npm run build
```
