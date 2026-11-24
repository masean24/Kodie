# Handoff frontend Kodie

File ini diperbarui di setiap checkpoint supaya seluruh riwayat pengerjaan, keputusan visual/teknis, kontrak backend, dan cara menjalankan tetap terdokumentasi rapi untuk serah terima ke Claude.

## Lokasi kerja & status Git

- Repository: monorepo `sevent-x-bimbel`. Area kerja frontend hanya `frontend/` (plus catatan keputusan di `docs/KEPUTUSAN.md`). **Jangan ubah** `backend/` dan `docs/PRD.md`.
- Worktree aktif: `.claude/worktrees/baca-handoff-md-315ddd`
- Branch lokal: `claude/baca-handoff-md-315ddd`. Push dilakukan langsung ke `main` dengan `git push origin HEAD:main` (fast-forward; `git fetch` dulu dan rebase bila ada commit tim baru). Remote: `github.com/masean24/Kodie`.
- Commit terakhir yang sudah di-push ke `main`: `79135f4` (24 November 2026).
- Produksi: `https://kodie.xevora.me` (Coolify, auto-redeploy setiap push ke `main`; lihat `frontend/DEPLOY-COOLIFY.md`).
- **Jangan pernah commit**: `.claude/`, `frontend/.env.local`, dan `docs/SERAH-TERIMA-FE.md`.
- **Jangan pernah** menambahkan atribusi Claude (`Co-Authored-By`, "Generated with Claude") di commit atau PR.
- Pengguna meminta kerja persis sesuai permintaan ("make no mistake"), tanpa mengerjakan hal di luar yang diminta. Tanyakan dulu bila menyangkut keputusan produk.
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
| Revisi 4 | Halaman `/karier` (pengajar tidak lagi lewat `/daftar`), Kodie Lab `/lab` (HTML/CSS/JS + Python/Pyodide), toggle tema 3 opsi dengan reveal melingkar, transisi halaman, Motion | Selesai | `b7db252` |
| Revisi 5 | Redesain hero & section keunggulan beranda (`docs/kodie_landing_page_redesign.html`) | Selesai | `1886ce4` |
| Revisi 6 | Sapaan Kiko tidak menutupi konten, judul ganda verifikasi pembayaran | Selesai | `7daf2c2` |
| Revisi 7 | Deploy Coolify (Dockerfile standalone, `/api/sehat`, tutorial) | Selesai | `80e5d75` |
| Revisi 8 | Shadow tipis kartu publik (`shadow-kartu`) | Selesai | `4ba2d0d` |
| Revisi 9 | Kodie Lab mode **Blok** (Blockly) & **Python Turtle** | Selesai | `851a5c7` |
| Revisi 10 | Form login/daftar `method="post"`, tema tanpa kedip, judul tab dinamis, `loading.tsx` area login | Selesai | `c0b0684`, `6b21c24` |
| Revisi 11 | Navbar **kaca melayang** saat scroll + perbaikan audit QA Gemini (`docs/audit_qa_kodie_revisi.md`) | Selesai | `ea65e22`, `8a62333` |
| Revisi 12 | GSAP, footer menyatu dengan konten, tema hanya Terang/Gelap, logo navbar lebih kecil, animasi panel notifikasi, hero kata demi kata, band halaman seragam | Selesai | `46302cf` |
| Revisi 13 | Animasi masuk GSAP untuk semua elemen di semua halaman + ilustrasi hero | Selesai | `114253f` |
| Revisi 14 | Simulasi kelas live ala Google Meet (karakter pixel) di section 3 beranda | Selesai | `79135f4` |

## Checkpoint terbaru (setelah `8a62333` hingga `79135f4`)

1. **GSAP & revisi tampilan (`46302cf`)**
   - Paket `gsap` + `@gsap/react`; pengaturan bersama di `src/lib/gsap.ts` (`kurangiGerak()` untuk `prefers-reduced-motion`).
   - Tema hanya **Terang/Gelap** (`ThemeSwitch` di `kontrol-header.tsx`). Tanpa pilihan tersimpan, skrip `<head>` di `layout.tsx` mengambil tema awal sekali dari preferensi sistem lalu memasang `data-theme` eksplisit.
   - Logo navbar 36 px desktop, 28 px ponsel (`logo.tsx`).
   - Panel notifikasi (`lonceng-notifikasi.tsx`): buka/tutup GSAP lewat `autoAlpha`, item muncul berurutan (`data-item-notif`).
   - Hero beranda: `RevealHero` + `KataHero` (`src/components/situs/reveal-hero.tsx`), judul dan paragraf muncul kata demi kata. Elemen `.kata-hero`/`.hero-muncul` mulai transparan lewat CSS dengan cadangan tampil sendiri setelah 3 detik.
   - Band halaman publik: `BandKodie` di `judul-halaman.tsx` (gradien, lebar, pola titik sama dengan hero). Dipakai di Program, Kelas, Tes minat (band baru), Kodie Lab, Showcase, Karier.
   - Footer: gradasi dari `--k-bg` ke `--footer-bg` 260 px dengan titik antara `color-mix`, dan lapisan pendaran langit di-mask dari transparan. Penyebab garis patah sebelumnya: pendaran radial masih berwarna tepat di garis atas footer.
2. **Animasi elemen global (`114253f`)**
   - `AnimasiElemen` (`src/components/situs/animasi-elemen.tsx`) dipasang di `KerangkaSitus`, jadi berlaku di semua halaman publik, auth, area login, dan footer. Blok konten (judul, paragraf, `li`, kartu, form, tabel, gambar, tombol) naik + memudar saat masuk layar (IntersectionObserver + `gsap.to`, stagger 0,06 dtk). Jika leluhur sudah dianimasikan, anaknya dilewati.
   - **Hanya node yang sudah dihidrasi React** (punya properti `__reactFiber$`) yang diubah gayanya; mengubah node yang belum dihidrasi memicu hydration mismatch dan elemen tertinggal transparan. Pemindaian ulang 8 detik setelah dimuat + `MutationObserver` untuk konten Suspense/navigasi.
   - Cleanup mengembalikan elemen yang belum muncul (`clearProps`); tanpa itu StrictMode menjalankan efek dua kali dan footer tidak pernah tampil.
   - Pra-sembunyi `#konten` lewat `html[data-gerak="pra"]` (skrip `<head>`), dilepas paling lama 0,9 dtk; cadangan CSS 1,2 dtk.
   - Pengecualian: tambahkan `data-tanpa-animasi` pada wilayah yang tidak boleh dianimasikan. Hero, editor Lab (CodeMirror/Blockly), dialog, `aria-live`, dan elemen yang sudah dianimasikan Motion otomatis dilewati.
   - Ilustrasi hero (orbit, empat ubin, dua lencana) ikut timeline `RevealHero`; pembungkus luar dianimasikan GSAP agar animasi CSS `melayang-*` tetap jalan.
3. **Simulasi kelas live (`79135f4`)**, `src/components/simulasi-kelas/`
   - Section baru `SimulasiKelasLive` di `page.tsx` (setelah Keunggulan, sebelum "Tiga program"), berlabel "Simulasi interaktif, bukan rekaman kelas asli".
   - `simulasi-kelas-malas.tsx`: dimuat dengan `next/dynamic` (`ssr: false`) hanya saat ±600 px dari layar; kerangka berukuran tetap.
   - `simulasi-kelas.tsx`: tata letak Google Meet (tanpa logo Google). Kiko mempresentasikan layar **tiruan** Kodie Lab mode Python (HTML/CSS, bukan CodeMirror/Blockly/Pyodide), mengetik kode, menekan Jalankan, lalu menjelaskan. Peserta bertanya bergantian (12 dtk); pengunjung bisa bertanya di obrolan (jawaban kata kunci `jawabanKikoUntuk`, tanpa AI), angkat tangan, reaksi, CC, mikrofon/kamera, keluar.
   - `pixel.tsx`: karakter pixel art diporting dari `docs/kodie_live_class_simulasi_google_meet_zoom.html` (grid 64 × 40). Persegi berurutan berwarna sama digabung menjadi satu `<path>` (±580 elemen DOM total, referensi ±824).
   - `data.ts`: materi, peserta (Mgs. M. Fahim R, Raihan Daris Ramadhan, Khalil Amin Adillah, Ica Septriani, Davina), dan ruangan. Gaya rambut/kacamata dipilih bebas, belum dicek pengguna.
   - Timer dan animasi CSS berhenti di luar layar (`.sk-jeda`). Panel samping dirender sekali sesuai lebar layar (`useSyncExternalStore` + `matchMedia`) agar tidak ada id ganda. CSS di blok `SIMULASI KELAS LIVE` dan `px-*` di `globals.css`.

## Checkpoint sebelumnya (setelah `a988a43` hingga `8a62333`)

1. **Karier, Kodie Lab, tema, transisi (`b7db252`)**
   - `/daftar` hanya untuk orang tua dan siswa; `?peran=pengajar` dialihkan ke `/karier`. Posisi statis di `src/lib/karier.ts`, detail `/karier/[slug]` memakai `FormPengajar`.
   - `/lab` publik tanpa akun: CodeMirror 6, pratinjau HTML/CSS/JS di iframe, Python lewat Pyodide di module worker `public/lab/python-worker.js`, simpanan `localStorage` kunci `kodie:lab:v1`.
   - `ThemeSwitch` (`src/components/situs/kontrol-header.tsx`): Terang/Gelap/Ikuti sistem, kunci `kodie:tema`, reveal melingkar via View Transitions API. Skrip tema di `<head>` (`layout.tsx`) mencegah kedip.
   - Transisi halaman: `<ViewTransition>` di `template.tsx` tiap grup (`src/components/situs/transisi-halaman.tsx`), CSS di `globals.css`.
2. **Beranda (`1886ce4`)**: hero `.hero-kodie` (sisa 32 px di bawah agar latar terlihat), section keunggulan dengan 3 pill. Teks "diajar oleh mahasiswa..." dilarang di hero.
3. **Deploy Coolify (`80e5d75`)**: `frontend/Dockerfile` (node:22-alpine, `output: "standalone"`, non-root, HEALTHCHECK `/api/sehat`), `frontend/.dockerignore`, `frontend/DEPLOY-COOLIFY.md`. Base Directory `/frontend`.
4. **Kodie Lab Blok & Turtle (`851a5c7`)**: mesin turtle bersama `src/lib/lab/turtle.ts`, blok Kiko `src/lib/lab/blok.ts` + `src/components/lab/blok-kiko.ts`, editor `editor-blok.tsx`, kanvas `kanvas-turtle.tsx`, modul Python `public/lab/turtle_kodie.py`. Tanpa XP/misi/login.
5. **Perbaikan kecil (`c0b0684`, `6b21c24`)**: form auth `method="post"` (kredensial tak pernah masuk URL sebelum hidrasi), `generateMetadata` di `kelas/[id]`, `program/[slug]`, `pengajar/[id]`, 35 `loading.tsx` di area login (`KerangkaHalamanArea`).
6. **Navbar kaca melayang (`ea65e22`)**
   - `src/components/situs/header.tsx` + blok `HEADER` di `globals.css`. Di puncak: bar penuh. Setelah scroll (`useMengambang`, histeresis 24/4 px): panel latar `.hdr-panel` menyusut ke kaca membulat; isi header tidak bergeser. Laci ponsel `.hdr-laci` ikut jadi kartu kaca.
   - `view-transition-name` dipasang di `.hdr-panel` (`site-header-panel`) dan bar (`site-header`), **bukan** di `<header>`: elemen bernama menjadi backdrop root sehingga blur anak tidak melihat halaman.
   - Blur memakai utilitas Tailwind `backdrop-blur-lg backdrop-saturate-150`. Deklarasi `backdrop-filter` manual di `globals.css` dibuang Lightning CSS (hanya `-webkit-` tersisa) — jangan pakai.
   - Tombol ID/EN disembunyikan (komponen `LanguageSwitch` tetap ada).
7. **Revisi audit QA (`8a62333`)**
   - Kiko (`widget-kiko.tsx`): batas 10 dtk token pertama, 20 dtk jeda; jawaban lokal untuk 4 pertanyaan populer di `src/lib/chatbot-cadangan.ts` (diringkas dari `docs/knowledge/01–04`, perbarui bila harga berubah). Maskot pemicu disembunyikan di `/lab` saat chat tertutup; chat tetap bisa dibuka dari footer.
   - `src/components/pengajar/avatar-pengajar.tsx`: foto rusak atau ≤ 8 px (seed demo backend berupa PNG 1×1) jatuh ke inisial. Label kartu: "Terverifikasi KTP/KTM & SKCK".
   - `menu-akun.tsx`: nama panjang dipotong (`max-w-[140px]`, `2xl:180px`), chevron `shrink-0`.
   - Halaman statis `/showcase` (4 contoh proyek Lab), tautan footer "Showcase Karya" ke sana.

## Checkpoint lama (perubahan setelah Prompt 8 hingga `a988a43`)

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

- **Pemeriksaan di `79135f4`**: `npm run lint`, `npx tsc --noEmit`, `npx vitest run` (11 file / 88 tes), dan `npm run build` lulus.
- **Cek browser (Chrome headless lewat CDP, mode mock)**: setelah scroll penuh, 0 elemen tertinggal transparan di `/`, `/program`, `/kelas`, `/tes-minat`, `/lab`, `/karier`, `/showcase`, `/masuk`, `/daftar`, area orang tua, admin, pengajar, dan siswa; navigasi klien aman; konsol bersih dari hydration error. Simulasi: dimuat malas, 0 animasi berjalan saat di luar layar, panel obrolan/orang/keluar berfungsi, 0 scroll horizontal di 375 px.
- **Belum dicek**: produksi setelah deploy, Lighthouse ulang (pra-sembunyi `#konten` ≤0,9 dtk bisa menurunkan LCP).
- **Pemeriksaan di `8a62333`**: `npm run lint` lulus, `npx tsc --noEmit` lulus, `npx vitest run` **11 file / 88 tes** lulus, `npm run build` lulus (termasuk `/showcase`). Jika build gagal "Failed to fetch … from Google Fonts", ulangi dengan `NODE_OPTIONS=--dns-result-order=ipv4first npm run build` (masalah jaringan lokal, bukan kode).
- **Cek browser di `8a62333`**: navbar puncak/scroll di 1440, 1280, 375 px (terang & gelap), laci ponsel, header login dengan nama panjang tanpa overflow, `/lab` tombol Bersihkan bisa diklik, fallback Kiko saat layanan chat disimulasikan macet, `/showcase`.
- **Pemeriksaan lama (`a988a43`) di `frontend/`**:
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

## Catatan teknis penting

- **Hook backslash**: perintah Bash yang memuat backslash (heredoc, `node -e`, `\n` di sed) diblokir. Tulis lewat Write/Edit atau file skrip.
- **React Compiler (lint `preserve-manual-memoization`)**: ekspresi `cx(kondisi && "hidden", …)` di `widget-kiko.tsx` membuat lint gagal; pakai atribut `hidden={…}`.
- **Pane browser tersembunyi**: rAF dan transisi CSS berhenti, View Transition melempar "Document hidden". Itu bukan bug kode. Untuk tangkapan layar saat pane tersembunyi, pakai Chrome headless lewat CDP (`--remote-debugging-port`).
- **GSAP + hidrasi**: jangan mengubah `style` node yang belum dihidrasi React; ikuti pola `terhidrasi()` di `animasi-elemen.tsx`.
- **React Compiler**: jangan me-reassign variabel lokal saat render (lint `react-hooks/immutability`); pindahkan ke fungsi murni di luar komponen.
- Mode mock: `NEXT_PUBLIC_USE_MOCK=true`, akun di `src/lib/mock/akun.ts` (password `kodie-mock-123`). Jangan login ke Supabase produksi dengan password dari sesi Claude.
- `.claude/launch.json` (lokal, tidak di-commit): `kodie-dev` (Supabase) dan `kodie-dev-mock`, keduanya port 3000.

## Pekerjaan tertunda

- **Playbook H-1 akun demo (audit P0-1)**: aturan H-1 adalah kriteria PRD F9 dan dicek RPC `playbook_sesi`, jadi tidak di-bypass di frontend. Butuh tim backend menyeed sesi `pengajar1@seventx.id` yang mulai < 24 jam dari waktu penjurian.
- Tautan footer "Panduan belajar" masih ke `/program` (halaman valid, label kurang pas); belum diputuskan.
- Daftar "Verifikasi tambahan" di `docs/audit_qa_kodie_revisi.md` yang belum dijalankan penuh: semua halaman di 375/768 px, mode Turtle/HTML/Python di `/lab` pada produksi, dashboard admin, halaman sekunder footer.
- README utama belum mencakup Kodie Lab, Karier, Showcase, Coolify, GSAP, dan simulasi kelas.
- Penampilan karakter pixel tiap anggota tim (rambut, kacamata, hijab) perlu dikonfirmasi pengguna di `simulasi-kelas/data.ts`.
- Lighthouse ulang setelah perubahan besar; uji realtime skenario demo 5–6 di Supabase Cloud.
- Password admin demo: ditunda oleh pengguna ("nanti saja").
- Batas lomba 30 November 2026 (target internal 28 November 2026).

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
