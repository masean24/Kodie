# Handoff frontend Kodie

File ini diperbarui di setiap checkpoint supaya seluruh riwayat pengerjaan, kontrak backend, dan cara menjalankan tetap terdokumentasi rapi.

## Lokasi kerja

- Repository: monorepo `sevent-x-bimbel`. Area kerja frontend hanya `frontend/`. Jangan ubah `backend/` dan `docs/PRD.md`.
- Pekerjaan ini ada di git worktree `.claude/worktrees/prompt-revision-design-c2bf99`, branch `claude/frontend-fondasi`.
- Aturan wajib: `CLAUDE.md` (root), `frontend/CLAUDE.md`, `docs/PRD.md`, `docs/KEPUTUSAN.md`. Rencana per sesi: `docs/PROMPT-CLAUDE-CODE.md` (Prompt 1–9) & `docs/PROMPT-CHATBOT-FE.md`.

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
| 8 | Integrasi Supabase Cloud sungguhan (`NEXT_PUBLIC_USE_MOCK=false`, sinkronisasi tipe & view) + penyelarasan Navbar Figma | Selesai | `2f4e38c`, `7d47211` |
| 9 | Logo resmi Kodie (`Kodie_Logo_Package`), AI Chatbot "Kiko" & Live Admin Takeover (`/admin/chat`), metadata/favicon/OG, serta verifikasi build & browser | Selesai | di-commit di sesi ini |

## Checkpoint terakhir

**Seluruh Prompt 1–9 selesai** (tanggal 2026-11-23). Perubahan pada Prompt 9 mencakup:

- **Logo resmi, Favicon & OpenGraph (`Kodie_Logo_Package`)**:
  - Aset disalin ke `frontend/src/app/favicon.ico`, `frontend/public/` (`favicon.ico`, `favicon.svg`, `favicon_small.svg`, `site.webmanifest`, ikon PNG `180/192/512/maskable`, `og-kodie.png`, `og-kodie-dark.png`), serta `frontend/public/logo/` (6 varian SVG Horizontal, Horizontal_Slogan, dan Symbol full-color & reverse).
  - `src/components/situs/logo.tsx` & `src/components/situs/footer.tsx`: vektor resmi Kodie (`<> Kodie`) & slogan `"From Hello World to Hello Future"`, adaptif Light/Dark mode lewat token tema CSS dan ringkas menjadi simbol di layar ponsel `< 640 px` saat pengguna masuk.
  - `src/app/layout.tsx`: menambahkan `metadataBase`, `icons`, `manifest: "/site.webmanifest"`, dan `openGraph` (`og-kodie.png`).
- **AI Chatbot "Kiko" & Live Admin Takeover (`docs/PROMPT-CHATBOT-FE.md`)**:
  - `src/components/chatbot/chatbot.config.ts` & `avatar-kiko.tsx`: konfigurasi avatar terpisah (memakai `SimbolKodie` sambil menunggu aset maskot Kiko yang sedang dikembangkan; siap diganti dengan mengubah `mode: "image"` & `imageUrl`).
  - `src/components/chatbot/widget-kiko.tsx` & `markdown-aman.tsx`: widget floating kanan-bawah di atas bottom nav mobile, animasi buka-tutup dua arah (`prefers-reduced-motion` aman), streaming SSE (`fetch` + `ReadableStream` + `AbortController` ke Edge Function `chat`), tombol **Stop** high-contrast dark pill, Markdown aman tanpa `dangerouslySetInnerHTML` & sitasi `[n]` tersanitasi, penyimpanan riwayat `localStorage`, serta 3 jalur handoff (WhatsApp/Email, Buat Tiket, dan Live Chat Realtime via `minta_bantuan_admin_chat` + `kirim_pesan_live_chat` + `admin_selesaikan_chat`).
  - `src/app/admin/chat/page.tsx`, `src/app/admin/chat/[id]/page.tsx`, & `src/components/admin/panel-live-chat.tsx`: halaman antrean & ruang balas realtime Admin (ditambahkan ke `MENU_PERAN.admin`).
  - `src/app/admin/pengaturan/page.tsx` & `src/components/admin/aksi-kelola.tsx`: form **Asisten AI Kiko & Live Chat** (`chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`).
- **Verifikasi, Audit Lighthouse, & Uji Alur Demo (PRD Bagian 11)**:
  - `npx next typegen`, `npm run lint`, `npm run typecheck`, `npm test` (9 file, **67 uji** termasuk fallback `buatUuid` HTTP non-Secure Context), dan `npm run build` (53 rute App Router Partial Prerender) **lolos 100%**.
  - **Skor Lighthouse (production build `next start`, mode mobile)**:
    - `/`: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100** (LCP `1.1 s`, CLS `0`)
    - `/program`: Performance **94**, Accessibility **100**, Best Practices **100**, SEO **100** (CLS `0`, setelah menyelaraskan `judulTag="h2"` pada `KartuProgram`)
    - `/kelas`: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100** (LCP `0.9 s`, CLS `0`)
    - `/tes-minat`: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100** (LCP `0.9 s`, CLS `0`, setelah caching soal via `"use cache"` `cacheLife("hours")` pada shell PPR)
  - **Uji E2E Browser Headless pada Supabase Cloud (`DemoSeventX123!`)**:
    - Tamu (`/`, `/kelas`, pengerjaan 12 soal `/tes-minat` → `/tes-minat/hasil` dengan kalimat penegasan saran & RPC `hitung_tes_minat`), `siswa.baru@seventx.id` (`/siswa/persetujuan`), `siswa.aktif@seventx.id` (`/siswa`, `/siswa/booking`, `/siswa/rapor`), `ortu1@seventx.id` (`/orang-tua`, `/orang-tua/anak`, `/orang-tua/booking`, `/orang-tua/rapor` + detail rapor + lonceng notifikasi), `pengajar1@seventx.id` (`/mengajar/kelas`, `/mengajar/profil`, `/mengajar/penghasilan`, detail kelas), dan `admin@seventx.id` (`/admin/pembayaran`, `/admin/pengajar`, `/admin/laporan-masalah`, `/admin/honor`, `/admin/chat`, `/admin/pengaturan`) seluruhnya lulus tanpa console/page error, serta akses HTTP LAN (`http://192.168.110.34:3000/`) & streaming SSE Widget Kiko terverifikasi.
  - Deploy produksi Vercel dilakukan saat tim mempublikasikan domain (memasang env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_USE_MOCK=false`, dan `NEXT_PUBLIC_SITE_URL`).

## Kontrak backend yang dipakai Prompt 8 & 9

Sumber: `docs/PRD.md` bagian 7–9, `docs/SERAH-TERIMA-FE.md`, dan `docs/PROMPT-CHATBOT-FE.md`.

- **Chatbot & Live Chat**: Edge Function `POST /functions/v1/chat` (SSE events `delta`, `citations`, `guardrail_refusal`, `done`, `error`), view `chatbot_konfigurasi_publik`, tabel Realtime `percakapan_chat` & `pesan_chat`, serta RPC `minta_bantuan_admin_chat`, `kirim_pesan_live_chat`, `admin_ambil_alih_chat`, `admin_selesaikan_chat`.
- **Inti Platform**: View `admin_ringkasan`, `kelas_katalog`, `pengajar_publik`, `soal_minat_publik`, `sesi_saya`, `laporan_saya`, `rapor_saya`; RPC transaksi & verifikasi admin (`admin_setujui_pembayaran`, `admin_tolak_pembayaran`, `admin_wawancara_selesai`, `admin_setujui_pengajar`, `admin_tolak_pengajar`, `admin_nonaktifkan_pengguna`, `admin_ubah_laporan_masalah`, `admin_tandai_honor_dibayar`), Edge Function `buat-meet`, serta signed URL bucket privat.

## Pola kode yang sudah dipakai (ikuti)

- Komponen tidak memanggil Supabase langsung kecuali langganan Realtime (`lonceng-notifikasi.tsx`, `widget-kiko.tsx`, `panel-live-chat.tsx`), stream SSE (`widget-kiko.tsx`), dan unggah langsung (`src/lib/api/unggah.ts`). Operasi data server lewat `src/lib/api/*` dan mutasi lewat `"use server"` di `src/lib/aksi/*`.
- Next.js 16 dengan Cache Components: data yang membaca cookie, `searchParams`, `params`, atau waktu harus di dalam `<Suspense>` atau memanggil `await connection()`.
- Token desain di `src/app/globals.css`; teks antarmuka bahasa Indonesia, tanggal WIB (`src/lib/format.ts`), uang `Rp275.000`.

## Cara menjalankan

```bash
cd frontend
npm install
# Isi .env.local dengan NEXT_PUBLIC_USE_MOCK=false serta URL & anon key Supabase Cloud
npm run dev
npx next typegen && npm run lint && npm run typecheck && npm test && npm run build
```
