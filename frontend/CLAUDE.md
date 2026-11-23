# Aturan frontend

Baca juga `../CLAUDE.md` dan `../docs/PRD.md`.

## Stack

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript, versi stabil terbaru dari `create-next-app` |
| Styling | Tailwind CSS |
| Backend client | `@supabase/supabase-js` + `@supabase/ssr` (sesi di cookie) |
| Form dan validasi | `react-hook-form` + `zod` |
| Ikon | `lucide-react` |
| Deploy | Vercel |

Stack frontend masih berstatus **asumsi** (PRD bagian 12). Jika tim mengubahnya, `docs/KEPUTUSAN.md` akan diperbarui.

Untuk API yang bisa berbeda antarversi, misalnya file route guard (`middleware.ts` atau penggantinya di versi Next.js yang terpasang) dan pola `@supabase/ssr`, **ikuti dokumentasi resmi versi yang terpasang**, jangan dari ingatan.

## Struktur folder target

```
frontend/
├── src/
│   ├── app/
│   │   ├── (publik)/            ← /, /program, /kelas, /pengajar/[id], /tes-minat, /kebijakan-privasi
│   │   ├── (auth)/              ← /masuk, /daftar, /persetujuan/[token]
│   │   ├── orang-tua/           ← area orang tua
│   │   ├── siswa/               ← area siswa
│   │   ├── mengajar/            ← area pengajar
│   │   ├── admin/               ← area admin
│   │   ├── not-found.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  ← komponen dasar: Button, Card, Input, Badge, Skeleton, EmptyState, ErrorState
│   │   └── <fitur>/             ← komponen per fitur, misalnya booking/, tes-minat/
│   ├── lib/
│   │   ├── supabase/            ← client browser dan server
│   │   ├── api/                 ← SATU-SATUNYA tempat memanggil data (real atau mock)
│   │   ├── mock/                ← data mock dengan bentuk yang sama persis dengan Supabase
│   │   ├── errors.ts            ← peta kode error PRD bagian 8 ke pesan bahasa Indonesia
│   │   ├── format.ts            ← format tanggal WIB dan rupiah
│   │   └── peran.ts             ← aturan akses rute per peran (PRD bagian 3 dan 6)
│   └── types/
│       └── database.ts          ← tipe tabel dan view (nanti dari `supabase gen types`)
├── .env.example
└── CLAUDE.md
```

## Aturan data

- Komponen dan halaman **tidak boleh** memanggil `supabase` langsung. Semua lewat fungsi di `src/lib/api/`.
- Setiap fungsi di `src/lib/api/` punya dua implementasi: mock dan Supabase. Pilihannya ditentukan `NEXT_PUBLIC_USE_MOCK`. Bentuk data mock **harus sama persis** dengan tabel, view, atau hasil RPC di PRD bagian 7–8, supaya pergantian ke backend asli tidak mengubah komponen.
- Error RPC berupa kode di `error.message` (misalnya `KELAS_PENUH`). Petakan lewat `src/lib/errors.ts`. Jangan pernah menampilkan pesan error mentah ke pengguna.
- Waktu dari backend dalam UTC, ditampilkan dalam WIB. Format tanggal: `Senin, 24 November 2026, 19.00 WIB`. Format uang: `Rp275.000`.
- Hanya anon key yang boleh ada di frontend. Service role key tidak boleh pernah dipakai di frontend.

## Aturan tampilan

- Desain UI/UX final menyusul. Sampai saat itu, pakai tampilan netral dan rapi. Simpan semua token (warna, radius, spasi, font) di satu tempat (CSS variables) supaya desain final mudah diterapkan.
- Mobile-first. Breakpoint 360, 768, 1024, 1440 px. Tidak boleh ada scroll horizontal di lebar 360 px.
- Setiap halaman yang memuat data wajib punya state loading (skeleton), kosong, dan error dengan tombol coba lagi.
- Aksesibilitas (PRD bagian 10): kontras minimal 4,5:1, fokus selalu terlihat, semua bisa dipakai dengan keyboard, label pada setiap input, `aria-live="polite"` untuk notifikasi, area sentuh minimal 44 × 44 px, dan menghormati `prefers-reduced-motion`. Sediakan skip link ke konten utama.
- Playbook dan rapor harus rapi saat dicetak (print CSS).

## Perintah

Jalankan dari folder `frontend/`:

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run lint` | Lint |
| `npx tsc --noEmit` | Cek tipe (tambahkan sebagai script `typecheck`) |
| `npm run build` | Build produksi. Wajib lolos sebelum push ke `main` |

## Definisi selesai per fitur

- [ ] Semua kriteria penerimaan fitur di PRD terpenuhi
- [ ] `lint`, `typecheck`, dan `build` lolos
- [ ] Dicek di lebar 360 px dan 1440 px
- [ ] Bisa dipakai dengan keyboard saja
- [ ] State loading, kosong, dan error ada
