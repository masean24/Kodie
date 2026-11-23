# Handoff frontend Kodie

File ini diperbarui di setiap checkpoint supaya seluruh riwayat pengerjaan, keputusan visual/teknis, kontrak backend, dan cara menjalankan tetap terdokumentasi rapi untuk serah terima ke Claude.

## Lokasi kerja & status Git

- Repository: monorepo `sevent-x-bimbel`. Area kerja frontend hanya `frontend/` (plus catatan keputusan di `docs/KEPUTUSAN.md`). **Jangan ubah** `backend/` dan `docs/PRD.md`.
- Worktree aktif: `.claude/worktrees/prompt-revision-design-c2bf99`
- Branch aktif: `claude/frontend-fondasi` (berbasis di atas `8dd0b95` pada `claude/prompt-revision-design-c2bf99`). Saat handoff ini dibuat, commit pada `claude/frontend-fondasi` baru tersimpan secara lokal — belum di-push ke `origin` dan belum di-merge ke `main`.
- **Jangan pernah commit**: `.claude/` dan `frontend/.env.local`.
- Aturan & rujukan wajib: `CLAUDE.md` (root), `frontend/CLAUDE.md`, `docs/PRD.md`, `docs/KEPUTUSAN.md`, `docs/PROMPT-CLAUDE-CODE.md`, dan `docs/PROMPT-CHATBOT-FE.md`.

## Status per prompt & revisi lanjutan

| Tahap | Isi | Status | Commit |
| --- | --- | --- | --- |
| Prompt 1 | Fondasi Next.js, token desain, halaman publik (mode mock) | Selesai | `e07ab0f` |
| Prompt 2 | Auth masuk, daftar per peran, dan route guard (`F1`) | Selesai | `98d660d` |
| Prompt 3 | Persetujuan orang tua, profil anak, dan dashboard (`F2`, `F3`, `F4`) | Selesai | `5f7e6b0` |
| Prompt 4 | Booking dan pembayaran manual (`F6`) | Selesai | `9dcf522` |
| Prompt 5 | Area pengajar, playbook, laporan sesi, rapor, dan penghasilan (`F7–F11`, `F13`) | Selesai | `e593c29` |
| Prompt 6 | Halaman sesi, notifikasi realtime, rating, lapor masalah, dan rapor (`F8`, `F10–F12`) | Selesai | `b637ace` |
| Prompt 7 | Dashboard admin & seluruh kelola admin (`F5–F8`, `F12–F14`) | Selesai | `bf0fc22` |
| Prompt 8 | Integrasi Supabase Cloud sungguhan (`NEXT_PUBLIC_USE_MOCK=false`, tipe/view/RPC) + penyelarasan Navbar & RoleNav Figma | Selesai | `bb3822a`, `8258138` |
| Prompt 9 | Logo resmi Kodie (`Kodie_Logo_Package` → `Kodie_Logo_Packageasli`), AI Chatbot "Kiko" & Live Admin Takeover (`/admin/chat`), akses HTTP LAN, optimasi LCP `/tes-minat`, audit Lighthouse & E2E | Selesai | `277df3d`, `d589fc6`, `d5fbf22`, `fc84272` |
| Revisi UI 1 | Maskot 2D interaktif SVG Kiko pada Widget Kiko (ukuran konsisten & gerak delta waktu) | Selesai | `93fe743`, `507ac73` |
| Revisi UI 2 | Footer lanskap piksel 8-bit (`#pixel-stage`, 2 mode Light/Dark otomatis, tanpa kartu *Komunitas Belajar Aktif*) | Selesai | `0ef80ea`, `c454cd0` |
| Revisi UI 3 | Skala font, `line-height` pill `<Sorotan>` (hindari huruf `g` tertimpa), koma `#judul-nilai`, serta alignment kartu & `ObjekBidang` halaman publik | Selesai | `a988a43` |

## Checkpoint terakhir (perubahan setelah Prompt 8 hingga `a988a43`)

1. **Logo Resmi Final, Favicon & OpenGraph (`Kodie_Logo_Packageasli`, `277df3d`, `d5fbf22`)**:
   - Aset disalin ke `frontend/src/app/favicon.ico`, `frontend/public/` (`favicon.ico`, `favicon.svg`, `favicon_small.svg`, `site.webmanifest`, ikon PNG `180/192/512/maskable`, `og-kodie.png`, `og-kodie-dark.png`), dan `frontend/public/logo/` (varian SVG Horizontal, Horizontal_Slogan, Symbol full-color/reverse, serta varian `*_tight.svg` light-bg/dark-bg).
   - `src/components/situs/logo.tsx` menyediakan `SimbolKodie`, `LogoKodieSlogan`, dan `Logo` versi `6_Web_Navbar_Tight` (otomatis beralih ke `SimbolKodie` di `< 640 px` saat pengguna masuk).
   - `src/app/layout.tsx` menambahkan `metadataBase`, `icons`, `manifest: "/site.webmanifest"`, dan `openGraph` (`og-kodie.png`).

2. **AI Chatbot "Kiko", Maskot 2D Interaktif & Live Admin Takeover (`277df3d`, `93fe743`, `507ac73`)**:
   - `src/components/chatbot/maskot-kiko.tsx`, `avatar-kiko.tsx`, & `chatbot.config.ts`: `CHATBOT_AVATAR_CONFIG` (`mode: "kiko-2d"`) memakai komponen SVG interaktif `MaskotKiko` berdimensi tombol tetap (`h-[78px] w-[76px]` ponsel, `sm:h-[95px] sm:w-[92px]` desktop agar tidak mengecil tiba-tiba saat ditekan) dengan fisika `requestAnimationFrame` berbasis delta waktu (`dt * 60`), lirikan kursor/kolom ketik, lip-sync bicara, mode tidur idle (`zZz`), dan blip Web Audio API (`soundEnabled`). Masih dapat dialihkan ke gambar statis lewat `mode: "image"` & `imageUrl`.
   - `src/components/chatbot/widget-kiko.tsx` & `markdown-aman.tsx`: streaming SSE (`fetch` + `ReadableStream` + `AbortController` ke Edge Function `chat`), tombol **Stop** high-contrast dark pill, Markdown aman tanpa `dangerouslySetInnerHTML`, sitasi `[n]` tersanitasi, penyimpanan riwayat `localStorage`, serta 3 jalur handoff (WhatsApp/Email, Buat Tiket, dan Live Chat Realtime via `minta_bantuan_admin_chat` + `kirim_pesan_live_chat` + `admin_selesaikan_chat`).
   - `src/app/admin/chat/page.tsx`, `src/app/admin/chat/[id]/page.tsx`, & `src/components/admin/panel-live-chat.tsx`: halaman antrean & ruang balas realtime Admin (termasuk item menu di `MENU_PERAN.admin`).
   - `src/app/admin/pengaturan/page.tsx` & `src/components/admin/aksi-kelola.tsx`: form **Asisten AI Kiko & Live Chat** (`chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`).

3. **Dukungan Akses HTTP LAN (`d589fc6`)**:
   - `src/lib/uuid.ts` (`buatUuid()`): membungkus `crypto.randomUUID()` dengan fallback `crypto.getRandomValues()` agar pembuatan ID pesan di `widget-kiko.tsx` dan path upload di `src/lib/api/unggah.ts` tetap berjalan pada akses `http://<IP-LAN>:3000` (non-Secure Context).
   - `frontend/next.config.ts`: menambahkan `allowedDevOrigins` untuk `localhost`, `127.0.0.1`, `192.168.110.34`, `192.168.*.*`, dan `10.*.*.*`.

4. **Footer Lanskap Piksel 8-Bit Kodie (`0ef80ea`, `c454cd0`)**:
   - `src/components/situs/footer.tsx` (`"use client"`, mempertahankan atribut `data-situs` untuk `@media print`) & `src/app/globals.css`: terdiri atas grid navigasi 4 kolom (`Program`, `Mulai`, `Bantuan`, `Komunitas`), baris brand (`SimbolKodie` + `"From Hello World to Hello Future"` + keterangan SEVENT X 2026) beserta ikon sosial, dan panggung piksel `#pixel-stage` (`176 px`) berisi `LangitPiksel`, `BangunanPiksel` (Drone, Halte Belajar Kodie, Kodie Café, Gedung Kampus Kodie), serta `KarakterBerjalanPiksel` (Kiko dengan `#pixel-bubble` & `.do-hop`, Bit-Cat, dan 3 siswa piksel 2-frame).
   - Mendukung murni **2 mode** (`day` dan `night`, tanpa mode senja dan tanpa kartu atas *Komunitas Belajar Aktif*) yang tersinkronisasi otomatis ke `[data-theme]` situs dan `prefers-color-scheme: dark` via `MutationObserver`.

5. **Perbaikan Tipografi, `<Sorotan>`, & Alignment Halaman Publik (`a988a43`)**:
   - `src/components/ui/dasar.tsx` (`Sorotan`): menggunakan `inline-block rounded-full px-[0.38em] py-[0.04em] leading-[1.18] align-baseline [box-decoration-break:clone] [-webkit-box-decoration-break:clone]` supaya pill tidak menimpa descender huruf `g` di baris atasnya.
   - `src/app/(publik)/page.tsx`: ukuran & `line-height` hero (`h1` `32/42` → `sm:40/52` → `lg:50/64`) dengan pembungkus `mt-1 inline-block md:whitespace-nowrap` pada `"SD sampai SMA"`, penyesuaian skala `#judul-nilai`, `#judul-program`, `#judul-cara`, `#judul-pengajar`, dan `#judul-ajakan`, serta `span.whitespace-nowrap` membungkus pill beserta koma di `#judul-nilai` agar tidak menjadi koma yatim di layar sempit.
   - `src/components/program/kartu-program.tsx` & `kartu-pengajar.tsx`: penyeragaman `h-full`, padding `p-6`, `leading-snug`, serta perataan lencana durasi/sesi dan tombol CTA di bagian bawah (`mt-auto pt-2 flex flex-col gap-4`).
   - `src/components/situs/judul-halaman.tsx`, `program/[slug]/page.tsx`, `kelas/[id]/page.tsx`, `tes-minat/hasil.tsx`, `tes-minat/kuis.tsx`, & `kebijakan-privasi/page.tsx`: proporsi heading lebih ringkas (`28px..46px` dengan `line-height ~1.25–1.3×`) dan penyesuaian breakpoint `ObjekBidang` dekoratif (`hidden lg:block` / `hidden xl:block`).

## Status verifikasi terkini

- **Pemeriksaan setelah edit terakhir (`a988a43`) di `frontend/`**:
  - `npm run lint` (`eslint`) — lulus.
  - `npm run typecheck` (`tsc --noEmit`) — lulus.
  - `npm test` (`vitest run`) — 9 file pengujian, **67 tes** lulus (termasuk uji `buatUuid()` fallback).
  - `npm run build` (`next build`) — **53 rute** App Router (PPR) berhasil dibangun.
  - **Verifikasi visual peramban headless (`http://localhost:3000`, `1440×900` & `360×800`)**: jarak vertikal `"Belajar coding dan teknologi"` vs pill `"SD sampai SMA"` bersih (huruf `g` tidak tertimpa), koma pada `#judul-nilai` menempel di baris yang sama, `0` horizontal overflow (`html` lebar `1424.8 px` / `344.8 px`), dan `0` console/page error. *(Catatan: pemeriksaan kesejajaran 3 `KartuProgram` serta banner `/program` & `/kelas` dilakukan sesaat sebelum pembungkusan koma `#judul-nilai` di `page.tsx` dan tercatat `0` overlap `ObjekBidang`.)*
- **Audit historis sebelum revisi UI pasca-Prompt 9 (`fc84272`)**:
  - **Lighthouse (production build `next start`, mobile)**: `/` (**100/100/100/100**, LCP `1.1 s`, CLS `0`), `/program` (**94/100/100/100**, CLS `0`), `/kelas` (**100/100/100/100**, LCP `0.9 s`, CLS `0`), `/tes-minat` (**100/100/100/100**, LCP `0.9 s`, CLS `0`).
  - **Uji E2E Supabase Cloud (`DemoSeventX123!`)**: 6 skenario peran PRD Bagian 11 (`tamu`, `siswa.baru@seventx.id`, `siswa.aktif@seventx.id`, `ortu1@seventx.id`, `pengajar1@seventx.id`, `admin@seventx.id`), notifikasi realtime, serta streaming SSE Widget Kiko lulus.

## Kontrak backend yang dipakai

Sumber: `docs/PRD.md` bagian 7–9, `docs/SERAH-TERIMA-FE.md`, dan `docs/PROMPT-CHATBOT-FE.md`.

- **Chatbot & Live Chat**: Edge Function `POST /functions/v1/chat` (SSE events `delta`, `citations`, `guardrail_refusal`, `done`, `error`), view `chatbot_konfigurasi_publik`, tabel Realtime `percakapan_chat` & `pesan_chat`, serta RPC `minta_bantuan_admin_chat`, `kirim_pesan_live_chat`, `admin_ambil_alih_chat`, `admin_selesaikan_chat`.
- **Inti Platform**: View `admin_ringkasan`, `kelas_katalog`, `pengajar_publik`, `soal_minat_publik`, `sesi_saya`, `laporan_saya`, `rapor_saya`; RPC transaksi & verifikasi admin (`admin_setujui_pembayaran`, `admin_tolak_pembayaran`, `admin_wawancara_selesai`, `admin_setujui_pengajar`, `admin_tolak_pengajar`, `admin_nonaktifkan_pengguna`, `admin_ubah_laporan_masalah`, `admin_tandai_honor_dibayar`), Edge Function `buat-meet`, serta signed URL bucket privat.

## Pola kode yang sudah dipakai (ikuti)

- Komponen tidak memanggil Supabase langsung kecuali langganan Realtime (`lonceng-notifikasi.tsx`, `widget-kiko.tsx`, `panel-live-chat.tsx`), stream SSE (`widget-kiko.tsx`), dan unggah langsung (`src/lib/api/unggah.ts`). Operasi data server lewat `src/lib/api/*` dan mutasi lewat `"use server"` di `src/lib/aksi/*`.
- Next.js 16 dengan Cache Components (`cacheComponents: true` di `next.config.ts`): data yang membaca cookie, `searchParams`, `params`, atau waktu harus di dalam `<Suspense>` atau memanggil `await connection()`; data publik statis memakai `"use cache"` + `cacheLife("hours")` (misal `ambilSoalMinat()` di `src/lib/api/tes-minat.ts`).
- Token desain di `src/app/globals.css`; teks antarmuka bahasa Indonesia, tanggal WIB (`src/lib/format.ts`), uang `Rp275.000`.

## Langkah lanjutan untuk Claude (opsional sesuai kebutuhan tim)

- Jalankan server lokal jika ingin meninjau perubahan secara interaktif (server latar belakang sebelumnya terhenti saat restart).
- Review diff `claude/prompt-revision-design-c2bf99..claude/frontend-fondasi` bila akan merge ke `main` atau push ke `origin`.
- Jika ingin verifikasi metrik terbaru setelah `93fe743`–`a988a43`, jalankan ulang audit Lighthouse mobile pada `/`, `/program`, `/kelas`, `/tes-minat` serta spot-check alur E2E.
- Saat deploy produksi (mis. Vercel): pasang env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_USE_MOCK=false`, dan `NEXT_PUBLIC_SITE_URL`, serta pastikan firewall Windows tidak memblokir port `3000` jika pengujian lokal dibuka dari perangkat LAN.

## Cara menjalankan

```bash
cd frontend
npm install
# Isi .env.local dengan NEXT_PUBLIC_USE_MOCK=false serta URL & anon key Supabase Cloud

# Pengembangan lokal atau akses LAN:
npm run dev
# atau produksi lokal & akses LAN (setelah npm run build):
npm run build && npx next start --hostname 0.0.0.0 --port 3000

# Verifikasi penuh:
npx next typegen && npm run lint && npm run typecheck && npm test && npm run build
```
