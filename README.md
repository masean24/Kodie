# Kodie — Platform Bimbel Teknologi Daring SD, SMP, SMA & Simulasi Jurusan IT

**Kodie** adalah platform bimbingan belajar (bimbel) teknologi daring yang terjangkau untuk siswa **SD, SMP, dan SMA** di seluruh Indonesia, dilengkapi program **Simulasi Jurusan IT** serta asisten belajar virtual **Kiko**. Pengajar di Kodie adalah mahasiswa bidang IT dan pencari kerja paruh waktu terverifikasi yang mengajar menggunakan **Teaching Playbook** terstandar.

Karya ini dikembangkan untuk kompetisi **Software Development SEVENT X (Kategori Website)** dengan subtema:
- **SDG 4 (Quality Education):** Memperluas akses pendidikan teknologi berkualitas dari jenjang SD hingga SMA dan membantu siswa memilih jurusan kuliah IT melalui pengalaman praktik langsung.
- **SDG 8 (Decent Work and Economic Growth):** Membuka peluang kerja paruh waktu yang fleksibel, layak, dan terstandar bagi mahasiswa serta pencari kerja di bidang teknologi.

---

## Tautan Penting

| Kategori | Tautan |
| --- | --- |
| **Website Produksi (Live Demo)** | [https://kodie.xevora.me](https://kodie.xevora.me) |
| **Video Demo (YouTube)** | *(Segera diperbarui menjelang pengumpulan karya)* |
| **Repository GitHub** | [https://github.com/masean24/Kodie](https://github.com/masean24/Kodie) |
| **Dokumen Spesifikasi (PRD)** | [`docs/PRD.md`](docs/PRD.md) |
| **Log Keputusan Arsitektur** | [`docs/KEPUTUSAN.md`](docs/KEPUTUSAN.md) |
| **Serah Terima Kontrak BE → FE** | [`docs/SERAH-TERIMA-FE.md`](docs/SERAH-TERIMA-FE.md) |

---

## Tim Pengembang

| Nama | Peran |
| --- | --- |
| **Mgs. M. Fahim Rahmatullah** | Frontend Engineer (Next.js App Router, UI/UX, Aksesibilitas) |
| **Raihan Daris Ramadhan** | Backend Engineer & AI Integration (Supabase, Google Meet API, Hybrid RAG Chatbot) |
| **Khalil Amin Adillah** | Product, Kurikulum Teaching Playbook, Proposal & Dokumentasi Video |

---

## Fitur Utama

1. **Tiga Program Belajar Berjenjang, Silabus Sesi 1–4 & Waitlist Kelas Penuh:**
   - **Coding Dasar (SD Kelas 5–6):** Logika & pemrograman blok interaktif dengan Scratch (maks. 10 siswa/kelas, 60 menit/sesi, Rp200.000/paket 4 sesi).
   - **Kelas Reguler Teknologi (SMP & SMA Kelas 7–12):** Pemrograman web (HTML, CSS, JS), IoT virtual, dan AI dasar (maks. 15 siswa/kelas, 90 menit/sesi, Rp275.000/paket 4 sesi).
   - **Simulasi Jurusan IT (SMP Kelas 9 & SMA Kelas 10–12):** Eksplorasi 4 bidang kuliah IT (*Software Engineering*, *Jaringan Komputer*, *IoT*, *AI & Data*) selama 4 sesi yang menghasilkan **Rapor Rekomendasi Jurusan Kuliah** (Rp300.000/paket 4 sesi).
   - Setiap program dilengkapi **silabus publik Sesi 1–4** (`program.silabus`) serta fitur **Waitlist Kelas Penuh** (`waitlist_kelas`, RPC `daftar_waitlist_kelas` & `batal_waitlist_kelas`) yang mengirim notifikasi otomatis saat kursi kosong kembali.
2. **Perlindungan Data Anak (Kepatuhan Pasal 25 UU PDP):**
   - Siswa SD dikelola langsung melalui profil anak pada akun Orang Tua tanpa akun login terpisah.
   - Siswa SMP & SMA yang mendaftar mandiri berstatus `menunggu_persetujuan` dan baru aktif setelah orang tua menyetujui melalui tautan verifikasi sekali pakai (`/persetujuan/[token]`).
   - Persetujuan Kebijakan Privasi dicatat pada `pengguna.privasi_disetujui_pada`, dan asisten AI Kiko menyensor otomatis data pribadi anak (PII) sebelum penyimpanan pesan maupun pemanggilan model AI.
3. **Tes Minat Jurusan IT Interaktif:**
   - Kuis 12 soal berbobot seimbang yang memetakan minat siswa ke 4 bidang IT beserta rekomendasi jurusan kuliah dan program belajar.
4. **Otomatisasi Ruang Kelas Google Meet (`spaces.create`):**
   - Setiap kelas yang dibuka pengajar terverifikasi otomatis dibuatkan 4 ruang Google Meet mingguan oleh akun platform melalui Google Meet REST API. Link dijaga ketat dan hanya dapat diakses peserta terkonfirmasi mulai 15 menit sebelum sesi hingga sesi berakhir.
5. **12 Teaching Playbook, Bio & Ulasan Pengajar, Laporan Sesi & Rapor Jurusan:**
   - Panduan mengajar lengkap (**12 Teaching Playbook** Sesi 1–4 untuk seluruh 3 program) guna menjaga standar kualitas pengajar, ditambah **bio gaya mengajar** (`pengajar_publik.bio`) serta **ulasan publik anonim terverifikasi** (`ulasan_pengajar_publik`) untuk pengajar dengan minimal 3 rating tanpa membuka identitas anak.
   - Laporan kehadiran dan catatan evaluasi siswa terkirim secara *real-time* ke dashboard siswa dan orang tua tanpa *refresh* (dengan isolasi privasi catatan antar siswa).
6. **Asisten Virtual AI "Kiko" & Live Admin Takeover:**
   - Chatbot berbasis **Hybrid RAG (`pgvector` + Full-Text Search Reciprocal Rank Fusion)** dengan **Guardrail 4+ lapis** termasuk **Guardrail Privasi Anak (PII Auto-Masking)** — nomor HP/WA, NIK, email pribadi, alamat rumah, serta sandi/OTP disensor menjadi `[DATA PRIBADI DISENSOR]` sebelum disimpan dan tidak pernah dikirim ke LLM atau Embedding API — *Auto-Failover* LLM, *Context Injection* katalog kelas live & data pengguna (mematuhi RLS), serta **Live Takeover Realtime** oleh Admin.
7. **Kodie Lab (Coding Playground Tanpa Login), Showcase Karya & Karier Pengajar:**
   - **Kodie Lab (`/lab`):** 4 mode praktik langsung di browser — **Blok visual (Blockly)**, **Python Turtle**, **Web (HTML/CSS/JS live preview)**, dan **Python (Pyodide WebAssembly)** — dengan penyimpanan sementara lokal di `localStorage` perangkat tanpa mengunggah data pribadi anak.
   - Halaman publik **Showcase Karya (`/showcase`)** untuk menampilkan karya siswa dan **Karier (`/karier`)** untuk pendaftaran pengajar IT.

---

## Teknologi yang Digunakan

| Lapisan | Teknologi |
| --- | --- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, `@supabase/ssr`, React Hook Form, Zod, Lucide Icons |
| **Backend & Database** | Supabase (PostgreSQL 17, **12 SQL migrations**, Row Level Security di **27 tabel**, **9 View**, **29 RPC client-callable PL/pgSQL**, Supabase Auth, Storage, Realtime `notifikasi`/`percakapan_chat`/`pesan_chat`, `pg_cron` + `pg_net`) |
| **Edge Functions** | Deno Edge Functions (`buat-meet` untuk Google Meet REST API v2 & `chat` untuk SSE Streaming AI Chatbot + Guardrail PII) |
| **AI & RAG** | Hybrid Search `pgvector` (768d L2-normalized `gemini-embedding-001` + PostgreSQL FTS RRF), Guardrail Privasi Anak (PII Auto-Masking) & Anti-Injection, Auto-Failover LLM (Agnes AI → Gemini → Groq) |
| **Deployment Produksi** | Frontend Next.js (Docker standalone via Coolify VPS di `https://kodie.xevora.me`) & Backend Supabase Cloud |

---

## Akun Demo untuk Juri

Seluruh akun demo di bawah ini sudah tersedia di database produksi beserta data kelas, sesi, booking, laporan, rapor jurusan, dan rating.

- **Password untuk semua akun demo:** `DemoSeventX123!`

| Peran | Email | Keterangan Skenario |
| --- | --- | --- |
| **Admin** | `admin@seventx.id` | Akses penuh dashboard `/admin`: verifikasi pengajar, verifikasi pembayaran, laporan masalah, honor, dan Live Takeover chat |
| **Orang Tua 1** | `ortu1@seventx.id` | Memiliki profil anak SD (**Bima Aditya** kls 5), SMP (**Sinta Maharani** kls 8), serta terhubung dengan siswa SMA (**Fajar Nugroho** kls 11) |
| **Orang Tua 2** | `ortu2@seventx.id` | Memiliki profil anak SMA (**Raka Pratama** kls 11) |
| **Siswa Mandiri (Aktif)** | `siswa.aktif@seventx.id` | **Fajar Nugroho** (SMA kls 11) — memiliki hasil tes minat, booking selesai, laporan sesi, dan rapor rekomendasi jurusan |
| **Siswa Mandiri (Menunggu Persetujuan)** | `siswa.baru@seventx.id` | **Laras Putri Kinanti** (SMP kls 9) — untuk menguji pembuatan link persetujuan orang tua (`/siswa/persetujuan`) |
| **Pengajar Terverifikasi 1** | `pengajar1@seventx.id` | **Nadia Kusuma Putri** (Software & AI) — memiliki kelas aktif dengan link Google Meet asli |
| **Pengajar Terverifikasi 2** | `pengajar2@seventx.id` | **Bagus Pratama Wijaya** (Jaringan & IoT) — memiliki 3 ulasan rating, laporan sesi, rapor jurusan, dan honor |
| **Pengajar Terverifikasi 3** | `pengajar3@seventx.id` | **Citra Lestari Handayani** (Coding Dasar SD) — memiliki kelas terbuka dan kelas penuh |
| **Pengajar (Menunggu Verifikasi)** | `pengajar.baru@seventx.id` | **Dimas Putra Mahendra** — dokumen KTP & SKCK contoh sudah terunggah, siap diuji verifikasi dari akun Admin |

---

## Struktur Monorepo

```text
.
├── README.md                  ← Dokumentasi utama proyek
├── CLAUDE.md                  ← Panduan kerja agent & aturan monorepo
├── docs/
│   ├── PRD.md                 ← Spesifikasi produk, model data, dan kontrak API (F1–F14)
│   ├── KEPUTUSAN.md           ← Log keputusan arsitektur & perubahan kontrak
│   ├── SERAH-TERIMA-FE.md     ← Dokumentasi kontrak integrasi Backend -> Frontend
│   ├── PROMPT-CLAUDE-CODE.md  ← Rangkaian prompt terstruktur untuk pengembangan Frontend
│   ├── PROMPT-CHATBOT-FE.md   ← Spesifikasi UI widget chatbot Kiko & Live Admin Takeover
│   ├── PROMPT-ANTIGRAVITY.md  ← Rangkaian prompt pengembangan Backend
│   ├── knowledge/             ← Basis pengetahuan publik untuk Hybrid RAG Chatbot Kiko
│   └── konten/                ← 12 soal tes minat jurusan IT & 12 Teaching Playbook (Sesi 1–4)
├── frontend/                  ← Aplikasi web Next.js (App Router + TypeScript + Tailwind CSS)
└── backend/                   ← Proyek Supabase (12 SQL migrations, 2 Edge Functions, skrip seed, demo:reset & verifikasi)
```

---

## Cara Menjalankan Secara Lokal

### 1. Backend (`backend/`)

Backend sudah terhubung dan ter-deploy di Supabase Cloud. Untuk menjalankan skrip verifikasi, reset jadwal demo QA, seed ulang, atau regenerasi tipe dari lokal:

```bash
cd backend
cp .env.example .env
# Isi SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, dll. di .env

npm install
npm run typecheck          # Cek tipe TypeScript
npm run seed:akun          # Seed 9 akun demo & data kelas/booking/laporan (idempoten)
npm run demo:reset         # Reset jadwal QA & Live Demo (k1 pending +24j, k7Live +5m, k5 +18j, k2Penuh +5h)
npm run ingest:knowledge   # Ingest dokumen docs/knowledge/*.md ke pgvector
npm run test:chatbot       # Jalankan 28 unit test guardrail (termasuk PII) & L2 normalization Kiko
npm run test:rls           # Jalankan 45 pengujian otomatis RLS, View, RPC, Waitlist, PII & Live Chat
```

Panduan detail deployment migration dan Edge Function tersedia di [`backend/README.md`](backend/README.md).

### 2. Frontend (`frontend/`)

```bash
cd frontend
cp .env.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local
# Set NEXT_PUBLIC_USE_MOCK=false untuk terhubung langsung ke Supabase Cloud

npm install
npm run dev                # Jalankan server pengembangan di http://localhost:3000
npm run lint               # Cek linter
npm run typecheck          # Cek tipe TypeScript
npm run build              # Build produksi
```
