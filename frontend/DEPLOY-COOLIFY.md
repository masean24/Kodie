# Deploy frontend Kodie ke Coolify (auto-redeploy setiap push)

Panduan ini untuk Coolify v4 (self-hosted). Frontend dibangun dari `frontend/Dockerfile` (Next.js `output: "standalone"`), lalu Coolify otomatis membangun ulang setiap kali ada push ke branch `main`.

File yang dipakai:

| File | Fungsi |
| --- | --- |
| `frontend/Dockerfile` | Build multi-stage: `npm ci` → `next build` → image runtime kecil berisi `server.js` |
| `frontend/.dockerignore` | Mencegah `node_modules`, `.next`, dan semua `.env*` (kecuali `.env.example`) ikut ke image |
| `frontend/next.config.ts` | `output: "standalone"` |
| `frontend/src/app/api/sehat/route.ts` | Endpoint healthcheck `GET /api/sehat` → `{"status":"ok"}` |

## 1. Prasyarat

- Server dengan Coolify v4 sudah terpasang. Sarankan RAM minimal 2 GB, karena `next build` cukup berat.
- Domain atau subdomain, misalnya `kodie.domainmu.id`, dengan record DNS `A` yang mengarah ke IP server Coolify.
- Akses admin ke repository GitHub `masean24/Kodie`.
- Nilai Supabase dari anggota backend: **Project URL** dan **anon key**. Jangan pernah memakai `service_role` key di frontend.

## 2. Hubungkan GitHub ke Coolify (sekali saja)

Cara yang disarankan adalah **GitHub App**, karena webhook push dipasang otomatis oleh Coolify.

1. Di Coolify, buka **Sources** → **+ Add** → **GitHub App**.
2. Ikuti wizard: beri nama, pilih organisasi atau akun pemilik repo, lalu **Register** dan **Install** app di GitHub.
3. Saat instalasi di GitHub, pilih **Only select repositories** → `Kodie`.

Kalau tidak bisa memasang GitHub App (misalnya tidak punya akses admin organisasi), pakai cara webhook manual di langkah 6B.

## 3. Buat aplikasi

1. **Projects** → pilih atau buat project (misalnya `Kodie`) → environment `production` → **+ New** → **Application**.
2. Pilih sumber:
   - **Private Repository (with GitHub App)** → pilih GitHub App dari langkah 2 → repository `Kodie`, atau
   - **Public Repository** → tempel `https://github.com/masean24/Kodie`.
3. Isi pengaturan build:

| Pengaturan | Nilai |
| --- | --- |
| Branch | `main` |
| Build Pack | `Dockerfile` |
| Base Directory | `/frontend` |
| Dockerfile Location | `/Dockerfile` (relatif terhadap Base Directory) |
| Ports Exposes | `3000` |

4. Klik **Continue**, lalu isi **Domains** di halaman **General**, misalnya `https://kodie.domainmu.id`. Coolify memasang sertifikat HTTPS (Let's Encrypt) otomatis.

## 4. Environment variables

Buka **Environment Variables** → **Add** untuk setiap variabel di bawah. Semua variabel `NEXT_PUBLIC_*` ditanam ke kode saat build. Karena itu, set **Build time** = **Available during build** (biarkan runtime tetap tersedia juga).

| Nama | Nilai | Build time |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Available during build |
| `NEXT_PUBLIC_FITUR_LANJUTAN` | `true` | Available during build |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | Available during build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key Supabase | Available during build |
| `NEXT_PUBLIC_SITE_URL` | `https://kodie.domainmu.id` (sama persis dengan domain langkah 3, tanpa `/` di akhir) | Available during build |

`Dockerfile` sudah mendeklarasikan kelima `ARG` ini, jadi aman juga jika **Advanced → Build → Build arguments** diset "Managed manually in Dockerfile".

> Mengubah variabel build-time butuh **Redeploy**, bukan sekadar **Restart**.

## 5. Healthcheck

`Dockerfile` sudah punya `HEALTHCHECK` ke `/api/sehat`. Kalau ingin memakai healthcheck dari dashboard Coolify, buka **Healthcheck** dan isi:

| Field | Nilai |
| --- | --- |
| Check type | HTTP |
| Method | GET |
| Scheme | http |
| Host | localhost |
| Port | `3000` |
| Path | `/api/sehat` |

Lalu **Save changes** → **Enable**. Healthcheck dashboard menggantikan `HEALTHCHECK` di Dockerfile. Image memakai `wget` bawaan Alpine, jadi pengecekan HTTP Coolify bisa berjalan.

## 6. Auto-redeploy setiap push

### 6A. Sumber GitHub App (disarankan)

1. Buka aplikasi → **Advanced** → **Deployment**.
2. Set **Auto deploy** = **Deploy on push (webhooks)**.
3. Selesai. Setiap push ke `main` memicu build dan deploy baru.

### 6B. Sumber Public Repository (webhook manual)

1. Buka aplikasi → **Webhooks** → bagian **Manual Git webhooks** → **GitHub**.
2. Salin URL webhook GitHub yang ditampilkan.
3. Isi **Webhook secret** dengan teks acak minimal 16 karakter, lalu **Save changes**. Simpan secret ini, jangan di-commit ke repo.
4. Di GitHub: repo `Kodie` → **Settings** → **Webhooks** → **Add webhook**:
   - **Payload URL**: URL dari langkah 2
   - **Content type**: `application/json`
   - **Secret**: secret dari langkah 3
   - **Enable SSL verification**: tetap aktif
   - Event: **Just the push event**
5. Kembali ke Coolify → **Advanced** → **Deployment** → **Auto deploy** = **Deploy on push (webhooks)**.

### Opsional: hanya redeploy jika folder frontend berubah

Repo ini monorepo, jadi push yang hanya mengubah `backend/` tidak perlu membangun ulang frontend. Buka **General** → **Build** → **Watch Paths**, lalu isi satu pola per baris:

```
frontend/**
```

Setelah mengisi, uji dengan satu push yang hanya mengubah `backend/` dan pastikan tidak ada deployment baru.

## 7. Deploy pertama dan uji

1. Klik **Deploy** untuk deployment pertama. Pantau **Deployment Logs**; build sekitar 2–5 menit.
2. Setelah status **Running**:
   - Buka `https://kodie.domainmu.id/api/sehat` → harus membalas `{"status":"ok"}`.
   - Buka beranda, lalu coba login dengan akun demo.
3. Uji auto-redeploy: push commit kecil ke `main`. Deployment baru harus muncul di **Deployments** dalam beberapa detik.

## 8. Setelah domain aktif (koordinasi dengan tim backend)

- Di Supabase Dashboard → **Authentication** → **URL Configuration**: set **Site URL** ke domain produksi, dan tambahkan domain itu di **Redirect URLs**.
- Link persetujuan orang tua memakai `NEXT_PUBLIC_SITE_URL`. Jika domain berubah, ubah variabel ini lalu **Redeploy**.

## 9. Masalah umum

| Gejala | Penyebab dan solusi |
| --- | --- |
| Halaman memakai data mock di produksi | `NEXT_PUBLIC_USE_MOCK` tidak `false` saat build. Cek Build time = Available during build, lalu Redeploy |
| Error Supabase "Invalid API key" atau URL kosong | Variabel Supabase belum tersedia saat build. Cek Build time, lalu Redeploy |
| 502 Bad Gateway | Ports Exposes bukan `3000`, atau container belum sehat. Lihat log container |
| Build gagal karena kehabisan memori | Tambah RAM atau swap server (minimal 2 GB) |
| Push tidak memicu deploy | Cek **Auto deploy** = Deploy on push. Untuk webhook manual, cek **Recent Deliveries** di GitHub → Settings → Webhooks |
| Push ke `backend/` ikut memicu deploy | Isi **Watch Paths** dengan `frontend/**` |

## Menjalankan build produksi secara lokal

Dengan `output: "standalone"`, jalankan hasil build lewat `server.js`, bukan `next start`:

```bash
cd frontend
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
node .next/standalone/server.js
```

Atau uji image Docker yang sama dengan Coolify:

```bash
cd frontend
docker build --build-arg NEXT_PUBLIC_USE_MOCK=true -t kodie-frontend .
docker run --rm -p 3000:3000 kodie-frontend
```
