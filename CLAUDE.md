# Aturan proyek untuk Claude Code

## Konteks

Monorepo untuk lomba SEVENT X (kategori website). Produknya bimbel teknologi daring untuk SD, SMP, dan SMA. Pengajarnya mahasiswa dan pencari kerja paruh waktu.

- `frontend/`: Next.js. **Ini satu-satunya area yang boleh kamu ubah.**
- `backend/`: Supabase. Dikerjakan anggota tim lain dengan Antigravity. **Jangan mengubah apa pun di folder ini**, kecuali saya minta secara eksplisit.
- `docs/`: dokumen bersama. Kamu boleh menambah catatan di `docs/KEPUTUSAN.md`, tetapi jangan mengubah `docs/PRD.md` tanpa saya minta.

## Sumber kebenaran

1. `docs/PRD.md`: fitur (F1–F14) dan kriteria penerimaan, rute halaman (bagian 6), model data (bagian 7), kontrak backend Supabase (bagian 8), realtime dan file (bagian 9), dan kebutuhan non-fungsional (bagian 10).
2. `docs/KEPUTUSAN.md`: keputusan dan perubahan kontrak terbaru. Kalau isinya bertentangan dengan PRD, `KEPUTUSAN.md` yang terbaru yang berlaku.
3. `frontend/CLAUDE.md`: aturan teknis frontend.

Kalau ada hal yang tidak dijelaskan dokumen di atas, **tanyakan dulu ke saya**. Jangan mengarang aturan bisnis, nama tabel, nama RPC, atau parameter.

## Aturan umum

- Seluruh teks antarmuka memakai bahasa Indonesia yang baik dan benar. Nama variabel dan fungsi boleh bahasa Indonesia atau Inggris, tetapi konsisten dalam satu file.
- Nama tabel, view, RPC, parameter (`p_...`), status, dan kode error harus **persis** seperti di PRD bagian 7–8.
- Jangan pernah menulis secret ke repository. Repository ini publik.
- Kerjakan per fitur sesuai kode F di PRD. Satu fitur selesai jika semua kriteria penerimaannya terpenuhi, dan `lint`, `typecheck`, serta `build` lolos.
- Sebelum perubahan besar, tunjukkan rencana singkat dan tunggu persetujuan saya.
- Di akhir setiap sesi, berikan ringkasan: apa yang selesai, file yang berubah, keputusan yang kamu ambil, dan hal yang perlu saya cek.
- Batas pengumpulan lomba adalah 30 November 2026, dengan target internal 28 November 2026. Utamakan alur demo berjalan dulu, lalu poles tampilan.
