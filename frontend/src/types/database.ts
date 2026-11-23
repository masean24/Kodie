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
