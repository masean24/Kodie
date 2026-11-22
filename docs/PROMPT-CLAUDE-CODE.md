# Prompt untuk Claude Code (frontend)

Cara pakai: buka Claude Code di **root repository** (bukan di dalam `frontend/`), lalu salin isi blok prompt apa adanya. Kirim satu prompt per sesi. Mulai prompt berikutnya setelah sesi sebelumnya selesai dan sudah kamu cek.

---

## Prompt 1: Fondasi frontend dan halaman publik (mode mock)

```text
Kamu mengerjakan frontend untuk karya lomba SEVENT X di monorepo ini. Area kerjamu hanya folder frontend/. Jangan mengubah backend/ dan jangan mengubah docs/PRD.md.

Sebelum menulis kode apa pun, baca file ini secara berurutan:
1. CLAUDE.md
2. frontend/CLAUDE.md
3. docs/PRD.md, fokus pada bagian 1, 2, 3, 4 (terutama F4 dan F5), 6, 7, 8, dan 10
4. docs/KEPUTUSAN.md

Tujuan sesi ini: fondasi frontend dan semua halaman publik, memakai data mock. Belum ada login, belum ada dashboard, dan belum terhubung ke Supabase sungguhan.

Kerjakan dengan urutan ini:

1. Tulis rencana singkat: struktur folder, daftar halaman, daftar fungsi di src/lib/api, dan bentuk data mock. Tunjukkan ke saya dan TUNGGU persetujuan sebelum lanjut.

2. Scaffold Next.js (App Router, TypeScript, Tailwind CSS, ESLint, folder src/) ke dalam frontend/. Folder itu sudah berisi CLAUDE.md dan .env.example, jadi scaffold dulu ke folder sementara, lalu pindahkan isinya ke frontend/ tanpa menimpa dua file tersebut. Tambahkan script "typecheck": "tsc --noEmit". Salin .env.example menjadi .env.local dengan NEXT_PUBLIC_USE_MOCK=true.

3. Pasang @supabase/supabase-js, @supabase/ssr, react-hook-form, zod, dan lucide-react. Siapkan client Supabase untuk browser dan server di src/lib/supabase/ sesuai dokumentasi resmi @supabase/ssr untuk versi Next.js yang terpasang. Client ini belum dipakai halaman mana pun.

4. Buat lapisan data src/lib/api/ dengan dua implementasi (mock dan Supabase) yang dipilih lewat NEXT_PUBLIC_USE_MOCK. Untuk sesi ini cukup implementasi mock, dan implementasi Supabase boleh berupa stub yang melempar "belum diimplementasikan". Fungsi yang dibutuhkan:
   - ambilDaftarProgram() dan ambilProgram(slug), dari tabel program
   - ambilKatalogKelas(filter) dan ambilKelas(id), dari view kelas_katalog, termasuk sisa_kursi dan tanpa link Meet
   - ambilPengajarPublik(id), dari view pengajar_publik
   - ambilSoalMinat(), dari view soal_minat_publik, tanpa bobot
   - hitungTesMinat(jawaban), padanan RPC hitung_tes_minat
   Bentuk data mock harus sama persis dengan PRD bagian 7 dan 8. Buat juga tipe di src/types/database.ts yang ditulis tangan dari PRD bagian 7, dan beri komentar bahwa file ini nanti diganti hasil supabase gen types.

5. Isi data mock: 3 program (Coding Dasar, Kelas Reguler Teknologi, Simulasi Jurusan IT) sesuai PRD bagian 1 dan F5, 6 kelas dengan jadwal dan sisa kursi yang bervariasi (termasuk satu kelas penuh, kapasitas 10 untuk SD dan 15 untuk SMP dan SMA), 3 pengajar terverifikasi, dan 12 soal tes minat. Tandai soal sebagai DRAF karena isi final dari tim ada di docs/konten/soal-tes-minat.md. Semua nama adalah karangan.

6. Logika hitungTesMinat versi mock harus persis mengikuti F4: persentase per bidang (Software, Jaringan, IoT, AI & Data) dengan rumus yang tercatat di docs/KEPUTUSAN.md, tie-break Software > Jaringan > IoT > AI & Data, rekomendasi jurusan kuliah per bidang, dan rekomendasi program per jenjang dan kelas. Taruh logikanya di fungsi murni yang bisa dites, dan tulis beberapa contoh uji sederhana.

7. Buat utilitas di src/lib/: format tanggal WIB ("Senin, 24 November 2026, 19.00 WIB"), format rupiah ("Rp275.000"), dan peta kode error dari PRD bagian 8 ke pesan bahasa Indonesia.

8. Buat layout dan komponen dasar: skip link, header (nama website sementara "Nama Website", navigasi, tombol Masuk dan Daftar yang mengarah ke /masuk dan /daftar walaupun halamannya belum ada), footer (termasuk link Kebijakan Privasi), serta komponen ui: Button, Card, Badge, Input, Select, Skeleton, EmptyState, dan ErrorState. Tampilan sementara netral dan rapi. Semua token desain disimpan di satu tempat sebagai CSS variables, karena desain final akan menyusul.

9. Buat halaman publik sesuai PRD bagian 6:
   - / : beranda dengan masalah, cara kerja, tiga program, pengajar, dan ajakan tes minat
   - /program dan /program/[slug]
   - /kelas : katalog dengan filter program, jenjang, hari, dan jam. Tampilkan sisa kursi, misalnya "3 dari 15 kursi tersisa". Kelas penuh atau yang sesi pertamanya sudah lewat ditampilkan tetapi tidak bisa dipesan
   - /kelas/[id] : detail kelas, tombol Pesan yang sementara mengarah ke /masuk
   - /pengajar/[id] : rata-rata rating hanya tampil jika ada minimal 3 rating
   - /tes-minat : 12 soal, indikator progres (misalnya 5/12), semua soal wajib dijawab
   - /tes-minat/hasil : persentase 4 bidang, bidang teratas, rekomendasi jurusan dan program, kalimat bahwa hasil ini saran dan bukan keputusan, serta ajakan mendaftar. Untuk tamu, hasil tidak disimpan ke server
   - /kebijakan-privasi : draf dari PRD bagian 10, dengan catatan bahwa teks final akan ditinjau tim
   - halaman 404 dan 403

10. Setiap halaman yang memuat data harus punya state loading, kosong, dan error. Pastikan mobile-first tanpa scroll horizontal di lebar 360 px, dan penuhi aturan aksesibilitas di PRD bagian 10.

11. Jalankan npm run lint, npm run typecheck, dan npm run build sampai semuanya bersih.

12. Tutup sesi dengan ringkasan: file yang dibuat, cara menjalankan, keputusan teknis yang kamu ambil, dan hal yang perlu saya cek di browser. Catat keputusan teknis penting di docs/KEPUTUSAN.md.

Yang TIDAK boleh dilakukan di sesi ini: membuat halaman login, daftar, atau dashboard; memanggil Supabase sungguhan; menyimpan secret; dan menambah fitur di luar PRD. Jika ada yang tidak jelas di PRD, tanyakan ke saya dan jangan mengarang.
```

---

## Prompt lanjutan (garis besar)

Gunakan setelah Prompt 1 selesai. Setiap prompt diawali dengan "Baca CLAUDE.md, frontend/CLAUDE.md, docs/KEPUTUSAN.md, dan bagian PRD yang disebut. Tunjukkan rencana dulu, lalu tunggu persetujuan saya."

| Prompt | Isi | Bagian PRD |
| --- | --- | --- |
| 2 | Auth: /masuk, /daftar dengan pilihan peran dan field per peran, logout, route guard per peran, halaman 403, dan redirect setelah login. Mock dulu, lalu siap diganti Supabase Auth | F1, bagian 3, bagian 6 |
| 3 | Persetujuan orang tua (/siswa/persetujuan, /persetujuan/[token]), profil anak (/orang-tua/anak), dan dashboard ringkas orang tua serta siswa | F2, F3, bagian 6 |
| 4 | Booking dan pembayaran: /booking dari detail kelas, halaman instruksi bayar, unggah bukti dengan validasi format dan ukuran, status booking, dan pembatalan | F6, bagian 5, bagian 9 |
| 5 | Area pengajar: profil dan unggah dokumen, buka kelas, playbook (dengan print CSS), form laporan dan rapor, serta penghasilan | F7–F11, F13 |
| 6 | Halaman sesi (Masuk kelas, laporan, rating, lapor masalah), notifikasi realtime dengan fallback polling, dan rapor | F8, F10–F12, bagian 9 |
| 7 | Dashboard admin: antrean pengajar, pembayaran, laporan masalah, honor, kelas, program, pengaturan, dan log | F14 dan aksi admin di bagian 8 |
| 8 | Integrasi Supabase sungguhan: salin tipe dari backend/supabase/types/database.ts, implementasikan semua fungsi di src/lib/api, set NEXT_PUBLIC_USE_MOCK=false, dan uji alur demo PRD bagian 11 | Bagian 8, 9, 11 |
| 9 | Penerapan desain UI/UX final, cek Lighthouse (target minimal 90) dan aksesibilitas, lalu deploy ke Vercel | Bagian 1, 10 |
