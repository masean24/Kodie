# Frontend Kodie

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Aturan kerja ada di `CLAUDE.md`.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_USE_MOCK=true memakai data mock
npm run dev                  # http://localhost:3000
```

Untuk memakai Supabase sungguhan, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`, lalu set `NEXT_PUBLIC_USE_MOCK=false`. Jangan pernah meng-commit `.env.local`.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Struktur penting

- `src/app/(publik)/`: halaman publik (beranda, program, kelas, pengajar, tes minat, kebijakan privasi, 403)
- `src/lib/api/`: satu-satunya tempat mengambil data, dengan implementasi mock dan Supabase
- `src/lib/mock/data.ts`: data mock (semua nama karangan)
- `src/lib/tes-minat.ts`: logika tes minat (fungsi murni, diuji di `tes-minat.test.ts`)
- `src/app/globals.css`: token desain Kodie v4 (Light/Dark)
