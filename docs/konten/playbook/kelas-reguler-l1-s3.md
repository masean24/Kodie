# Teaching Playbook: Kelas Reguler Teknologi — Level 1 Sesi 3

## Identitas

| Program | Level | Sesi | Durasi | Jenjang |
| --- | --- | --- | --- | --- |
| Kelas Reguler Teknologi | 1 | 3 dari 4 | 90 menit | SMP & SMA |

## Tujuan sesi

Setelah sesi ini, siswa bisa:

1. Memahami dasar JavaScript (`const`, `let`, fungsi, manipulasi DOM dengan `querySelector`, serta `addEventListener`).
2. Menambahkan interaktivitas nyata pada halaman web sehingga tombol dan form dapat merespons aksi pengguna secara langsung.

## Persiapan pengajar (sebelum kelas)

- [ ] Buka tautan alat atau starter: https://codesandbox.io/s/vanilla atau mode **HTML, CSS, JS** di `/lab` (Kodie Lab).
- [ ] Siapkan starter HTML/CSS berisi input teks, tombol "Tambah", dan daftar kosong `<ul>`.
- [ ] Baca catatan siswa dari sesi 2 untuk mengulang konsep selektor (`#id` dan `.class`) yang juga dipakai DOM.

## Alur kelas

| Menit | Segmen | Yang dilakukan pengajar | Yang dilakukan siswa |
| --- | --- | --- | --- |
| 00–12 | Pembukaan | Membandingkan peran HTML (kerangka), CSS (tampilan), dan JS (otak/interaksi) lewat demo tombol klik | Memberi contoh interaksi di situs favorit mereka |
| 12–48 | Praktik terpandu | Menghubungkan `script.js`, mengambil elemen dengan `document.querySelector()`, membuat fungsi penambah daftar tugas, dan memvalidasi input kosong | Menulis kode JavaScript bersama dan menguji tombol & konsol browser |
| 48–72 | Tantangan | Memberikan tantangan menambahkan tombol "Selesai" (coret teks) dan penghitung total item aktif | Menguji kasus tepi (input spasi saja, klik berkali-kali) |
| 72–84 | Pamer hasil | Meminta 3–4 siswa mendemokan aplikasi catatan/to-do list mereka dan menjelaskan fungsi event listener yang dipakai | Mempresentasikan karya serta membandingkan pesan feedback ke pengguna |
| 84–90 | Penutup | Merangkum alur Event → Logika → Update DOM; memberi pratinjau simulasi IoT virtual & AI di sesi 4 | Menyimpan tautan proyek untuk dokumentasi pembelajaran |

## Tantangan untuk siswa

1. **Tantangan dasar:** Buat tombol **Tambah** yang membaca teks dari `<input>`, menolaknya jika kosong, lalu menambahkannya ke dalam `<ul>` sebagai `<li>` baru dan mengosongkan kembali kolom input.
2. **Tantangan lanjutan (untuk siswa yang cepat):** Tambahkan fitur klik item untuk menandai selesai (`classList.toggle('selesai')`) dan tampilkan teks jumlah item yang tersisa.

## Kunci jawaban dan solusi umum

| Masalah yang sering muncul | Penyebab | Solusi |
| --- | --- | --- |
| `TypeError: Cannot read properties of null` | Script dijalankan sebelum HTML dimuat atau nama selector salah | Letakkan `<script src="script.js" defer>` di `<head>` atau di akhir `<body>`, lalu cek tanda `#` / `.` |
| Halaman langsung me-refresh saat tombol ditekan | Tombol berada di dalam `<form>` tanpa `preventDefault()` | Panggil `event.preventDefault()` pada handler event `submit` |

## Catatan keamanan

- Kelas hanya lewat link resmi dari platform.
- Jangan meminta kontak pribadi siswa, dan jangan menghubungi siswa di luar platform.
- Ingatkan siswa untuk selalu memvalidasi input dan memakai `textContent` daripada `innerHTML` saat menampilkan teks masukan pengguna.

## Setelah kelas

Isi laporan sesi di platform: ringkasan materi, kehadiran, catatan untuk setiap siswa, dan tautan karya (`karya_url`).
