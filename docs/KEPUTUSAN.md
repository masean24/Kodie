# Log keputusan

Catat setiap keputusan baru dan setiap perubahan kontrak (nama tabel, kolom, view, RPC, parameter, status, kode error) di sini. Entri terbaru di paling atas. Jika bertentangan dengan `PRD.md`, entri terbaru di sini yang berlaku.

| Tanggal | Keputusan | Status | Catatan |
| --- | --- | --- | --- |
| 2026-11-24 | Palet final v4 (disepakati tim): biru `#1D4ED8` (gradien `#172554` → `#2563EB`), tinta `#0F172A`, lime `#C6F64D` sebagai aksen identitas; menggantikan palet Teal Krayon di mode Light dan Dark | Final | Diambil dari mode "Usulan E" di salinan Figma tim, dengan koreksi kontras: `text-disabled` `#475569`, `border-strong` `#64748B`, ujung gradien hero `#2563EB` (gelap `#1D4ED8`), `primary-subtle`/`info-subtle` gelap `#172554`, teks chip gelap `#F1F5F9`, bayangan dan overlay transparan. Mode usulan A–D dihapus |
| 2026-11-24 | Aturan lime: tombol ajakan dan sorotan di halaman publik; di layar lain hanya penanda tipis (menu aktif, item navigasi aktif, langkah selesai, progres tes minat, badge "Baru"). Tombol aksi utama, tautan, dan cincin fokus tetap biru | Final | Token baru `color/accent`, `color/accent-subtle`, `color/on-accent`. Teks di atas lime selalu tinta. Lime tidak pernah jadi satu-satunya penanda state |
| 2026-11-23 | Tata letak v3 halaman publik: satu kontainer 1200 px (padding 120 di 1440, margin 16 di 360) untuk Header, Footer, dan semua section; judul section rata tengah dengan satu sorotan; satu ide per section dan teks dipangkas | Final | Beranda dibangun ulang dengan pola ini. Katalog mendapat band judul teal. Token baru `space/120` |
| 2026-11-23 | Visual khas Kodie: komponen `ObjekBidang` (empat ubin 3D vektor untuk Software, Jaringan, IoT, AI & Data) | Final | Bukan foto atau gambar AI. Dekoratif, beri `aria-hidden` di kode kecuali ada label bidang di dekatnya. Skalakan secara proporsional |
| 2026-11-23 | Nama website: **Kodie** | Final | Menggantikan placeholder "Nama Website" di Header, Footer, dan semua layar Figma. Logo dan identitas visual lain belum final |
| 2026-11-23 | Desain v2 (color blocking), palet Opsi A "Teal Krayon": merek teal `#007974` (gelap `#52cec4`), tinta `#012d2f`, latar `#f4f8f7` menggantikan krem | Final | Dipilih dari dua opsi di Figma (halaman Foundations, frame "Usulan v2 · Opsi A"). Semua pasangan teks lolos WCAG AA 4,5:1 di mode terang dan gelap |
| 2026-11-23 | Warna program (Coding Dasar kuning, Kelas Reguler Teknologi biru langit, Simulasi Jurusan IT ungu) dan warna bidang (Software periwinkle, Jaringan merah muda, IoT hijau pistachio, AI & Data oranye) punya arti tetap | Final | Koleksi Figma `Kategori` (Light/Dark): `soft`, `strong`, `deep`, `block`, `block-chip`, `block-to`. Teks di atas warna kuat selalu tinta. Sorotan kata dan tombol ajakan tidak pernah memakai warna kategori. Status selalu tampil dengan ikon dan teks |
| 2026-11-23 | Gradasi hanya tonal (satu keluarga warna) dan hanya di blok halaman publik; dashboard tetap datar, warna kategori di dashboard hanya sebagai penanda | Final | Titik gradasi terikat token (`color/brand-block-from/to`, `color/ink-block-to`, `*/block-to`), jadi ikut mode gelap. Kontras teks dicek di kedua ujung gradasi |
| 2026-11-23 | Tipografi v2: Display Lexend ExtraBold 76/80 (mobile 42), judul publik ExtraBold 60/52 (mobile 36/32), teks isi publik 20; heading dashboard Bold dengan ukuran v1 | Final | Gaya teks Figma `Display`, `Display Mobile`, `Publik/*`, `Heading/*` |
| 2026-11-23 | Radius v2: kartu besar 28 (`radius/card`), kartu kecil 18 (`radius/card-sm`), blok halaman 40 (`radius/block`), tombol tetap pill | Final | Takik persegi di tepi atas kartu (layer `takik balok`) dihapus dari semua komponen |
| 2026-11-23 | Token v2 hanya menambah, tidak ada nama token v1 yang berubah | Final | Token baru untuk frontend: lihat koleksi `Color` (`brand-block*`, `on-brand-block`, `highlight*`, `cta-*`, `focus-on-block`, `ink-block-to`), `Kategori`, dan `Dimension` (`radius/card-sm`, `radius/block`). Penerapan ke `frontend/` ditunda karena belum ada kode yang memakai token v1 |
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
- [x] Nama website: Kodie (2026-11-23). Logo dan identitas visual lain masih terbuka
