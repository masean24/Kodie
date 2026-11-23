# Bimbel Teknologi Daring SD, SMP, SMA — SEVENT X

Website bimbel teknologi daring yang terjangkau untuk siswa SD, SMP, dan SMA, termasuk program Simulasi Jurusan IT. Pengajarnya mahasiswa dan pencari kerja paruh waktu yang mengajar memakai Teaching Playbook terstandar.

Karya ini untuk lomba Software Development SEVENT X, kategori website. Subtemanya SDG 4 (Quality Education) dan SDG 8 (Decent Work and Economic Growth).

> Nama website belum ditentukan. Ganti judul ini setelah nama dipilih (lihat `docs/PRD.md` bagian 12).

## Tim

| Nama | Peran |
| --- | --- |
| Mgs. M. Fahim Rahmatullah | Frontend (Claude Code) |
| Khalil Amin Adillah | Belum ditentukan: backend (Antigravity) atau proposal, konten, dan video |
| Raihan Daris Ramadhan | Belum ditentukan: backend (Antigravity) atau proposal, konten, dan video |

## Struktur folder

```
.
├── README.md                  ← file ini
├── CLAUDE.md                  ← aturan umum untuk Claude Code (dibaca otomatis)
├── .gitignore
├── docs/
│   ├── PRD.md                 ← sumber kebenaran tunggal: fitur, data, kontrak backend
│   ├── KEPUTUSAN.md           ← log keputusan dan perubahan kontrak
│   ├── PROMPT-CLAUDE-CODE.md  ← prompt pertama dan lanjutan untuk frontend
│   ├── PROMPT-ANTIGRAVITY.md  ← prompt pertama dan lanjutan untuk backend
│   └── konten/
│       ├── soal-tes-minat.md  ← template 12 soal tes minat (diisi tim)
│       └── playbook/
│           └── _TEMPLATE.md   ← template Teaching Playbook per sesi
├── frontend/                  ← Next.js (dikerjakan dengan Claude Code)
│   ├── CLAUDE.md              ← aturan khusus frontend
│   └── .env.example
└── backend/                   ← Supabase (dikerjakan dengan Antigravity)
    ├── INSTRUKSI-AGENT.md     ← aturan khusus backend
    └── .env.example
```

Folder `frontend/` dan `backend/` sengaja masih kosong. Isinya dibuat oleh prompt pertama masing-masing.

## Cara mulai

1. Buat repository GitHub **publik** (wajib menurut rulebook), lalu push isi folder ini.
2. **Frontend:** buka Claude Code di root repository, lalu kirim Prompt 1 dari `docs/PROMPT-CLAUDE-CODE.md`.
3. **Backend:** buka repository di Antigravity, lalu kirim Prompt 1 dari `docs/PROMPT-ANTIGRAVITY.md`.
4. Selesaikan keputusan terbuka di `docs/PRD.md` bagian 12, terutama jenis akun Google untuk Meet dan pembagian peran tim.

## Aturan kerja bersama

- `docs/PRD.md` adalah acuan utama. Kalau ada yang bertentangan, PRD yang benar.
- Perubahan nama tabel, view, RPC, atau parameter (PRD bagian 7–9) harus disepakati frontend dan backend, lalu dicatat di `docs/KEPUTUSAN.md`.
- Branch: `fe/F6-pembayaran`, `be/F6-pembayaran`, dan seterusnya. Branch `main` harus selalu bisa di-deploy.
- Pesan commit: `feat(F6): unggah bukti bayar`, `fix(F10): laporan tidak muncul realtime`.
- Jangan pernah commit file `.env`. Pakai `.env.example`.

## Bagian yang dilengkapi menjelang submission

- [ ] Link website yang sudah di-deploy
- [ ] Akun demo untuk setiap peran (orang tua, siswa, pengajar, admin)
- [ ] Cara menjalankan frontend dan backend secara lokal
- [ ] Teknologi yang dipakai
- [ ] Link video demo
