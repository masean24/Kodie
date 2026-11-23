# Prompt Claude Code (Frontend) — AI Chatbot "Kiko" & Live Admin Takeover

Cara pakai: buka Claude Code di root repository (area kerja `frontend/`), lalu salin dan kirim blok prompt di bawah ini setelah fondasi frontend utama siap.

---

```text
Kamu mengerjakan frontend Next.js di folder `frontend/` untuk website bimbel teknologi daring **Kodie** (lomba SEVENT X). Area kerjamu HANYA folder `frontend/`. Jangan mengubah `backend/` dan jangan mengubah `docs/PRD.md`.

Sebelum menulis kode, baca file berikut:
1. `CLAUDE.md` dan `frontend/CLAUDE.md`
2. `docs/KEPUTUSAN.md` dan `docs/SERAH-TERIMA-FE.md`
3. `backend/supabase/types/database.ts` (salin dulu ke `frontend/src/types/database.ts` jika belum terbaru)

## Tujuan Sesi Ini
Membangun **Floating AI Chatbot Widget ("Kiko")** yang elegan untuk seluruh pengunjung (Tamu & Pengguna Login), ditambah halaman **Live Takeover Chat Admin (`/admin/chat`)** dan pengaturan chatbot di `/admin/pengaturan`.

Seluruh backend AI Chatbot (Hybrid RAG pgvector, Reciprocal Rank Fusion, 4-Layer Guardrail, Auto-Failover Agnes AI -> Gemini 3.8 Flash, Context Injection katalog live & data pengguna via RLS, serta tabel Realtime Live Takeover) **SUDAH TER-DEPLOY** di Supabase Cloud pada Edge Function `chat` dan Migration 10. Tugasmu adalah membangun antarmuka dan integrasi client-nya di `frontend/`.

---

## 1. Konteks & Kontrak Backend yang Sudah Siap

- **Nama Website:** Kodie (Bimbel teknologi daring SD, SMP, SMA & Simulasi Jurusan IT)
- **Nama Asisten Resmi:** Kiko (dapat diubah Admin lewat tabel `pengaturan`, dibaca publik dari view `chatbot_konfigurasi_publik`)
- **Endpoint Streaming SSE:**
  `POST ${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`
  - Headers:
    - `Content-Type: application/json`
    - `apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    - `Authorization: Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  - Request Body JSON:
    ```json
    {
      "message": "Berapa harga paket Coding Dasar SD?",
      "percakapan_id": "uuid-opsional-untuk-user-login",
      "history": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ],
      "activePageContext": {
        "url": "/program/coding-dasar",
        "title": "Program Coding Dasar SD",
        "snippet": "Cuplikan teks halaman aktif maks 3000 karakter"
      }
    }
    ```
  - Transport SSE: baca menggunakan `fetch()` + `response.body.getReader()` + `TextDecoder` (**JANGAN memakai `EventSource`**). Hubungkan `AbortController` agar tombol **Stop** langsung membatalkan stream.
  - Event SSE yang dikirim server:
    - `event: delta` -> `data: { "content": "potongan teks..." }`
    - `event: citations` -> `data: { "citations": [{ "index": 1, "title": "...", "url": "/program", "headingPath": "..." }] }`
    - `event: guardrail_refusal` -> `data: { "reason": "PROMPT_INJECTION_DETECTED", "message": "..." }`
    - `event: done` -> `data: { "percakapan_id": "...", "mode"?: "menunggu_admin" | "ditangani_admin", "low_confidence"?: true, "handoff": { "waUrl": "https://wa.me/...", "email": "...", "canLiveTakeover": true, "percakapanId": "...", "percakapanStatus": "bot" } }`
    - `event: error` -> `data: { "code": "...", "message": "...", "handoff": { ... } }`

- **View Konfigurasi Publik:**
  `supabase.from('chatbot_konfigurasi_publik').select('kunci, nilai')`
  Mengembalikan `chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`.

- **3 Jalur Handoff ke Manusia (Semua Didukung Backend):**
  1. **Tombol WhatsApp & Email:** Membuka `handoff.waUrl` (`wa.me`) atau `mailto:${handoff.email}`. Tersedia untuk Tamu maupun Pengguna Login.
  2. **Buat Tiket Laporan Masalah + Eskalasi (Khusus Pengguna Login):**
     Memanggil RPC `supabase.rpc('minta_bantuan_admin_chat', { p_percakapan_id, p_buat_tiket: true, p_ringkasan_masalah })`.
  3. **Live Takeover Realtime oleh Admin (Khusus Pengguna Login):**
     - Saat pengguna menekan **"Bicara dengan Admin (Live Chat)"**, panggil RPC `supabase.rpc('minta_bantuan_admin_chat', { p_percakapan_id, p_buat_tiket: false })`. Status percakapan berubah menjadi `'menunggu_admin'`.
     - Widget berlangganan Supabase Realtime (`postgres_changes`) pada tabel `percakapan_chat` (`id=eq.${percakapanId}`) dan `pesan_chat` (`percakapan_id=eq.${percakapanId}`).
     - Saat status percakapan `'menunggu_admin'` atau `'ditangani_admin'`, pengiriman pesan di widget memanggil RPC `supabase.rpc('kirim_pesan_live_chat', { p_percakapan_id, p_isi })` (bukan memanggil LLM), dan balasan Admin muncul secara realtime di bubble chat!
     - Pengguna atau Admin dapat mengakhiri sesi live dan mengembalikan ke Kiko dengan memanggil `supabase.rpc('admin_selesaikan_chat', { p_percakapan_id, p_kembali_ke_bot: true })`.

---

## 2. Desain UI & UX Chat Widget (`src/components/chatbot/`)

1. **Konfigurasi Tampilan Terpisah (`src/components/chatbot/chatbot.config.ts`):**
   - Pisahkan konfigurasi **Avatar/Logo Bot** (tampil di header & bubble pesan Kiko) dari **Tombol Launcher Bubble** (tombol mengambang di pojok kanan bawah layar).
   - Sediakan opsi `launcherShape` (`"circle" | "squircle" | "rounded" | "pill"`), `launcherIcon` (SVG ikon chat/sparkle modern), `launcherLabel` (`"Tanya Kiko"` untuk mode `pill`), posisi (`bottom-right`), tema (`light` / `dark` / `auto`), serta daftar *suggested starter questions*:
     - `"Program apa yang cocok untuk anak SD kelas 5?"`
     - `"Apa itu Simulasi Jurusan IT dan rapor rekomendasinya?"`
     - `"Bagaimana cara daftar dan persetujuan orang tua?"`
     - `"Bagaimana cara bayar dan masuk kelas Google Meet?"`
2. **Animasi Buka & Tutup Dua Arah:**
   - Tombol launcher tetap di pojok layar; ikonnya ber-morph halus (rotasi + scale spring) menjadi ikon tutup (`X`) saat panel terbuka, dan kembali saat ditutup.
   - Panel chat muncul di atas tombol launcher dengan `transform-origin: bottom right`, animasi masuk (`panel-in`) dan keluar (`panel-out` ~220ms sebelum unmount), serta menghormati `prefers-reduced-motion`.
   - Responsif: lebar nyaman di desktop (`~400px`, tinggi maks `600px`) dan nyaman di layar ponsel `360px` tanpa scroll horizontal.
3. **Tombol Stop yang Elegan:**
   - Saat Kiko sedang streaming, ubah tombol Kirim menjadi tombol **Stop** bergaya modern/high-contrast (pill gelap elegan dengan border halus, ikon kotak rounded di tengah, dan efek ring pulsing lembut — BUKAN tombol merah mencolok).
4. **Renderer Markdown Aman & Sitasi Interaktif:**
   - Render Markdown tanpa `dangerouslySetInnerHTML` mentah (dukung heading, bold, italic, list, tabel, inline code, code block + tombol copy).
   - Ubah sitasi `[1]`, `[2]` menjadi badge kecil yang dapat diklik menuju URL sumber dari event `citations` (wajib sanitasi URL anti-`javascript:` dan `data:`).
5. **Fitur Pelengkap Widget:**
   - Indikator *typing dots* sebelum token pertama tiba, tombol *Copy* jawaban, *Retry* jika error, *Reset percakapan*, *Proactive tooltip* ringan (`"Bingung pilih kelas IT? Tanya Kiko!"`), penyimpanan riwayat sementara di `localStorage`, serta banner status ketika percakapan sedang dalam mode **Menunggu Admin** atau **Ditangani Admin (Live)**.

---

## 3. Halaman Admin Live Chat (`/admin/chat`) & Pengaturan (`/admin/pengaturan`)

1. Tambahkan menu **Live Chat (` /admin/chat`)** di area Admin:
   - Menampilkan daftar `percakapan_chat` (diurutkan berdasarkan `status = 'menunggu_admin'` paling atas, lalu `ditangani_admin`, lalu `bot`/`selesai`).
   - Saat Admin membuka satu percakapan, tampilkan seluruh riwayat `pesan_chat` secara realtime (`postgres_changes`).
   - Sediakan tombol **"Ambil Alih Percakapan"** (`admin_ambil_alih_chat`), form kirim balasan realtime (`kirim_pesan_live_chat`), dan tombol **"Kembalikan ke Kiko / Selesaikan"** (`admin_selesaikan_chat`).
2. Di halaman `/admin/pengaturan`, tambahkan bagian pengaturan **Chatbot Kiko** yang membaca & meng-update kunci di tabel `pengaturan`: `chatbot_aktif`, `chatbot_nama`, `chatbot_sapaan`, `chatbot_kontak_wa`, `chatbot_kontak_email`.

---

## 4. Urutan Pengerjaan
1. Tunjukkan rencana singkat struktur file di `frontend/src/` terlebih dahulu.
2. Buat lapisan API chatbot di `frontend/src/lib/api/chatbot.ts` (mendukung mode mock dan mode Supabase Cloud).
3. Bangun komponen `frontend/src/components/chatbot/` dan pasang di layout agar tampil di halaman publik serta dashboard pengguna.
4. Bangun halaman `/admin/chat` dan pengaturan chatbot di `/admin/pengaturan`.
5. Pastikan `npm run lint`, `npm run typecheck`, dan `npm run build` lolos 100% tanpa error.
```
