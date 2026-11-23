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
| 4 | Booking dan pembayaran (F6) | Selesai, **belum di-commit** | belum |
| 5–9 | Lihat `docs/PROMPT-CLAUDE-CODE.md` | Belum | |

## Checkpoint terakhir

**Prompt 4 selesai, belum di-commit** (tanggal 2026-11-23). Lint, typecheck, 37 uji, dan build lolos. Keputusan dicatat di `docs/KEPUTUSAN.md`.

Langkah pertama untuk agen berikutnya: commit perubahan Prompt 4 di branch `claude/frontend-fondasi` (jangan ikutkan `.claude/launch.json` dan `.env.local`), lalu mulai Prompt 5.

File baru dan yang diubah di Prompt 4:
- Data: `src/types/database.ts` (Booking, Pembayaran, InfoPembayaran), `src/lib/mock/store.ts` (booking contoh Raka dengan bukti ditolak), `src/lib/mock/data.ts` (kursi terpakai ikut booking mock), `src/lib/booking.ts`, `src/lib/validasi/bukti.ts`, `src/lib/api/booking.ts`, `src/lib/api/unggah.ts`, `src/lib/aksi/booking.ts`, uji `src/lib/booking.test.ts`.
- Tampilan: `src/components/booking/*`, rute `src/app/{orang-tua,siswa}/booking/{page.tsx,baru/page.tsx,[id]/page.tsx}`, tombol Pesan per peran di `src/app/(publik)/kelas/[id]/page.tsx`, kartu "booking perlu dibayar" di dashboard, menu Booking di `src/components/area/menu-peran.ts`, `public/qris-contoh.svg`.
- Perbaikan umum: `await connection()` di `ambilPenggunaSaya` (mode mock) dan `infoPersetujuan`, supaya data mock yang memakai waktu tidak dibaca saat prerender.

Sudah diuji di browser (mode mock): tombol Pesan per peran; wizard siswa dan orang tua (anak yang tidak cocok jenjang/kelas tidak bisa dipilih); redirect ke langkah Bayar; alasan penolakan tampil; validasi file (format dan > 2 MB); kirim bukti menjadi "Bukti sedang diperiksa"; booking ganda ditolak; pembatalan; kartu dashboard; tidak ada scroll horizontal di 360 px; tampilan 1440 sesuai Figma 6.

Belum diuji: mode Supabase (anon key belum diisi di `.env.local`), unggah sungguhan ke bucket `bukti-bayar`, RLS tabel `pembayaran` untuk membaca alasan penolakan.

Verifikasi admin (setujui/tolak bukti) ada di Prompt 7; di mode mock booking berhenti di "Bukti sedang diperiksa".

## Berikutnya: Prompt 5 (area pengajar)

Isi menurut `docs/PROMPT-CLAUDE-CODE.md`: profil dan unggah dokumen pengajar (`/mengajar/profil`), buka kelas (`/mengajar/kelas/baru`, RPC `buka_kelas` lalu Edge Function `buat-meet`), playbook (`/mengajar/sesi/[id]/playbook`, RPC `playbook_sesi`, print CSS), form laporan dan rapor (`/mengajar/sesi/[id]/laporan`, RPC `kirim_laporan`/`ubah_laporan`), dan penghasilan (`/mengajar/penghasilan`, tabel `honor`). Fitur F7–F11 dan F13. Tunjukkan rencana ke pengguna dan tunggu persetujuan sebelum menulis kode. Layar Figma: frame "10. Area pengajar" (node `25:2934`, file `bvc4Ub6KI68PvSf5Zors7a`).
## Rencana Prompt 4 (disetujui pengguna)

1. [x] Tipe `Booking`, `Pembayaran`, `InfoPembayaran` di `src/types/database.ts`; data mock booking di `src/lib/mock/store.ts`; API `src/lib/api/booking.ts` (mock + Supabase); validasi file bukti `src/lib/validasi/bukti.ts` + uji.
2. [x] Server Functions di `src/lib/aksi/booking.ts`; tombol Pesan di `/kelas/[id]` sesuai peran (tamu ke `/masuk?lanjut=`, orang tua ke `/orang-tua/booking/baru?kelas=`, siswa ke `/siswa/booking/baru?kelas=`, pengajar/admin nonaktif).
3. [x] Wizard `/orang-tua/booking/baru` (pilih siswa yang cocok jenjang/kelas, periksa, pesan) dan `/siswa/booking/baru` (langsung periksa; siswa belum disetujui diarahkan ke persetujuan).
4. [x] `/…/booking` (daftar per kelompok status) dan `/…/booking/[id]` (instruksi bayar, rekening + salin, QRIS, unggah bukti JPG/PNG/PDF ≤ 2 MB, alasan penolakan, batalkan sebelum bukti diunggah).
5. [x] Kartu "booking perlu dibayar" di dashboard orang tua dan siswa; menu peran tambah item Booking (`src/components/area/menu-peran.ts`).
6. [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; cek browser 360 dan 1440 px.
7. [x] Catat keputusan di `docs/KEPUTUSAN.md`; perbarui file ini; minta pengguna commit.

## Kontrak backend yang dipakai Prompt 4

Sumber: `docs/PRD.md` bagian 5, 7, 8, 9 dan `docs/SERAH-TERIMA-FE.md` (file untracked di checkout utama; berisi password demo, jangan di-commit).

- `buat_booking({ p_kelas_id, p_siswa_id })` → `{ id, kode, status, total, batas_bayar_pada }`. Galat: `KELAS_PENUH`, `BOOKING_GANDA`, `SISWA_BELUM_DISETUJUI`.
- `batalkan_booking({ p_booking_id })` → `{ id, status: 'dibatalkan' }`. Hanya sebelum bukti diunggah.
- Unggah ke bucket `bukti-bayar` di path `{booking_id}/{uuid}.{ext}` (JPG/PNG/PDF, maks 2 MB), lalu `kirim_bukti_bayar({ p_booking_id, p_path })` → `{ pembayaran_id, booking_id, status: 'menunggu_verifikasi' }`. Galat `FILE_TIDAK_VALID`.
- Tabel `booking`: id, kode, kelas_id, siswa_id, dibuat_oleh, status, total, batas_bayar_pada, dibuat_pada. Status: menunggu_pembayaran, menunggu_verifikasi, terkonfirmasi, selesai, kedaluwarsa, dibatalkan.
- Tabel `pembayaran`: id, booking_id, bukti_path, diunggah_pada, status (menunggu/disetujui/ditolak), alasan_penolakan, diverifikasi_oleh, diverifikasi_pada.
- Tabel `pengaturan` (kunci, nilai): nama_bank, nomor_rekening, nama_pemilik_rekening, qris_path. Gambar QRIS dari bucket privat `pengaturan` lewat `createSignedUrl(path, 300)`.

## Pola kode yang sudah dipakai (ikuti)

- Komponen tidak memanggil Supabase langsung. Semua data lewat `src/lib/api/*` (cek `pakaiMock` dari `src/lib/api/sumber.ts`). Fungsi yang memakai cookie hanya dipanggil di server.
- Aksi yang mengubah data lewat Server Function (`"use server"`) di `src/lib/aksi/*` atau `src/app/(auth)/aksi.ts`, mengembalikan `{ galat }` berisi pesan bahasa Indonesia dari `pesanError()` (`src/lib/errors.ts`).
- Data mock yang berubah disimpan di `globalThis` lewat `storeMock()` (`src/lib/mock/store.ts`). Akun mock: `*@contoh.id`, password `kodie-mock-123`.
- Next.js 16 dengan Cache Components: data yang membaca cookie, `searchParams`, `params`, atau waktu harus di dalam `<Suspense>`. `usePathname` di Client Component juga dibungkus `<Suspense>`.
- Jangan memanggil fungsi yang diekspor dari modul `"use client"` di Server Component (pindahkan ke modul biasa).
- Token desain di `src/app/globals.css`; komponen dasar di `src/components/ui/`. Teks antarmuka bahasa Indonesia, tanggal WIB (`src/lib/format.ts`), uang `Rp275.000`.

## Cara menjalankan

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true
npm run dev
npm run lint && npm run typecheck && npm test && npm run build
```
