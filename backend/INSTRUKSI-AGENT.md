# Instruksi backend (untuk agent Antigravity)

Baca juga `../README.md` dan `../docs/PRD.md`. File ini berisi aturan teknis backend.

## Batas kerja

- Kerjakan hanya folder `backend/`. **Jangan mengubah `frontend/`.**
- `docs/PRD.md` adalah acuan utama: hak akses (bagian 3), status booking (bagian 5), model data (bagian 7), kontrak backend (bagian 8), realtime, cron, Meet, dan storage (bagian 9), serta keamanan (bagian 10).
- Nama tabel, kolom, view, RPC, parameter, status, dan kode error harus **persis** seperti PRD. Jika perlu mengubah, tanyakan ke tim dulu, lalu catat di `docs/KEPUTUSAN.md`.
- Jika PRD tidak menjelaskan sesuatu, tanyakan. Jangan mengarang aturan bisnis.

## Stack

- Supabase: Postgres, Auth, Storage, Realtime, Edge Functions (Deno), Cron (`pg_cron` + `pg_net`).
- Supabase CLI untuk pengembangan lokal. Jalankan `supabase init` di dalam folder `backend/`, sehingga semua berkas Supabase ada di `backend/supabase/`. `supabase start` butuh Docker.
- Semua perubahan skema lewat migration di `backend/supabase/migrations/`. Jangan mengubah skema langsung di dashboard tanpa migration.

## Urutan migration yang disarankan

| Urutan | Isi |
| --- | --- |
| 1 | Enum, semua tabel bagian 7, constraint, index, foreign key |
| 2 | Fungsi helper `peran_saya()`, aktifkan RLS di semua tabel, policy per tabel |
| 3 | Trigger registrasi dari `auth.users` (membaca `raw_user_meta_data`) ke `pengguna`, `siswa`, atau `profil_pengajar`. Tolak peran `admin` |
| 4 | View: `kelas_katalog`, `pengajar_publik`, `soal_minat_publik`, `sesi_saya`, `laporan_saya`, `rapor_saya`, `admin_ringkasan` |
| 5 | RPC per fitur (bagian 8), trigger notifikasi, trigger prioritas laporan masalah, trigger log admin |
| 6 | Bucket storage dan policy-nya (bagian 9) |
| 7 | Publication Realtime untuk `notifikasi` dan semua job cron |

## Aturan SQL

- **RLS aktif di semua tabel.** Tidak boleh ada tabel tanpa policy.
- `peran_saya()` mengembalikan peran dari `public.pengguna` untuk `auth.uid()`. Pakai `security definer`, `stable`, dan `set search_path = ''`.
- Semua fungsi `security definer` wajib memakai `set search_path = ''` dan menulis nama objek lengkap, misalnya `public.booking` atau `extensions.gen_random_bytes(...)`.
- Setiap RPC mengecek peran dan kepemilikan di baris pertama, lalu melempar error dengan pesan berupa kode PRD, misalnya `raise exception 'KELAS_PENUH';`. Frontend membaca kode ini dari `error.message`, jadi jangan menambahkan teks lain ke pesan.
- Parameter RPC memakai awalan `p_`.
- Atur hak eksekusi: cabut `execute` dari `public` lalu berikan hanya ke `anon` atau `authenticated` sesuai kolom Peran di PRD bagian 8. Contohnya, `info_persetujuan` boleh untuk `anon`, sedangkan `buat_booking` hanya untuk `authenticated`.
- Semua RPC admin menulis ke `log_admin`.
- Waktu disimpan sebagai `timestamptz` (UTC). Input jadwal dari pengajar dalam WIB, jadi konversi dengan zona `Asia/Jakarta`.
- Uang disimpan sebagai `integer` rupiah.

## Aturan khusus per fitur

- **`buat_booking`:** kunci baris kelas dengan `select ... for update` sebelum menghitung kursi, supaya dua booking bersamaan tidak membuat kelas melebihi kapasitas. Kursi terpakai adalah booking berstatus `menunggu_pembayaran`, `menunggu_verifikasi`, dan `terkonfirmasi`. Cek juga kedaluwarsa saat dipanggil.
- **Kapasitas:** maksimal 10 untuk program SD dan 15 untuk SMP dan SMA. Tolak dengan `KAPASITAS_TIDAK_VALID`.
- **Token persetujuan:** buat dari byte acak, kembalikan token asli satu kali saja, dan simpan hash-nya. Berlaku 7 hari dan sekali pakai.
- **Laporan dan rapor:** view `laporan_saya` hanya boleh mengembalikan catatan untuk siswa milik peminta, tidak pernah catatan siswa lain di kelas yang sama.
- **Link Meet:** `meet_uri` tidak boleh bisa dibaca lewat select biasa. Satu-satunya jalan adalah RPC `link_masuk_sesi`, dalam jendela 15 menit sebelum sampai akhir sesi.
- **Dokumen pengajar:** bucket `dokumen-pengajar` hanya bisa dibaca admin.

## Edge Function `buat-meet`

Ikuti langkah di PRD bagian 9 ("Integrasi Google Meet").

- Secret disimpan dengan `supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=...`.
- Access token diminta dari refresh token setiap kali fungsi berjalan. Ruang Meet dibuat dengan `POST https://meet.googleapis.com/v2/spaces`.
- Jika dipanggil frontend dengan `{ kelas_id }`, verifikasi bahwa pemanggil adalah pengajar pemilik kelas itu. Jika dipanggil cron, verifikasi bahwa pemanggil memakai secret server.
- Jangan pernah mengembalikan `meet_uri` di respons fungsi. Cukup kembalikan jumlah sesi yang berhasil dan yang gagal.
- **Keputusan terbuka:** jenis akun Google platform menentukan batas durasi rapat dan fitur rekaman (PRD bagian 12). Konfirmasi ke tim sebelum mengatur durasi default program.

## Seed demo

- File `backend/supabase/seed.sql` berisi data contoh sesuai PRD bagian 11: program, kelas, sesi, playbook sesi 1–2 setiap program, 12 soal tes minat, dan pengaturan rekening.
- Akun demo (admin, pengajar, orang tua, siswa) dibuat lewat skrip yang memakai Supabase Admin API (`auth.admin.createUser`), misalnya `backend/scripts/seed-akun.ts`. Cara lain, buat manual di dashboard lalu tulis langkahnya di README.
- Semua nama dan data adalah karangan. Jangan memakai data anak sungguhan.

## Serah terima ke frontend

- Setelah skema stabil, buat tipe TypeScript dengan `supabase gen types typescript --local > supabase/types/database.ts` (dijalankan dari `backend/`). Frontend akan menyalinnya.
- Kirim ke frontend: `SUPABASE_URL`, anon key, dan daftar akun demo. **Service role key tidak pernah dikirim ke frontend.**

## Definisi selesai per fitur

- [ ] Semua kriteria penerimaan fitur di PRD terpenuhi dari sisi backend
- [ ] Diuji sebagai setiap peran yang relevan, termasuk percobaan akses yang seharusnya ditolak
- [ ] `supabase db reset` berjalan bersih dari nol (migration + seed)
- [ ] Perubahan kontrak, jika ada, sudah dicatat di `docs/KEPUTUSAN.md`
