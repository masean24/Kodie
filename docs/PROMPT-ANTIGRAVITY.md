# Prompt untuk Antigravity (backend)

Cara pakai: buka repository di Antigravity, lalu salin isi blok prompt apa adanya. Kirim satu prompt per sesi.

---

## Prompt 1: Fondasi Supabase (skema, RLS, trigger registrasi, seed)

```text
Kamu mengerjakan backend Supabase untuk karya lomba SEVENT X di monorepo ini. Area kerjamu hanya folder backend/. Jangan mengubah frontend/ dan jangan mengubah docs/PRD.md.

Sebelum menulis kode apa pun, baca file ini secara berurutan:
1. README.md
2. backend/INSTRUKSI-AGENT.md
3. docs/PRD.md, fokus pada bagian 3, 4, 5, 7, 8, 9, dan 10
4. docs/KEPUTUSAN.md

Tujuan sesi ini: fondasi database yang bisa di-reset dari nol, yaitu migration 1 sampai 4 di backend/INSTRUKSI-AGENT.md dan seed demo. RPC fitur, storage, cron, dan Edge Function buat-meet dikerjakan di sesi berikutnya.

Kerjakan dengan urutan ini:

1. Tulis rencana singkat: daftar enum, tabel, view, policy RLS per tabel, dan isi seed. Tunjukkan ke saya dan TUNGGU persetujuan sebelum lanjut.
2. Jalankan supabase init di dalam folder backend/.
3. Migration 1: semua enum dan tabel dari PRD bagian 7, dengan nama kolom persis sama, beserta constraint (kapasitas maksimal 10 untuk program SD dan 15 untuk SMP dan SMA, bintang 1–5, skor rapor 1–5, nomor sesi 1–4, satu booking aktif per pasangan kelas dan siswa, unik sesi_id di laporan_sesi dan honor), index, dan foreign key.
4. Migration 2: fungsi peran_saya(), RLS aktif di SEMUA tabel, dan policy sesuai matriks hak akses PRD bagian 3.
5. Migration 3: trigger registrasi dari auth.users yang membaca raw_user_meta_data untuk membuat baris pengguna, serta siswa (status menunggu_persetujuan) atau profil_pengajar (status menunggu_verifikasi). Tolak peran admin.
6. Migration 4: view kelas_katalog (dengan sisa_kursi, tanpa meet_uri), pengajar_publik, soal_minat_publik (tanpa bobot), sesi_saya, laporan_saya (hanya catatan siswa milik peminta), rapor_saya, dan admin_ringkasan.
7. seed.sql: 3 program, 6 kelas beserta sesinya, playbook sesi 1–2 setiap program (isi draf), 12 soal tes minat (draf, isi final dari docs/konten/soal-tes-minat.md), dan pengaturan rekening contoh. Semua data karangan.
8. Skrip pembuat akun demo dengan Supabase Admin API untuk 1 admin, 3 pengajar terverifikasi, 1 pengajar menunggu verifikasi, 2 orang tua dengan 3 profil anak (salah satunya SD), 1 siswa mandiri aktif, dan 1 siswa mandiri menunggu persetujuan.
9. Pastikan supabase db reset berjalan bersih. Uji RLS dengan mencoba akses sebagai beberapa peran, termasuk akses yang seharusnya ditolak, lalu laporkan hasilnya.
10. Tutup sesi dengan ringkasan: migration yang dibuat, cara menjalankan, hasil uji RLS, dan keputusan teknis yang kamu ambil. Catat perubahan kontrak, jika ada, di docs/KEPUTUSAN.md.

Jika ada yang tidak jelas di PRD, tanyakan ke saya dan jangan mengarang aturan bisnis.
```

---

## Prompt lanjutan (garis besar)

| Prompt | Isi | Bagian PRD |
| --- | --- | --- |
| 2 | RPC persetujuan orang tua, tes minat, booking (dengan penguncian kursi), batalkan booking, kirim bukti bayar, dan aksi admin pembayaran. Bucket dan policy storage | F2, F4, F6, bagian 8, 9 |
| 3 | RPC buka kelas dan geser sesi, Edge Function buat-meet (OAuth refresh token, Meet REST API, coba ulang), dan link_masuk_sesi | F8, bagian 9 |
| 4 | RPC playbook, laporan, rapor, rating, laporan masalah, honor, dan aksi admin pengajar. Trigger notifikasi dan publication Realtime | F7, F9–F14, bagian 9 |
| 5 | Semua job cron, log admin, uji alur demo PRD bagian 11 dari awal sampai akhir, generate tipe TypeScript, dan deploy ke proyek Supabase produksi | Bagian 9, 11 |
