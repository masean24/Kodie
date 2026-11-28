/**
 * Tipe database Supabase (disinkronkan dari backend/supabase/types/database.ts)
 * beserta tipe domain aplikasi untuk UI dan lapisan API frontend.
 */

/**
 * `TK` ditambahkan untuk paket Kenal Komputer (usia 5–7 tahun, keputusan 2026-11-28). Enum backend
 * `jenjang_pendidikan` belum memuatnya; lihat spesifikasi di docs/KEPUTUSAN.md. Kelas TK dicatat sebagai 0.
 */
export type Jenjang = "TK" | "SD" | "SMP" | "SMA";
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
  /** Silabus Sesi 1–4 (migration 12). Kosong bila belum diisi. */
  silabus?: SilabusSesi[];
}

/**
 * View `kelas_katalog`. Kolom asli view memakai `pengajar_foto_path` dan `sesi_pertama_mulai_pada`;
 * lapisan API menormalisasinya menjadi `pengajar_foto_url` dan `mulai_pada`. Tanpa `meet_uri`.
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
  program_slug: string;
  program_nama: string;
  jenjang: Jenjang[];
  kelas_min?: number;
  kelas_maks?: number;
  durasi_menit: number;
  jumlah_sesi: number;
  harga_paket: number;
  pengajar_nama: string;
  pengajar_slug?: string | null;
  pengajar_foto_url: string | null;
  pengajar_foto_path?: string | null;
  /** Waktu mulai sesi 1, ISO 8601 UTC (dinormalisasi dari `sesi_pertama_mulai_pada`). */
  mulai_pada: string;
  sesi_pertama_mulai_pada?: string | null;
  dibuat_pada?: string;
}

/** View `pengajar_publik`: hanya pengajar terverifikasi. */
export interface PengajarPublik {
  id: string;
  slug?: string | null;
  nama: string;
  status_kerja: StatusKerja;
  kampus: string | null;
  jurusan: string | null;
  keahlian: Bidang[];
  jumlah_rating: number;
  /** null jika jumlah_rating < 3. */
  rata_rata_rating: number | null;
  foto_url: string | null;
  foto_path?: string | null;
  cv_url?: string | null;
  diverifikasi_pada?: string | null;
  program_ids?: string[];
  /** Bio gaya mengajar (migration 12). */
  bio?: string | null;
}

/** View `soal_minat_publik`: tanpa bobot. */
export interface SoalMinatPublik {
  id: string;
  urutan: number;
  teks: string;
  opsi: { kode: KodeOpsi; teks: string }[];
}

export type JawabanMinat = Record<string, KodeOpsi>;
export type SkorBidang = Record<Bidang, number>;

/** Hasil RPC `hitung_tes_minat`. */
export interface HasilTesMinat {
  id: string | null;
  tersimpan: boolean;
  skor: SkorBidang;
  skor_mentah?: SkorBidang;
  bidang_teratas: Bidang;
  rekomendasi_jurusan: string[];
  /** Daftar slug program. Kosong jika jenjang siswa tidak diketahui (tamu). */
  rekomendasi_program: string[];
}

export type Peran = "orang_tua" | "siswa" | "pengajar" | "admin";

export type StatusPengguna =
  | "aktif"
  | "nonaktif"
  | "menunggu_persetujuan"
  | "ditolak_orang_tua"
  | "menunggu_verifikasi"
  | "terverifikasi"
  | "ditolak";

export interface Pengguna {
  id: string;
  peran: Peran;
  nama: string;
  no_wa: string | null;
  status: StatusPengguna;
  dibuat_pada: string;
  /** Waktu persetujuan Kebijakan Privasi saat daftar (migration 12). */
  privasi_disetujui_pada?: string | null;
}

export interface Siswa {
  id: string;
  nama: string;
  tanggal_lahir: string;
  jenjang: Jenjang;
  kelas: number;
  sekolah: string | null;
  orang_tua_id: string | null;
  pengguna_id: string | null;
  nama_orang_tua: string | null;
  email_orang_tua: string | null;
}

export interface LinkPersetujuan {
  token: string;
  kedaluwarsa_pada: string;
}

export interface InfoPersetujuan {
  siswa_id: string;
  nama: string;
  jenjang: Jenjang;
  kelas: number;
  sekolah: string | null;
  kedaluwarsa_pada: string;
}

export type KeputusanPersetujuan = "setujui" | "tolak";

export interface HasilPersetujuan {
  status: string;
  siswa_id: string;
  diputuskan_pada: string;
}

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

/** `paket` = 4 sesi berbayar; `trial` = gratis, hanya Sesi 1, sekali per anak (keputusan 2026-11-28). */
export type JenisBooking = "paket" | "trial";

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
  /** Kolom baru (spesifikasi 2026-11-28). Tidak ada = `paket`. */
  jenis?: JenisBooking;
  /** Kode referral pengajar yang dipakai saat booking, bila ada. */
  kode_referral?: string | null;
  /** Potongan rupiah dari kode referral (5% harga paket). `total` sudah dikurangi potongan ini. */
  potongan?: number;
}

/** Kode referral milik pengajar (spesifikasi 2026-11-28): satu kode aktif per pengajar. */
export interface KodeReferral {
  pengajar_id: string;
  kode: string;
  dibuat_pada: string;
}

/** Riwayat pengalaman di profil pengajar (spesifikasi 2026-11-28). */
export interface PengalamanPengajar {
  id: string;
  peran: string;
  tempat: string;
  periode: string;
  deskripsi: string | null;
}

/** Sertifikat di profil pengajar (spesifikasi 2026-11-28). */
export interface SertifikatPengajar {
  id: string;
  nama: string;
  penerbit: string;
  tahun: number;
  tautan: string | null;
}

export interface DetailProfilPengajar {
  pengalaman: PengalamanPengajar[];
  sertifikat: SertifikatPengajar[];
}

export interface HasilBuatBooking {
  id: string;
  kode: string;
  status: StatusBooking;
  total: number;
  batas_bayar_pada: string;
}

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

export interface InfoPembayaran {
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik_rekening: string;
  qris_url: string | null;
}

export interface ProfilPengajar {
  pengguna_id: string;
  slug?: string | null;
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
  bio?: string | null;
}

export interface PengajarProgram {
  pengajar_id: string;
  program_id: string;
  disetujui: boolean;
}

export type StatusSesi = "terjadwal" | "selesai" | "dibatalkan";

export interface SesiSaya {
  id: string;
  kelas_id: string;
  nomor: number;
  mulai_pada: string;
  selesai_pada: string;
  status: StatusSesi;
  bisa_masuk_kelas: boolean;
  punya_meet?: boolean;
  meet_gagal_terakhir?: string | null;
  program_id?: string;
  program_slug?: string;
  program_nama?: string;
  level?: number;
  pengajar_id?: string;
  pengajar_nama?: string;
}

export interface Playbook {
  id: string;
  program_id: string;
  level: number;
  nomor_sesi: number;
  judul: string;
  konten_md: string;
  starter_url: string | null;
}

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

export interface LaporanSiswa {
  id: string;
  laporan_sesi_id: string;
  siswa_id: string;
  hadir: boolean;
  catatan: string | null;
  karya_url: string | null;
}

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

export interface InputLaporanSiswa {
  siswa_id: string;
  hadir: boolean;
  catatan?: string | null;
  karya_url?: string | null;
}

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

export interface Honor {
  id: string;
  pengajar_id: string;
  sesi_id: string;
  jumlah: number;
  status: StatusHonor;
  dibayar_pada: string | null;
  dibayar_oleh: string | null;
}

export interface LaporanSaya {
  id: string;
  laporan_sesi_id?: string;
  laporan_siswa_id?: string;
  sesi_id: string;
  kelas_id?: string;
  nomor_sesi?: number;
  mulai_pada?: string;
  selesai_pada?: string;
  program_slug?: string;
  program_nama?: string;
  pengajar_id?: string;
  pengajar_nama?: string;
  siswa_id: string;
  siswa_nama?: string;
  ringkasan: string;
  rekaman_url: string | null;
  kendala: string | null;
  hadir: boolean;
  catatan: string | null;
  karya_url: string | null;
  dikirim_pada: string;
  diubah_pada: string | null;
  bisa_diubah?: boolean;
}

export interface RaporSaya {
  id: string;
  sesi_id: string;
  kelas_id?: string;
  siswa_id: string;
  siswa_nama?: string;
  siswa_jenjang?: Jenjang;
  siswa_kelas?: number;
  pengajar_id?: string;
  pengajar_nama?: string;
  skor_software: number;
  skor_jaringan: number;
  skor_iot: number;
  skor_ai_data: number;
  bidang_rekomendasi: Bidang;
  alasan: string;
  saran: string;
  dibuat_pada: string;
  tes_minat_skor?: SkorBidang | null;
  tes_minat_bidang_teratas?: Bidang | null;
  tes_minat_dibuat_pada?: string | null;
  minat_skor?: SkorBidang | null;
  minat_bidang_teratas?: Bidang | null;
  minat_dibuat_pada?: string | null;
}

export interface Rating {
  id: string;
  sesi_id: string;
  siswa_id: string;
  pemberi_id: string;
  bintang: number;
  komentar: string | null;
  dibuat_pada: string;
}

export type KategoriMasalah =
  | "perilaku_tidak_pantas"
  | "pengajar_tidak_hadir"
  | "masalah_teknis"
  | "lainnya";

export type PrioritasMasalah = "tinggi" | "normal";
export type StatusMasalah = "baru" | "ditinjau" | "selesai";

export interface LaporanMasalah {
  id: string;
  pelapor_id: string;
  sesi_id: string | null;
  pengajar_id: string;
  kategori: KategoriMasalah;
  deskripsi: string;
  prioritas: PrioritasMasalah;
  status: StatusMasalah;
  dibuat_pada: string;
}

export type TipeNotifikasi =
  | "laporan_dikirim"
  | "booking_status"
  | "sesi_dijadwal_ulang"
  | "pembayaran_masuk"
  | "persetujuan_diputuskan"
  | "pengajar_status"
  | "laporan_masalah_baru"
  | "pengingat"
  | "chat_handoff";

export interface Notifikasi {
  id: string;
  pengguna_id: string;
  tipe: TipeNotifikasi;
  judul: string;
  isi: string;
  tautan: string | null;
  dibaca_pada: string | null;
  dibuat_pada: string;
}

export interface AdminRingkasan {
  siswa_aktif: number;
  kelas_berjalan: number;
  booking_menunggu_verifikasi: number;
  pengajar_menunggu_verifikasi: number;
  laporan_masalah_baru: number;
  honor_belum_dibayar?: number;
  sesi_tanpa_meet?: number;
}

export interface SesiAdmin {
  id: string;
  kelas_id: string;
  nomor: number;
  mulai_pada: string;
  selesai_pada: string;
  status: StatusSesi;
  meet_space: string | null;
  meet_uri: string | null;
  meet_dibuat_pada: string | null;
  meet_gagal_terakhir: string | null;
}

export interface LogAdmin {
  id: string;
  admin_id: string;
  aksi: string;
  target_tipe: string;
  target_id: string;
  detail: Record<string, unknown> | string | null;
  dibuat_pada: string;
}

// ============================================================================
// Tipe Hasil Generate Resmi Supabase (backend/supabase/types/database.ts)
// ============================================================================

/** Satu sesi silabus program (`program.silabus`, migration 12). */
export interface SilabusSesi {
  sesi: number;
  judul: string;
  topik: string;
  hasil_proyek: string;
}

/** View `ulasan_pengajar_publik`: ulasan terverifikasi, pemberi disamarkan, tanpa `siswa_id`/`pemberi_id`. */
export interface UlasanPengajarPublik {
  id: string;
  pengajar_id: string;
  program_slug: string | null;
  program_nama: string | null;
  bintang: number;
  komentar: string;
  pemberi_label: string;
  dibuat_pada: string;
}

export type StatusWaitlist = "menunggu" | "diberitahu" | "dibatalkan";

/** Baris `waitlist_kelas` milik pengguna yang login. */
export interface WaitlistKelas {
  id: string;
  kelas_id: string;
  siswa_id: string | null;
  status: StatusWaitlist;
  dibuat_pada: string;
}

/** Hasil RPC `daftar_waitlist_kelas`. */
export interface HasilDaftarWaitlist {
  id: string;
  kelas_id: string;
  siswa_id: string | null;
  status: StatusWaitlist;
  sudah_terdaftar: boolean;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking: {
        Row: {
          batas_bayar_pada: string
          dibuat_oleh: string
          dibuat_pada: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_booking"]
          kelas_id: string
          kode: string
          kode_referral: string | null
          potongan: number
          siswa_id: string
          status: Database["public"]["Enums"]["status_booking"]
          total: number
        }
        Insert: {
          batas_bayar_pada: string
          dibuat_oleh: string
          dibuat_pada?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_booking"]
          kelas_id: string
          kode: string
          kode_referral?: string | null
          potongan?: number
          siswa_id: string
          status?: Database["public"]["Enums"]["status_booking"]
          total: number
        }
        Update: {
          batas_bayar_pada?: string
          dibuat_oleh?: string
          dibuat_pada?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_booking"]
          kelas_id?: string
          kode?: string
          kode_referral?: string | null
          potongan?: number
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_booking"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "booking_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_tsv: unknown
          dibuat_pada: string
          embedding: string
          heading_path: string
          id: string
          source_id: string
          source_title: string
          source_url: string
        }
        Insert: {
          chunk_index: number
          content: string
          content_tsv?: unknown
          dibuat_pada?: string
          embedding: string
          heading_path?: string
          id?: string
          source_id: string
          source_title: string
          source_url: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_tsv?: unknown
          dibuat_pada?: string
          embedding?: string
          heading_path?: string
          id?: string
          source_id?: string
          source_title?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      hasil_minat: {
        Row: {
          bidang_teratas: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada: string
          dikerjakan_oleh: string
          id: string
          jawaban: Json
          siswa_id: string
          skor: Json
        }
        Insert: {
          bidang_teratas: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada?: string
          dikerjakan_oleh: string
          id?: string
          jawaban: Json
          siswa_id: string
          skor: Json
        }
        Update: {
          bidang_teratas?: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada?: string
          dikerjakan_oleh?: string
          id?: string
          jawaban?: Json
          siswa_id?: string
          skor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hasil_minat_dikerjakan_oleh_fkey"
            columns: ["dikerjakan_oleh"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hasil_minat_dikerjakan_oleh_fkey"
            columns: ["dikerjakan_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hasil_minat_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      honor: {
        Row: {
          dibayar_oleh: string | null
          dibayar_pada: string | null
          dibuat_pada: string
          id: string
          jumlah: number
          pengajar_id: string
          sesi_id: string
          status: Database["public"]["Enums"]["status_honor"]
        }
        Insert: {
          dibayar_oleh?: string | null
          dibayar_pada?: string | null
          dibuat_pada?: string
          id?: string
          jumlah: number
          pengajar_id: string
          sesi_id: string
          status?: Database["public"]["Enums"]["status_honor"]
        }
        Update: {
          dibayar_oleh?: string | null
          dibayar_pada?: string | null
          dibuat_pada?: string
          id?: string
          jumlah?: number
          pengajar_id?: string
          sesi_id?: string
          status?: Database["public"]["Enums"]["status_honor"]
        }
        Relationships: [
          {
            foreignKeyName: "honor_dibayar_oleh_fkey"
            columns: ["dibayar_oleh"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_dibayar_oleh_fkey"
            columns: ["dibayar_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          dibuat_pada: string
          id: string
          jam_mulai: string
          kapasitas: number
          level: number
          pengajar_id: string
          program_id: string
          status: Database["public"]["Enums"]["status_kelas"]
        }
        Insert: {
          dibuat_pada?: string
          id?: string
          jam_mulai: string
          kapasitas: number
          level?: number
          pengajar_id: string
          program_id: string
          status?: Database["public"]["Enums"]["status_kelas"]
        }
        Update: {
          dibuat_pada?: string
          id?: string
          jam_mulai?: string
          kapasitas?: number
          level?: number
          pengajar_id?: string
          program_id?: string
          status?: Database["public"]["Enums"]["status_kelas"]
        }
        Relationships: [
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          content_hash: string
          diperbarui_pada: string
          id: string
          slug: string
          source_title: string
          source_url: string
        }
        Insert: {
          content_hash: string
          diperbarui_pada?: string
          id?: string
          slug: string
          source_title: string
          source_url: string
        }
        Update: {
          content_hash?: string
          diperbarui_pada?: string
          id?: string
          slug?: string
          source_title?: string
          source_url?: string
        }
        Relationships: []
      }
      kode_referral: {
        Row: {
          dibuat_pada: string
          kode: string
          pengajar_id: string
        }
        Insert: {
          dibuat_pada?: string
          kode: string
          pengajar_id: string
        }
        Update: {
          dibuat_pada?: string
          kode?: string
          pengajar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kode_referral_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: true
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kode_referral_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: true
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan_masalah: {
        Row: {
          deskripsi: string
          dibuat_pada: string
          id: string
          kategori: Database["public"]["Enums"]["kategori_masalah"]
          pelapor_id: string
          pengajar_id: string | null
          prioritas: Database["public"]["Enums"]["prioritas_masalah"]
          sesi_id: string | null
          status: Database["public"]["Enums"]["status_masalah"]
        }
        Insert: {
          deskripsi: string
          dibuat_pada?: string
          id?: string
          kategori: Database["public"]["Enums"]["kategori_masalah"]
          pelapor_id: string
          pengajar_id?: string | null
          prioritas?: Database["public"]["Enums"]["prioritas_masalah"]
          sesi_id?: string | null
          status?: Database["public"]["Enums"]["status_masalah"]
        }
        Update: {
          deskripsi?: string
          dibuat_pada?: string
          id?: string
          kategori?: Database["public"]["Enums"]["kategori_masalah"]
          pelapor_id?: string
          pengajar_id?: string | null
          prioritas?: Database["public"]["Enums"]["prioritas_masalah"]
          sesi_id?: string | null
          status?: Database["public"]["Enums"]["status_masalah"]
        }
        Relationships: [
          {
            foreignKeyName: "laporan_masalah_pelapor_id_fkey"
            columns: ["pelapor_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_masalah_pelapor_id_fkey"
            columns: ["pelapor_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_masalah_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_masalah_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_masalah_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_masalah_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan_sesi: {
        Row: {
          dikirim_pada: string
          diubah_pada: string | null
          id: string
          kendala: string | null
          pengajar_id: string
          rekaman_url: string | null
          ringkasan: string
          sesi_id: string
        }
        Insert: {
          dikirim_pada?: string
          diubah_pada?: string | null
          id?: string
          kendala?: string | null
          pengajar_id: string
          rekaman_url?: string | null
          ringkasan: string
          sesi_id: string
        }
        Update: {
          dikirim_pada?: string
          diubah_pada?: string | null
          id?: string
          kendala?: string | null
          pengajar_id?: string
          rekaman_url?: string | null
          ringkasan?: string
          sesi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laporan_sesi_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan_siswa: {
        Row: {
          catatan: string | null
          hadir: boolean
          id: string
          karya_url: string | null
          laporan_sesi_id: string
          siswa_id: string
        }
        Insert: {
          catatan?: string | null
          hadir: boolean
          id?: string
          karya_url?: string | null
          laporan_sesi_id: string
          siswa_id: string
        }
        Update: {
          catatan?: string | null
          hadir?: boolean
          id?: string
          karya_url?: string | null
          laporan_sesi_id?: string
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laporan_siswa_laporan_sesi_id_fkey"
            columns: ["laporan_sesi_id"]
            isOneToOne: false
            referencedRelation: "laporan_saya"
            referencedColumns: ["laporan_sesi_id"]
          },
          {
            foreignKeyName: "laporan_siswa_laporan_sesi_id_fkey"
            columns: ["laporan_sesi_id"]
            isOneToOne: false
            referencedRelation: "laporan_sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_siswa_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      log_admin: {
        Row: {
          admin_id: string
          aksi: string
          detail: Json | null
          dibuat_pada: string
          id: string
          target_id: string
          target_tipe: string
        }
        Insert: {
          admin_id: string
          aksi: string
          detail?: Json | null
          dibuat_pada?: string
          id?: string
          target_id: string
          target_tipe: string
        }
        Update: {
          admin_id?: string
          aksi?: string
          detail?: Json | null
          dibuat_pada?: string
          id?: string
          target_id?: string
          target_tipe?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_admin_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_admin_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      notifikasi: {
        Row: {
          dibaca_pada: string | null
          dibuat_pada: string
          id: string
          isi: string
          judul: string
          pengguna_id: string
          tautan: string | null
          tipe: Database["public"]["Enums"]["tipe_notifikasi"]
        }
        Insert: {
          dibaca_pada?: string | null
          dibuat_pada?: string
          id?: string
          isi: string
          judul: string
          pengguna_id: string
          tautan?: string | null
          tipe: Database["public"]["Enums"]["tipe_notifikasi"]
        }
        Update: {
          dibaca_pada?: string | null
          dibuat_pada?: string
          id?: string
          isi?: string
          judul?: string
          pengguna_id?: string
          tautan?: string | null
          tipe?: Database["public"]["Enums"]["tipe_notifikasi"]
        }
        Relationships: [
          {
            foreignKeyName: "notifikasi_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifikasi_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      pembayaran: {
        Row: {
          alasan_penolakan: string | null
          booking_id: string
          bukti_path: string
          diunggah_pada: string
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          id: string
          status: Database["public"]["Enums"]["status_pembayaran"]
        }
        Insert: {
          alasan_penolakan?: string | null
          booking_id: string
          bukti_path: string
          diunggah_pada?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_pembayaran"]
        }
        Update: {
          alasan_penolakan?: string | null
          booking_id?: string
          bukti_path?: string
          diunggah_pada?: string
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_pembayaran"]
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembayaran_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajar_program: {
        Row: {
          disetujui: boolean
          pengajar_id: string
          program_id: string
        }
        Insert: {
          disetujui?: boolean
          pengajar_id: string
          program_id: string
        }
        Update: {
          disetujui?: boolean
          pengajar_id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajar_program_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajar_program_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajar_program_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      pengalaman_pengajar: {
        Row: {
          deskripsi: string | null
          dibuat_pada: string
          id: string
          pengajar_id: string
          peran: string
          periode: string
          tempat: string
          urutan: number
        }
        Insert: {
          deskripsi?: string | null
          dibuat_pada?: string
          id?: string
          pengajar_id: string
          peran: string
          periode: string
          tempat: string
          urutan: number
        }
        Update: {
          deskripsi?: string | null
          dibuat_pada?: string
          id?: string
          pengajar_id?: string
          peran?: string
          periode?: string
          tempat?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "pengalaman_pengajar_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengalaman_pengajar_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      pengaturan: {
        Row: {
          kunci: string
          nilai: string
        }
        Insert: {
          kunci: string
          nilai: string
        }
        Update: {
          kunci?: string
          nilai?: string
        }
        Relationships: []
      }
      pengguna: {
        Row: {
          dibuat_pada: string
          id: string
          nama: string
          no_wa: string | null
          peran: Database["public"]["Enums"]["peran_pengguna"]
          privasi_disetujui_pada: string
          status: Database["public"]["Enums"]["status_pengguna"]
        }
        Insert: {
          dibuat_pada?: string
          id: string
          nama: string
          no_wa?: string | null
          peran: Database["public"]["Enums"]["peran_pengguna"]
          privasi_disetujui_pada?: string
          status: Database["public"]["Enums"]["status_pengguna"]
        }
        Update: {
          dibuat_pada?: string
          id?: string
          nama?: string
          no_wa?: string | null
          peran?: Database["public"]["Enums"]["peran_pengguna"]
          privasi_disetujui_pada?: string
          status?: Database["public"]["Enums"]["status_pengguna"]
        }
        Relationships: []
      }
      percakapan_chat: {
        Row: {
          admin_id: string | null
          dibuat_pada: string
          diperbarui_pada: string
          id: string
          judul: string
          laporan_masalah_id: string | null
          pengguna_id: string
          status: Database["public"]["Enums"]["status_percakapan_chat"]
        }
        Insert: {
          admin_id?: string | null
          dibuat_pada?: string
          diperbarui_pada?: string
          id?: string
          judul?: string
          laporan_masalah_id?: string | null
          pengguna_id: string
          status?: Database["public"]["Enums"]["status_percakapan_chat"]
        }
        Update: {
          admin_id?: string | null
          dibuat_pada?: string
          diperbarui_pada?: string
          id?: string
          judul?: string
          laporan_masalah_id?: string | null
          pengguna_id?: string
          status?: Database["public"]["Enums"]["status_percakapan_chat"]
        }
        Relationships: [
          {
            foreignKeyName: "percakapan_chat_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "percakapan_chat_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "percakapan_chat_laporan_masalah_id_fkey"
            columns: ["laporan_masalah_id"]
            isOneToOne: false
            referencedRelation: "laporan_masalah"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "percakapan_chat_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "percakapan_chat_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      persetujuan_orang_tua: {
        Row: {
          dibuat_pada: string
          diputuskan_pada: string | null
          id: string
          kedaluwarsa_pada: string
          orang_tua_id: string | null
          siswa_id: string
          status: Database["public"]["Enums"]["status_persetujuan"]
          token_hash: string
        }
        Insert: {
          dibuat_pada?: string
          diputuskan_pada?: string | null
          id?: string
          kedaluwarsa_pada: string
          orang_tua_id?: string | null
          siswa_id: string
          status?: Database["public"]["Enums"]["status_persetujuan"]
          token_hash: string
        }
        Update: {
          dibuat_pada?: string
          diputuskan_pada?: string | null
          id?: string
          kedaluwarsa_pada?: string
          orang_tua_id?: string | null
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_persetujuan"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "persetujuan_orang_tua_orang_tua_id_fkey"
            columns: ["orang_tua_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persetujuan_orang_tua_orang_tua_id_fkey"
            columns: ["orang_tua_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persetujuan_orang_tua_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      pesan_chat: {
        Row: {
          dibuat_pada: string
          id: string
          isi: string
          pengirim_id: string | null
          pengirim_peran: Database["public"]["Enums"]["pengirim_pesan_chat"]
          percakapan_id: string
          sitasi: Json
        }
        Insert: {
          dibuat_pada?: string
          id?: string
          isi: string
          pengirim_id?: string | null
          pengirim_peran: Database["public"]["Enums"]["pengirim_pesan_chat"]
          percakapan_id: string
          sitasi?: Json
        }
        Update: {
          dibuat_pada?: string
          id?: string
          isi?: string
          pengirim_id?: string | null
          pengirim_peran?: Database["public"]["Enums"]["pengirim_pesan_chat"]
          percakapan_id?: string
          sitasi?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pesan_chat_pengirim_id_fkey"
            columns: ["pengirim_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesan_chat_pengirim_id_fkey"
            columns: ["pengirim_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesan_chat_percakapan_id_fkey"
            columns: ["percakapan_id"]
            isOneToOne: false
            referencedRelation: "percakapan_chat"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook: {
        Row: {
          id: string
          judul: string
          konten_md: string
          level: number
          nomor_sesi: number
          program_id: string
          starter_url: string | null
        }
        Insert: {
          id?: string
          judul: string
          konten_md: string
          level?: number
          nomor_sesi: number
          program_id: string
          starter_url?: string | null
        }
        Update: {
          id?: string
          judul?: string
          konten_md?: string
          level?: number
          nomor_sesi?: number
          program_id?: string
          starter_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      profil_pengajar: {
        Row: {
          alasan_penolakan: string | null
          bio: string | null
          cv_url: string | null
          diverifikasi_oleh: string | null
          diverifikasi_pada: string | null
          foto_path: string | null
          identitas_path: string | null
          jurusan: string | null
          kampus: string | null
          keahlian: Database["public"]["Enums"]["bidang_it"][]
          pengguna_id: string
          skck_path: string | null
          slug: string
          status_kerja:
            | Database["public"]["Enums"]["status_kerja_pengajar"]
            | null
          wawancara_selesai: boolean
        }
        Insert: {
          alasan_penolakan?: string | null
          bio?: string | null
          cv_url?: string | null
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          foto_path?: string | null
          identitas_path?: string | null
          jurusan?: string | null
          kampus?: string | null
          keahlian?: Database["public"]["Enums"]["bidang_it"][]
          pengguna_id: string
          skck_path?: string | null
          slug: string
          status_kerja?:
            | Database["public"]["Enums"]["status_kerja_pengajar"]
            | null
          wawancara_selesai?: boolean
        }
        Update: {
          alasan_penolakan?: string | null
          bio?: string | null
          cv_url?: string | null
          diverifikasi_oleh?: string | null
          diverifikasi_pada?: string | null
          foto_path?: string | null
          identitas_path?: string | null
          jurusan?: string | null
          kampus?: string | null
          keahlian?: Database["public"]["Enums"]["bidang_it"][]
          pengguna_id?: string
          skck_path?: string | null
          slug?: string
          status_kerja?:
            | Database["public"]["Enums"]["status_kerja_pengajar"]
            | null
          wawancara_selesai?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profil_pengajar_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_pengajar_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_pengajar_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_pengajar_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      program: {
        Row: {
          aktif: boolean
          deskripsi: string
          durasi_menit: number
          harga_paket: number
          honor_per_sesi: number
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"][]
          jumlah_sesi: number
          kelas_maks: number
          kelas_min: number
          level: number
          nama: string
          silabus: Json
          slug: string
        }
        Insert: {
          aktif?: boolean
          deskripsi: string
          durasi_menit: number
          harga_paket: number
          honor_per_sesi: number
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"][]
          jumlah_sesi?: number
          kelas_maks: number
          kelas_min: number
          level?: number
          nama: string
          silabus?: Json
          slug: string
        }
        Update: {
          aktif?: boolean
          deskripsi?: string
          durasi_menit?: number
          harga_paket?: number
          honor_per_sesi?: number
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_pendidikan"][]
          jumlah_sesi?: number
          kelas_maks?: number
          kelas_min?: number
          level?: number
          nama?: string
          silabus?: Json
          slug?: string
        }
        Relationships: []
      }
      rapor_jurusan: {
        Row: {
          alasan: string
          bidang_rekomendasi: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada: string
          id: string
          saran: string
          sesi_id: string
          siswa_id: string
          skor_ai_data: number
          skor_iot: number
          skor_jaringan: number
          skor_software: number
        }
        Insert: {
          alasan: string
          bidang_rekomendasi: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada?: string
          id?: string
          saran: string
          sesi_id: string
          siswa_id: string
          skor_ai_data: number
          skor_iot: number
          skor_jaringan: number
          skor_software: number
        }
        Update: {
          alasan?: string
          bidang_rekomendasi?: Database["public"]["Enums"]["bidang_it"]
          dibuat_pada?: string
          id?: string
          saran?: string
          sesi_id?: string
          siswa_id?: string
          skor_ai_data?: number
          skor_iot?: number
          skor_jaringan?: number
          skor_software?: number
        }
        Relationships: [
          {
            foreignKeyName: "rapor_jurusan_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapor_jurusan_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapor_jurusan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      rating: {
        Row: {
          bintang: number
          dibuat_pada: string
          id: string
          komentar: string | null
          pemberi_id: string
          sesi_id: string
          siswa_id: string
        }
        Insert: {
          bintang: number
          dibuat_pada?: string
          id?: string
          komentar?: string | null
          pemberi_id: string
          sesi_id: string
          siswa_id: string
        }
        Update: {
          bintang?: number
          dibuat_pada?: string
          id?: string
          komentar?: string | null
          pemberi_id?: string
          sesi_id?: string
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_pemberi_id_fkey"
            columns: ["pemberi_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_pemberi_id_fkey"
            columns: ["pemberi_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
      sertifikat_pengajar: {
        Row: {
          dibuat_pada: string
          id: string
          nama: string
          penerbit: string
          pengajar_id: string
          tahun: number
          tautan: string | null
        }
        Insert: {
          dibuat_pada?: string
          id?: string
          nama: string
          penerbit: string
          pengajar_id: string
          tahun: number
          tautan?: string | null
        }
        Update: {
          dibuat_pada?: string
          id?: string
          nama?: string
          penerbit?: string
          pengajar_id?: string
          tahun?: number
          tautan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sertifikat_pengajar_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sertifikat_pengajar_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      sesi: {
        Row: {
          id: string
          kelas_id: string
          meet_dibuat_pada: string | null
          meet_gagal_terakhir: string | null
          meet_space: string | null
          meet_uri: string | null
          mulai_pada: string
          nomor: number
          selesai_pada: string
          status: Database["public"]["Enums"]["status_sesi"]
        }
        Insert: {
          id?: string
          kelas_id: string
          meet_dibuat_pada?: string | null
          meet_gagal_terakhir?: string | null
          meet_space?: string | null
          meet_uri?: string | null
          mulai_pada: string
          nomor: number
          selesai_pada: string
          status?: Database["public"]["Enums"]["status_sesi"]
        }
        Update: {
          id?: string
          kelas_id?: string
          meet_dibuat_pada?: string | null
          meet_gagal_terakhir?: string | null
          meet_space?: string | null
          meet_uri?: string | null
          mulai_pada?: string
          nomor?: number
          selesai_pada?: string
          status?: Database["public"]["Enums"]["status_sesi"]
        }
        Relationships: [
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      siswa: {
        Row: {
          dibuat_pada: string
          email_orang_tua: string | null
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          kelas: number
          nama: string
          nama_orang_tua: string | null
          orang_tua_id: string | null
          pengguna_id: string | null
          sekolah: string | null
          tanggal_lahir: string
        }
        Insert: {
          dibuat_pada?: string
          email_orang_tua?: string | null
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          kelas: number
          nama: string
          nama_orang_tua?: string | null
          orang_tua_id?: string | null
          pengguna_id?: string | null
          sekolah?: string | null
          tanggal_lahir: string
        }
        Update: {
          dibuat_pada?: string
          email_orang_tua?: string | null
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_pendidikan"]
          kelas?: number
          nama?: string
          nama_orang_tua?: string | null
          orang_tua_id?: string | null
          pengguna_id?: string | null
          sekolah?: string | null
          tanggal_lahir?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_orang_tua_id_fkey"
            columns: ["orang_tua_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_orang_tua_id_fkey"
            columns: ["orang_tua_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: true
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
      soal_minat: {
        Row: {
          id: string
          opsi: Json
          teks: string
          urutan: number
        }
        Insert: {
          id?: string
          opsi: Json
          teks: string
          urutan: number
        }
        Update: {
          id?: string
          opsi?: Json
          teks?: string
          urutan?: number
        }
        Relationships: []
      }
      waitlist_kelas: {
        Row: {
          diberitahu_pada: string | null
          dibuat_pada: string
          id: string
          kelas_id: string
          pengguna_id: string
          siswa_id: string | null
          status: Database["public"]["Enums"]["status_waitlist"]
        }
        Insert: {
          diberitahu_pada?: string | null
          dibuat_pada?: string
          id?: string
          kelas_id: string
          pengguna_id: string
          siswa_id?: string | null
          status?: Database["public"]["Enums"]["status_waitlist"]
        }
        Update: {
          diberitahu_pada?: string | null
          dibuat_pada?: string
          id?: string
          kelas_id?: string
          pengguna_id?: string
          siswa_id?: string | null
          status?: Database["public"]["Enums"]["status_waitlist"]
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "waitlist_kelas_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_kelas_pengguna_id_fkey"
            columns: ["pengguna_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_kelas_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_ringkasan: {
        Row: {
          booking_menunggu_verifikasi: number | null
          honor_belum_dibayar: number | null
          kelas_berjalan: number | null
          laporan_masalah_baru: number | null
          pengajar_menunggu_verifikasi: number | null
          sesi_tanpa_meet: number | null
          siswa_aktif: number | null
        }
        Relationships: []
      }
      chatbot_konfigurasi_publik: {
        Row: {
          kunci: string | null
          nilai: string | null
        }
        Insert: {
          kunci?: string | null
          nilai?: string | null
        }
        Update: {
          kunci?: string | null
          nilai?: string | null
        }
        Relationships: []
      }
      kelas_katalog: {
        Row: {
          bisa_dibooking: boolean | null
          dibuat_pada: string | null
          durasi_menit: number | null
          harga_paket: number | null
          hari_mingguan: number | null
          id: string | null
          jam_mulai: string | null
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"][] | null
          jumlah_sesi: number | null
          kapasitas: number | null
          kelas_maks: number | null
          kelas_min: number | null
          kursi_terpakai: number | null
          level: number | null
          pengajar_foto_path: string | null
          pengajar_id: string | null
          pengajar_nama: string | null
          pengajar_slug: string | null
          program_id: string | null
          program_nama: string | null
          program_slug: string | null
          sesi_pertama_mulai_pada: string | null
          sisa_kursi: number | null
          status: Database["public"]["Enums"]["status_kelas"] | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan_saya: {
        Row: {
          bisa_diubah: boolean | null
          catatan: string | null
          dikirim_pada: string | null
          diubah_pada: string | null
          hadir: boolean | null
          karya_url: string | null
          kelas_id: string | null
          kendala: string | null
          laporan_sesi_id: string | null
          laporan_siswa_id: string | null
          mulai_pada: string | null
          nomor_sesi: number | null
          pengajar_id: string | null
          pengajar_nama: string | null
          program_nama: string | null
          program_slug: string | null
          rekaman_url: string | null
          ringkasan: string | null
          selesai_pada: string | null
          sesi_id: string | null
          siswa_id: string | null
          siswa_nama: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laporan_sesi_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_sesi_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: true
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_siswa_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      pengajar_publik: {
        Row: {
          bio: string | null
          cv_url: string | null
          diverifikasi_pada: string | null
          foto_path: string | null
          id: string | null
          jumlah_rating: number | null
          jurusan: string | null
          kampus: string | null
          keahlian: Database["public"]["Enums"]["bidang_it"][] | null
          nama: string | null
          program_ids: string[] | null
          rata_rata_rating: number | null
          slug: string | null
          status_kerja:
            | Database["public"]["Enums"]["status_kerja_pengajar"]
            | null
        }
        Relationships: []
      }
      perkiraan_bagi_hasil_saya: {
        Row: {
          honor_per_sesi: number | null
          jumlah_sesi: number | null
          jumlah_siswa: number | null
          kelas_id: string | null
          level: number | null
          program_nama: string | null
          program_slug: string | null
          siswa_referral: number | null
          status: Database["public"]["Enums"]["status_kelas"] | null
        }
        Relationships: []
      }
      rapor_saya: {
        Row: {
          alasan: string | null
          bidang_rekomendasi: Database["public"]["Enums"]["bidang_it"] | null
          dibuat_pada: string | null
          id: string | null
          kelas_id: string | null
          pengajar_id: string | null
          pengajar_nama: string | null
          saran: string | null
          sesi_id: string | null
          siswa_id: string | null
          siswa_jenjang:
            | Database["public"]["Enums"]["jenjang_pendidikan"]
            | null
          siswa_kelas: number | null
          siswa_nama: string | null
          skor_ai_data: number | null
          skor_iot: number | null
          skor_jaringan: number | null
          skor_software: number | null
          tes_minat_bidang_teratas:
            | Database["public"]["Enums"]["bidang_it"]
            | null
          tes_minat_dibuat_pada: string | null
          tes_minat_skor: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapor_jurusan_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapor_jurusan_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_saya"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rapor_jurusan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      sesi_saya: {
        Row: {
          bisa_masuk_kelas: boolean | null
          id: string | null
          kelas_id: string | null
          level: number | null
          meet_gagal_terakhir: string | null
          mulai_pada: string | null
          nomor: number | null
          pengajar_id: string | null
          pengajar_nama: string | null
          program_id: string | null
          program_nama: string | null
          program_slug: string | null
          punya_meet: boolean | null
          selesai_pada: string | null
          status: Database["public"]["Enums"]["status_sesi"] | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "program"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas_katalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "perkiraan_bagi_hasil_saya"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      soal_minat_publik: {
        Row: {
          id: string | null
          opsi: Json | null
          teks: string | null
          urutan: number | null
        }
        Insert: {
          id?: string | null
          opsi?: never
          teks?: string | null
          urutan?: number | null
        }
        Update: {
          id?: string | null
          opsi?: never
          teks?: string | null
          urutan?: number | null
        }
        Relationships: []
      }
      ulasan_pengajar_publik: {
        Row: {
          bintang: number | null
          dibuat_pada: string | null
          id: string | null
          komentar: string | null
          pemberi_label: string | null
          pengajar_id: string | null
          program_nama: string | null
          program_slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengajar_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_pengajar_id_fkey"
            columns: ["pengajar_id"]
            isOneToOne: false
            referencedRelation: "pengguna"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adalah_booking_saya: { Args: { p_booking_id: string }; Returns: boolean }
      adalah_kelas_pengajar_saya: {
        Args: { p_kelas_id: string }
        Returns: boolean
      }
      adalah_pengajar_terverifikasi: {
        Args: { p_pengajar_id: string }
        Returns: boolean
      }
      adalah_percakapan_chat_saya: {
        Args: { p_percakapan_id: string }
        Returns: boolean
      }
      adalah_peserta_kelas_saya: {
        Args: { p_siswa_id: string }
        Returns: boolean
      }
      adalah_sesi_pengajar_saya: {
        Args: { p_sesi_id: string }
        Returns: boolean
      }
      adalah_siswa_saya: { Args: { p_siswa_id: string }; Returns: boolean }
      admin_ambil_alih_chat: {
        Args: { p_percakapan_id: string }
        Returns: Json
      }
      admin_nonaktifkan_pengguna: {
        Args: { p_alasan: string; p_pengguna_id: string }
        Returns: Json
      }
      admin_selesaikan_chat: {
        Args: { p_kembali_ke_bot?: boolean; p_percakapan_id: string }
        Returns: Json
      }
      admin_setujui_pembayaran: {
        Args: { p_pembayaran_id: string }
        Returns: Json
      }
      admin_setujui_pengajar: {
        Args: { p_pengajar_id: string; p_program_ids: string[] }
        Returns: Json
      }
      admin_tandai_honor_dibayar: { Args: { p_id: string }; Returns: Json }
      admin_tolak_pembayaran: {
        Args: { p_alasan: string; p_pembayaran_id: string }
        Returns: Json
      }
      admin_tolak_pengajar: {
        Args: { p_alasan: string; p_pengajar_id: string }
        Returns: Json
      }
      admin_ubah_laporan_masalah: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["status_masalah"]
        }
        Returns: Json
      }
      admin_wawancara_selesai: {
        Args: { p_pengajar_id: string; p_selesai?: boolean }
        Returns: Json
      }
      baca_semua_notifikasi: { Args: never; Returns: number }
      batal_waitlist_kelas: { Args: { p_kelas_id: string }; Returns: Json }
      batalkan_booking: { Args: { p_booking_id: string }; Returns: Json }
      beri_rating: {
        Args: {
          p_bintang: number
          p_komentar?: string
          p_sesi_id: string
          p_siswa_id: string
        }
        Returns: Json
      }
      buat_booking: {
        Args: {
          p_kelas_id: string
          p_kode_referral?: string
          p_siswa_id: string
        }
        Returns: Json
      }
      buat_booking_trial: {
        Args: { p_kelas_id: string; p_siswa_id: string }
        Returns: Json
      }
      buat_kode_referral: { Args: never; Returns: Json }
      buat_link_persetujuan: { Args: never; Returns: Json }
      buat_slug_pengajar_unik: {
        Args: { p_abaikan_id?: string; p_nama: string }
        Returns: string
      }
      buka_kelas: {
        Args: {
          p_jam_mulai: string
          p_kapasitas: number
          p_level?: number
          p_program_id: string
          p_tanggal_mulai: string
        }
        Returns: Json
      }
      cari_knowledge_rag: {
        Args: {
          p_match_count?: number
          p_query_embedding: string
          p_query_text: string
        }
        Returns: {
          content: string
          fts_rank: number
          heading_path: string
          id: string
          rrf_score: number
          source_title: string
          source_url: string
          vec_sim: number
        }[]
      }
      cron_coba_ulang_meet: { Args: never; Returns: undefined }
      cron_kedaluwarsa_booking: { Args: never; Returns: undefined }
      cron_kedaluwarsa_token_persetujuan: { Args: never; Returns: undefined }
      cron_pengingat_laporan: { Args: never; Returns: undefined }
      cron_pengingat_sesi: { Args: never; Returns: undefined }
      cron_status_kelas: { Args: never; Returns: undefined }
      daftar_waitlist_kelas: {
        Args: { p_kelas_id: string; p_siswa_id?: string }
        Returns: Json
      }
      geser_sesi: {
        Args: { p_mulai_pada: string; p_sesi_id: string }
        Returns: Json
      }
      hitung_tes_minat: {
        Args: { p_jawaban: Json; p_siswa_id?: string }
        Returns: Json
      }
      info_persetujuan: { Args: { p_token: string }; Returns: Json }
      kedaluwarsakan_booking_lewat_batas: { Args: never; Returns: number }
      kirim_bukti_bayar: {
        Args: { p_booking_id: string; p_path: string }
        Returns: Json
      }
      kirim_laporan: {
        Args: {
          p_kendala: string
          p_rapor?: Json
          p_rekaman_url: string
          p_ringkasan: string
          p_sesi_id: string
          p_siswa: Json
        }
        Returns: Json
      }
      kirim_pesan_live_chat: {
        Args: { p_isi: string; p_percakapan_id: string }
        Returns: Json
      }
      link_masuk_sesi: { Args: { p_sesi_id: string }; Returns: Json }
      minta_bantuan_admin_chat: {
        Args: {
          p_buat_tiket?: boolean
          p_percakapan_id: string
          p_ringkasan_masalah?: string
        }
        Returns: Json
      }
      peran_saya: {
        Args: never
        Returns: Database["public"]["Enums"]["peran_pengguna"]
      }
      playbook_sesi: { Args: { p_sesi_id: string }; Returns: Json }
      punya_booking_di_kelas: { Args: { p_kelas_id: string }; Returns: boolean }
      putuskan_persetujuan: {
        Args: { p_keputusan: string; p_token: string }
        Returns: Json
      }
      simpan_detail_profil_pengajar: {
        Args: { p_pengalaman: Json; p_sertifikat: Json }
        Returns: Json
      }
      status_saya: {
        Args: never
        Returns: Database["public"]["Enums"]["status_pengguna"]
      }
      ubah_laporan: {
        Args: {
          p_kendala: string
          p_rapor?: Json
          p_rekaman_url: string
          p_ringkasan: string
          p_sesi_id: string
          p_siswa: Json
        }
        Returns: Json
      }
      ubah_slug_pengajar: { Args: { p_slug: string }; Returns: Json }
    }
    Enums: {
      bidang_it: "software" | "jaringan" | "iot" | "ai_data"
      jenis_booking: "paket" | "trial"
      jenjang_pendidikan: "TK" | "SD" | "SMP" | "SMA"
      kategori_masalah:
        | "perilaku_tidak_pantas"
        | "pengajar_tidak_hadir"
        | "masalah_teknis"
        | "lainnya"
      pengirim_pesan_chat: "pengguna" | "bot" | "admin" | "sistem"
      peran_pengguna: "orang_tua" | "siswa" | "pengajar" | "admin"
      prioritas_masalah: "normal" | "tinggi"
      status_booking:
        | "menunggu_pembayaran"
        | "menunggu_verifikasi"
        | "terkonfirmasi"
        | "selesai"
        | "kedaluwarsa"
        | "dibatalkan"
      status_honor: "belum_dibayar" | "dibayar"
      status_kelas: "terbuka" | "berjalan" | "selesai" | "disembunyikan"
      status_kerja_pengajar: "mahasiswa" | "lulusan" | "pencari_kerja"
      status_masalah: "baru" | "ditinjau" | "selesai"
      status_pembayaran: "menunggu" | "disetujui" | "ditolak"
      status_pengguna:
        | "aktif"
        | "nonaktif"
        | "menunggu_persetujuan"
        | "ditolak_orang_tua"
        | "menunggu_verifikasi"
        | "terverifikasi"
        | "ditolak"
      status_percakapan_chat:
        | "bot"
        | "menunggu_admin"
        | "ditangani_admin"
        | "selesai"
      status_persetujuan: "menunggu" | "disetujui" | "ditolak" | "kedaluwarsa"
      status_sesi: "terjadwal" | "selesai" | "dibatalkan"
      status_waitlist: "menunggu" | "diberitahu" | "dibatalkan"
      tipe_notifikasi:
        | "laporan_dikirim"
        | "booking_status"
        | "sesi_dijadwal_ulang"
        | "pembayaran_masuk"
        | "persetujuan_diputuskan"
        | "pengajar_status"
        | "laporan_masalah_baru"
        | "pengingat"
        | "chat_handoff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bidang_it: ["software", "jaringan", "iot", "ai_data"],
      jenis_booking: ["paket", "trial"],
      jenjang_pendidikan: ["TK", "SD", "SMP", "SMA"],
      kategori_masalah: [
        "perilaku_tidak_pantas",
        "pengajar_tidak_hadir",
        "masalah_teknis",
        "lainnya",
      ],
      pengirim_pesan_chat: ["pengguna", "bot", "admin", "sistem"],
      peran_pengguna: ["orang_tua", "siswa", "pengajar", "admin"],
      prioritas_masalah: ["normal", "tinggi"],
      status_booking: [
        "menunggu_pembayaran",
        "menunggu_verifikasi",
        "terkonfirmasi",
        "selesai",
        "kedaluwarsa",
        "dibatalkan",
      ],
      status_honor: ["belum_dibayar", "dibayar"],
      status_kelas: ["terbuka", "berjalan", "selesai", "disembunyikan"],
      status_kerja_pengajar: ["mahasiswa", "lulusan", "pencari_kerja"],
      status_masalah: ["baru", "ditinjau", "selesai"],
      status_pembayaran: ["menunggu", "disetujui", "ditolak"],
      status_pengguna: [
        "aktif",
        "nonaktif",
        "menunggu_persetujuan",
        "ditolak_orang_tua",
        "menunggu_verifikasi",
        "terverifikasi",
        "ditolak",
      ],
      status_percakapan_chat: [
        "bot",
        "menunggu_admin",
        "ditangani_admin",
        "selesai",
      ],
      status_persetujuan: ["menunggu", "disetujui", "ditolak", "kedaluwarsa"],
      status_sesi: ["terjadwal", "selesai", "dibatalkan"],
      status_waitlist: ["menunggu", "diberitahu", "dibatalkan"],
      tipe_notifikasi: [
        "laporan_dikirim",
        "booking_status",
        "sesi_dijadwal_ulang",
        "pembayaran_masuk",
        "persetujuan_diputuskan",
        "pengajar_status",
        "laporan_masalah_baru",
        "pengingat",
        "chat_handoff",
      ],
    },
  },
} as const
