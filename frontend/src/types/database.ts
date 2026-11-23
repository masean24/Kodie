/**
 * Tipe tabel, view, dan hasil RPC yang dipakai frontend.
 *
 * SEMENTARA: ditulis tangan dari docs/PRD.md bagian 7–8 dan docs/SERAH-TERIMA-FE.md.
 * Nanti diganti hasil `supabase gen types` dari backend/supabase/types/database.ts (Prompt 8).
 * Kolom yang ditandai "PERKIRAAN" belum dicocokkan dengan skema asli; cek saat integrasi.
 */

export type Jenjang = "SD" | "SMP" | "SMA";
export type Bidang = "software" | "jaringan" | "iot" | "ai_data";
export type KodeOpsi = "A" | "B" | "C" | "D";
export type StatusKelas = "terbuka" | "berjalan" | "selesai" | "disembunyikan";
export type StatusKerja = "mahasiswa" | "lulusan" | "pencari_kerja";

/** Tabel `program` (PRD bagian 7). */
export interface Program {
  id: string;
  slug: string;
  nama: string;
  jenjang: Jenjang[];
  kelas_min: number;
  kelas_maks: number;
  level: number;
  deskripsi: string;
  durasi_menit: number;
  jumlah_sesi: number;
  harga_paket: number;
  honor_per_sesi: number;
  aktif: boolean;
}

/**
 * View `kelas_katalog`. Kolom yang disebut serah terima: sisa_kursi, kursi_terpakai,
 * bisa_dibooking, hari_mingguan (1 = Senin … 7 = Minggu, WIB), nama dan foto pengajar.
 * Tanpa meet_uri.
 */
export interface KelasKatalog {
  id: string;
  program_id: string;
  level: number;
  pengajar_id: string;
  kapasitas: number;
  jam_mulai: string; // "HH:mm:ss" WIB
  status: StatusKelas;
  kursi_terpakai: number;
  sisa_kursi: number;
  bisa_dibooking: boolean;
  hari_mingguan: number;
  // PERKIRAAN nama kolom:
  program_slug: string;
  program_nama: string;
  jenjang: Jenjang[];
  durasi_menit: number;
  jumlah_sesi: number;
  harga_paket: number;
  pengajar_nama: string;
  pengajar_foto_url: string | null;
  /** Waktu mulai sesi 1, ISO 8601 UTC. */
  mulai_pada: string;
}

/** View `pengajar_publik`: hanya pengajar terverifikasi. */
export interface PengajarPublik {
  id: string;
  nama: string;
  status_kerja: StatusKerja;
  kampus: string | null;
  jurusan: string | null;
  keahlian: Bidang[];
  jumlah_rating: number;
  /** null jika jumlah_rating < 3. */
  rata_rata_rating: number | null;
  // PERKIRAAN nama kolom:
  foto_url: string | null;
}

/** View `soal_minat_publik`: tanpa bobot. */
export interface SoalMinatPublik {
  id: string;
  urutan: number;
  teks: string;
  opsi: { kode: KodeOpsi; teks: string }[];
}

/** Parameter `p_jawaban` RPC `hitung_tes_minat`: { "1": "A", …, "12": "D" }. */
export type JawabanMinat = Record<string, KodeOpsi>;

export type SkorBidang = Record<Bidang, number>;

/** Hasil RPC `hitung_tes_minat`. */
export interface HasilTesMinat {
  id: string | null;
  tersimpan: boolean;
  skor: SkorBidang;
  skor_mentah: SkorBidang;
  bidang_teratas: Bidang;
  rekomendasi_jurusan: string[];
  /** PERKIRAAN bentuk: slug program. Kosong jika jenjang siswa tidak diketahui (tamu). */
  rekomendasi_program: string[];
}

export type Peran = "orang_tua" | "siswa" | "pengajar" | "admin";

/** Nilai `pengguna.status` per peran (PRD bagian 7). */
export type StatusPengguna =
  | "aktif"
  | "nonaktif"
  | "menunggu_persetujuan"
  | "ditolak_orang_tua"
  | "menunggu_verifikasi"
  | "terverifikasi"
  | "ditolak";

/** Tabel `pengguna` (id sama dengan auth.users.id). Email ada di Supabase Auth. */
export interface Pengguna {
  id: string;
  peran: Peran;
  nama: string;
  no_wa: string | null;
  status: StatusPengguna;
  dibuat_pada: string;
}

/** Tabel `siswa`. Siswa SD tidak punya akun (pengguna_id null) dan wajib punya orang_tua_id. */
export interface Siswa {
  id: string;
  nama: string;
  tanggal_lahir: string; // YYYY-MM-DD
  jenjang: Jenjang;
  kelas: number;
  sekolah: string | null;
  orang_tua_id: string | null;
  pengguna_id: string | null;
  nama_orang_tua: string | null;
  email_orang_tua: string | null;
}

/** Hasil RPC `buat_link_persetujuan()`. Token asli hanya dikembalikan sekali. */
export interface LinkPersetujuan {
  token: string;
  kedaluwarsa_pada: string;
}

/** Hasil RPC `info_persetujuan(p_token)`. */
export interface InfoPersetujuan {
  siswa_id: string;
  nama: string;
  jenjang: Jenjang;
  kelas: number;
  sekolah: string | null;
  kedaluwarsa_pada: string;
}

export type KeputusanPersetujuan = "setujui" | "tolak";

/** Hasil RPC `putuskan_persetujuan(p_token, p_keputusan)`. */
export interface HasilPersetujuan {
  status: string;
  siswa_id: string;
  diputuskan_pada: string;
}

/** Tabel `hasil_minat`. `skor` berisi persentase 4 bidang. */
export interface HasilMinat {
  id: string;
  siswa_id: string;
  dikerjakan_oleh: string;
  jawaban: JawabanMinat;
  skor: SkorBidang;
  bidang_teratas: Bidang;
  dibuat_pada: string;
}

export type StatusBooking =
  | "menunggu_pembayaran"
  | "menunggu_verifikasi"
  | "terkonfirmasi"
  | "selesai"
  | "kedaluwarsa"
  | "dibatalkan";

/** Tabel `booking` (PRD bagian 5 dan 7). */
export interface Booking {
  id: string;
  kode: string;
  kelas_id: string;
  siswa_id: string;
  dibuat_oleh: string;
  status: StatusBooking;
  total: number;
  batas_bayar_pada: string;
  dibuat_pada: string;
}

/** Hasil RPC `buat_booking`. */
export interface HasilBuatBooking {
  id: string;
  kode: string;
  status: StatusBooking;
  total: number;
  batas_bayar_pada: string;
}

/** Tabel `pembayaran`: riwayat unggahan bukti per booking. */
export interface Pembayaran {
  id: string;
  booking_id: string;
  bukti_path: string;
  diunggah_pada: string;
  status: "menunggu" | "disetujui" | "ditolak";
  alasan_penolakan: string | null;
  diverifikasi_oleh: string | null;
  diverifikasi_pada: string | null;
}

/** Isi tabel `pengaturan` untuk instruksi bayar, plus signed URL gambar QRIS. */
export interface InfoPembayaran {
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik_rekening: string;
  qris_url: string | null;
}

/** Tabel `profil_pengajar` (PRD bagian 7). */
export interface ProfilPengajar {
  pengguna_id: string;
  status_kerja: StatusKerja;
  kampus: string | null;
  jurusan: string | null;
  keahlian: Bidang[];
  cv_url: string | null;
  foto_path: string | null;
  identitas_path: string | null;
  skck_path: string | null;
  wawancara_selesai: boolean;
  alasan_penolakan: string | null;
  diverifikasi_pada: string | null;
  diverifikasi_oleh: string | null;
}

/** Tabel `pengajar_program` (PRD bagian 7). */
export interface PengajarProgram {
  pengajar_id: string;
  program_id: string;
  disetujui: boolean;
}

export type StatusSesi = "terjadwal" | "selesai" | "dibatalkan";

/** View `sesi_saya`: tanpa `meet_uri` (docs/SERAH-TERIMA-FE.md). */
export interface SesiSaya {
  id: string;
  kelas_id: string;
  nomor: number;
  mulai_pada: string;
  selesai_pada: string;
  status: StatusSesi;
  bisa_masuk_kelas: boolean;
}

/** Tabel `playbook` / hasil RPC `playbook_sesi` (PRD bagian 7–8). */
export interface Playbook {
  id: string;
  program_id: string;
  level: number;
  nomor_sesi: number;
  judul: string;
  konten_md: string;
  starter_url: string | null;
}

/** Tabel `laporan_sesi` (PRD bagian 7). */
export interface LaporanSesi {
  id: string;
  sesi_id: string;
  pengajar_id: string;
  ringkasan: string;
  rekaman_url: string | null;
  kendala: string | null;
  dikirim_pada: string;
  diubah_pada: string | null;
}

/** Tabel `laporan_siswa` (PRD bagian 7). */
export interface LaporanSiswa {
  id: string;
  laporan_sesi_id: string;
  siswa_id: string;
  hadir: boolean;
  catatan: string | null;
  karya_url: string | null;
}

/** Tabel `rapor_jurusan` (PRD bagian 7). */
export interface RaporJurusan {
  id: string;
  sesi_id: string;
  siswa_id: string;
  skor_software: number;
  skor_jaringan: number;
  skor_iot: number;
  skor_ai_data: number;
  bidang_rekomendasi: Bidang;
  alasan: string;
  saran: string;
  dibuat_pada: string;
}

/** Elemen `p_siswa` pada RPC `kirim_laporan` dan `ubah_laporan`. */
export interface InputLaporanSiswa {
  siswa_id: string;
  hadir: boolean;
  catatan?: string | null;
  karya_url?: string | null;
}

/** Elemen `p_rapor` pada RPC `kirim_laporan` dan `ubah_laporan`. */
export interface InputRaporJurusan {
  siswa_id: string;
  skor_software: number;
  skor_jaringan: number;
  skor_iot: number;
  skor_ai_data: number;
  bidang_rekomendasi: Bidang;
  alasan: string;
  saran: string;
}

export type StatusHonor = "belum_dibayar" | "dibayar";

/** Tabel `honor` (PRD bagian 7). */
export interface Honor {
  id: string;
  pengajar_id: string;
  sesi_id: string;
  jumlah: number;
  status: StatusHonor;
  dibayar_pada: string | null;
  dibayar_oleh: string | null;
}
