-- ============================================================================
-- Migration 1: Enum, Tabel (22 tabel), Constraint, Index, Foreign Key
-- Sumber kebenaran: docs/PRD.md Bagian 7 & docs/KEPUTUSAN.md
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

CREATE TYPE public.peran_pengguna AS ENUM (
  'orang_tua',
  'siswa',
  'pengajar',
  'admin'
);

CREATE TYPE public.status_pengguna AS ENUM (
  'aktif',
  'nonaktif',
  'menunggu_persetujuan',
  'ditolak_orang_tua',
  'menunggu_verifikasi',
  'terverifikasi',
  'ditolak'
);

CREATE TYPE public.jenjang_pendidikan AS ENUM (
  'SD',
  'SMP',
  'SMA'
);

CREATE TYPE public.status_persetujuan AS ENUM (
  'menunggu',
  'disetujui',
  'ditolak',
  'kedaluwarsa'
);

CREATE TYPE public.status_kerja_pengajar AS ENUM (
  'mahasiswa',
  'lulusan',
  'pencari_kerja'
);

CREATE TYPE public.bidang_it AS ENUM (
  'software',
  'jaringan',
  'iot',
  'ai_data'
);

CREATE TYPE public.status_kelas AS ENUM (
  'terbuka',
  'berjalan',
  'selesai',
  'disembunyikan'
);

CREATE TYPE public.status_sesi AS ENUM (
  'terjadwal',
  'selesai',
  'dibatalkan'
);

CREATE TYPE public.status_booking AS ENUM (
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'terkonfirmasi',
  'selesai',
  'kedaluwarsa',
  'dibatalkan'
);

CREATE TYPE public.status_pembayaran AS ENUM (
  'menunggu',
  'disetujui',
  'ditolak'
);

CREATE TYPE public.kategori_masalah AS ENUM (
  'perilaku_tidak_pantas',
  'pengajar_tidak_hadir',
  'masalah_teknis',
  'lainnya'
);

CREATE TYPE public.prioritas_masalah AS ENUM (
  'normal',
  'tinggi'
);

CREATE TYPE public.status_masalah AS ENUM (
  'baru',
  'ditinjau',
  'selesai'
);

CREATE TYPE public.status_honor AS ENUM (
  'belum_dibayar',
  'dibayar'
);

CREATE TYPE public.tipe_notifikasi AS ENUM (
  'laporan_dikirim',
  'booking_status',
  'sesi_dijadwal_ulang',
  'pembayaran_masuk',
  'persetujuan_diputuskan',
  'pengajar_status',
  'laporan_masalah_baru',
  'pengingat'
);

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- 2.1 pengguna
CREATE TABLE public.pengguna (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  peran public.peran_pengguna NOT NULL,
  nama text NOT NULL CHECK (char_length(btrim(nama)) > 0),
  no_wa text,
  status public.status_pengguna NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_status_per_peran CHECK (
    (peran = 'orang_tua' AND status IN ('aktif', 'nonaktif')) OR
    (peran = 'siswa' AND status IN ('menunggu_persetujuan', 'aktif', 'ditolak_orang_tua', 'nonaktif')) OR
    (peran = 'pengajar' AND status IN ('menunggu_verifikasi', 'terverifikasi', 'ditolak', 'nonaktif')) OR
    (peran = 'admin' AND status = 'aktif')
  )
);

-- 2.2 siswa
CREATE TABLE public.siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL CHECK (char_length(btrim(nama)) > 0),
  tanggal_lahir date NOT NULL,
  jenjang public.jenjang_pendidikan NOT NULL,
  kelas integer NOT NULL,
  sekolah text,
  orang_tua_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  pengguna_id uuid UNIQUE REFERENCES public.pengguna(id) ON DELETE CASCADE,
  nama_orang_tua text,
  email_orang_tua text,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_siswa_jenjang_kelas CHECK (
    (jenjang = 'SD' AND kelas BETWEEN 1 AND 6) OR
    (jenjang = 'SMP' AND kelas BETWEEN 7 AND 9) OR
    (jenjang = 'SMA' AND kelas BETWEEN 10 AND 12)
  ),
  CONSTRAINT chk_siswa_pemilik CHECK (
    orang_tua_id IS NOT NULL OR pengguna_id IS NOT NULL
  ),
  CONSTRAINT chk_siswa_sd_wajib_orang_tua CHECK (
    jenjang != 'SD' OR (orang_tua_id IS NOT NULL AND pengguna_id IS NULL)
  )
);

-- 2.3 persetujuan_orang_tua
CREATE TABLE public.persetujuan_orang_tua (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  kedaluwarsa_pada timestamptz NOT NULL,
  status public.status_persetujuan NOT NULL DEFAULT 'menunggu',
  orang_tua_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  diputuskan_pada timestamptz,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_persetujuan_satu_menunggu
  ON public.persetujuan_orang_tua (siswa_id)
  WHERE status = 'menunggu';

-- 2.4 profil_pengajar
CREATE TABLE public.profil_pengajar (
  pengguna_id uuid PRIMARY KEY REFERENCES public.pengguna(id) ON DELETE CASCADE,
  status_kerja public.status_kerja_pengajar,
  kampus text,
  jurusan text,
  keahlian public.bidang_it[] NOT NULL DEFAULT '{}',
  cv_url text,
  foto_path text,
  identitas_path text,
  skck_path text,
  wawancara_selesai boolean NOT NULL DEFAULT false,
  alasan_penolakan text,
  diverifikasi_pada timestamptz,
  diverifikasi_oleh uuid REFERENCES public.pengguna(id) ON DELETE SET NULL
);

-- 2.5 program
CREATE TABLE public.program (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nama text NOT NULL CHECK (char_length(btrim(nama)) > 0),
  jenjang public.jenjang_pendidikan[] NOT NULL CHECK (cardinality(jenjang) > 0),
  kelas_min integer NOT NULL CHECK (kelas_min BETWEEN 1 AND 12),
  kelas_maks integer NOT NULL CHECK (kelas_maks >= kelas_min AND kelas_maks <= 12),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  deskripsi text NOT NULL,
  durasi_menit integer NOT NULL CHECK (durasi_menit > 0),
  jumlah_sesi integer NOT NULL DEFAULT 4 CHECK (jumlah_sesi = 4),
  harga_paket integer NOT NULL CHECK (harga_paket >= 0),
  honor_per_sesi integer NOT NULL CHECK (honor_per_sesi >= 0),
  aktif boolean NOT NULL DEFAULT true
);

-- 2.6 pengajar_program
CREATE TABLE public.pengajar_program (
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.program(id) ON DELETE CASCADE,
  disetujui boolean NOT NULL DEFAULT false,
  PRIMARY KEY (pengajar_id, program_id)
);

-- 2.7 kelas
CREATE TABLE public.kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.program(id) ON DELETE RESTRICT,
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  kapasitas integer NOT NULL CHECK (kapasitas BETWEEN 1 AND 15),
  jam_mulai time NOT NULL,
  status public.status_kelas NOT NULL DEFAULT 'terbuka',
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2.8 sesi
CREATE TABLE public.sesi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  nomor integer NOT NULL CHECK (nomor BETWEEN 1 AND 4),
  mulai_pada timestamptz NOT NULL,
  selesai_pada timestamptz NOT NULL,
  status public.status_sesi NOT NULL DEFAULT 'terjadwal',
  meet_space text,
  meet_uri text,
  meet_dibuat_pada timestamptz,
  meet_gagal_terakhir text,
  CONSTRAINT chk_sesi_waktu CHECK (selesai_pada > mulai_pada),
  CONSTRAINT uq_sesi_kelas_nomor UNIQUE (kelas_id, nomor)
);

-- 2.9 booking
CREATE TABLE public.booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text NOT NULL UNIQUE,
  kelas_id uuid NOT NULL REFERENCES public.kelas(id) ON DELETE RESTRICT,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE RESTRICT,
  dibuat_oleh uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  status public.status_booking NOT NULL DEFAULT 'menunggu_pembayaran',
  total integer NOT NULL CHECK (total >= 0),
  batas_bayar_pada timestamptz NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_booking_unik_aktif
  ON public.booking (kelas_id, siswa_id)
  WHERE status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'terkonfirmasi');

-- 2.10 pembayaran
CREATE TABLE public.pembayaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.booking(id) ON DELETE CASCADE,
  bukti_path text NOT NULL,
  diunggah_pada timestamptz NOT NULL DEFAULT now(),
  status public.status_pembayaran NOT NULL DEFAULT 'menunggu',
  alasan_penolakan text,
  diverifikasi_oleh uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  diverifikasi_pada timestamptz
);

-- 2.11 playbook
CREATE TABLE public.playbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.program(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  nomor_sesi integer NOT NULL CHECK (nomor_sesi BETWEEN 1 AND 4),
  judul text NOT NULL,
  konten_md text NOT NULL,
  starter_url text,
  CONSTRAINT uq_playbook_program_level_sesi UNIQUE (program_id, level, nomor_sesi)
);

-- 2.12 laporan_sesi
CREATE TABLE public.laporan_sesi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL UNIQUE REFERENCES public.sesi(id) ON DELETE CASCADE,
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  ringkasan text NOT NULL CHECK (char_length(btrim(ringkasan)) > 0 AND char_length(ringkasan) <= 500),
  rekaman_url text,
  kendala text,
  dikirim_pada timestamptz NOT NULL DEFAULT now(),
  diubah_pada timestamptz
);

-- 2.13 laporan_siswa
CREATE TABLE public.laporan_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_sesi_id uuid NOT NULL REFERENCES public.laporan_sesi(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  hadir boolean NOT NULL,
  catatan text CHECK (catatan IS NULL OR char_length(catatan) <= 300),
  karya_url text,
  CONSTRAINT chk_laporan_siswa_hadir_catatan CHECK (
    NOT hadir OR (catatan IS NOT NULL AND char_length(btrim(catatan)) > 0)
  ),
  CONSTRAINT uq_laporan_siswa_unik UNIQUE (laporan_sesi_id, siswa_id)
);

-- 2.14 soal_minat
CREATE TABLE public.soal_minat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  urutan integer NOT NULL UNIQUE CHECK (urutan BETWEEN 1 AND 12),
  teks text NOT NULL,
  opsi jsonb NOT NULL
);

-- 2.15 hasil_minat
CREATE TABLE public.hasil_minat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  dikerjakan_oleh uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  jawaban jsonb NOT NULL,
  skor jsonb NOT NULL,
  bidang_teratas public.bidang_it NOT NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2.16 rapor_jurusan
CREATE TABLE public.rapor_jurusan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES public.sesi(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  skor_software integer NOT NULL CHECK (skor_software BETWEEN 1 AND 5),
  skor_jaringan integer NOT NULL CHECK (skor_jaringan BETWEEN 1 AND 5),
  skor_iot integer NOT NULL CHECK (skor_iot BETWEEN 1 AND 5),
  skor_ai_data integer NOT NULL CHECK (skor_ai_data BETWEEN 1 AND 5),
  bidang_rekomendasi public.bidang_it NOT NULL,
  alasan text NOT NULL CHECK (char_length(btrim(alasan)) > 0 AND char_length(alasan) <= 1000),
  saran text NOT NULL CHECK (char_length(btrim(saran)) > 0 AND char_length(saran) <= 500),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_rapor_sesi_siswa UNIQUE (sesi_id, siswa_id)
);

-- 2.17 rating
CREATE TABLE public.rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL REFERENCES public.sesi(id) ON DELETE CASCADE,
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  pemberi_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  bintang integer NOT NULL CHECK (bintang BETWEEN 1 AND 5),
  komentar text CHECK (komentar IS NULL OR char_length(komentar) <= 300),
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_rating_sesi_siswa UNIQUE (sesi_id, siswa_id)
);

-- 2.18 laporan_masalah
CREATE TABLE public.laporan_masalah (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pelapor_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  sesi_id uuid REFERENCES public.sesi(id) ON DELETE SET NULL,
  pengajar_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  kategori public.kategori_masalah NOT NULL,
  deskripsi text NOT NULL CHECK (char_length(btrim(deskripsi)) > 0),
  prioritas public.prioritas_masalah NOT NULL DEFAULT 'normal',
  status public.status_masalah NOT NULL DEFAULT 'baru',
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2.19 honor
CREATE TABLE public.honor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  sesi_id uuid NOT NULL UNIQUE REFERENCES public.sesi(id) ON DELETE RESTRICT,
  jumlah integer NOT NULL CHECK (jumlah >= 0),
  status public.status_honor NOT NULL DEFAULT 'belum_dibayar',
  dibayar_pada timestamptz,
  dibayar_oleh uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2.20 notifikasi
CREATE TABLE public.notifikasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  tipe public.tipe_notifikasi NOT NULL,
  judul text NOT NULL,
  isi text NOT NULL,
  tautan text,
  dibaca_pada timestamptz,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- 2.21 pengaturan
CREATE TABLE public.pengaturan (
  kunci text PRIMARY KEY,
  nilai text NOT NULL
);

-- 2.22 log_admin
CREATE TABLE public.log_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE RESTRICT,
  aksi text NOT NULL,
  target_tipe text NOT NULL,
  target_id text NOT NULL,
  detail jsonb,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX idx_pengguna_peran_status ON public.pengguna (peran, status);
CREATE INDEX idx_siswa_orang_tua ON public.siswa (orang_tua_id);
CREATE INDEX idx_siswa_pengguna ON public.siswa (pengguna_id);
CREATE INDEX idx_persetujuan_kedaluwarsa ON public.persetujuan_orang_tua (status, kedaluwarsa_pada);
CREATE INDEX idx_kelas_program_status ON public.kelas (program_id, status);
CREATE INDEX idx_kelas_pengajar ON public.kelas (pengajar_id);
CREATE INDEX idx_sesi_kelas_nomor ON public.sesi (kelas_id, nomor);
CREATE INDEX idx_sesi_mulai_status ON public.sesi (mulai_pada, status);
CREATE INDEX idx_sesi_tanpa_meet ON public.sesi (status) WHERE meet_uri IS NULL;
CREATE INDEX idx_booking_kelas_status ON public.booking (kelas_id, status);
CREATE INDEX idx_booking_siswa ON public.booking (siswa_id);
CREATE INDEX idx_booking_dibuat_oleh ON public.booking (dibuat_oleh);
CREATE INDEX idx_booking_batas_bayar ON public.booking (status, batas_bayar_pada);
CREATE INDEX idx_pembayaran_booking_status ON public.pembayaran (booking_id, status, diunggah_pada DESC);
CREATE INDEX idx_laporan_sesi_pengajar ON public.laporan_sesi (pengajar_id);
CREATE INDEX idx_laporan_siswa_siswa ON public.laporan_siswa (siswa_id);
CREATE INDEX idx_hasil_minat_siswa_waktu ON public.hasil_minat (siswa_id, dibuat_pada DESC);
CREATE INDEX idx_rapor_jurusan_siswa ON public.rapor_jurusan (siswa_id);
CREATE INDEX idx_rating_sesi ON public.rating (sesi_id);
CREATE INDEX idx_laporan_masalah_antrean ON public.laporan_masalah (status, prioritas DESC, dibuat_pada ASC);
CREATE INDEX idx_honor_pengajar_status ON public.honor (pengajar_id, status);
CREATE INDEX idx_notifikasi_pengguna_waktu ON public.notifikasi (pengguna_id, dibuat_pada DESC);
CREATE INDEX idx_log_admin_waktu ON public.log_admin (dibuat_pada DESC);

-- ----------------------------------------------------------------------------
-- 4. INTEGRITY TRIGGERS (Kapasitas kelas & Cegah hapus siswa berbooking aktif)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cek_kapasitas_kelas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_jenjang public.jenjang_pendidikan[];
  v_maks integer;
BEGIN
  SELECT p.jenjang INTO v_jenjang
  FROM public.program p
  WHERE p.id = NEW.program_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL' USING DETAIL = 'Program tidak ditemukan';
  END IF;

  IF 'SD'::public.jenjang_pendidikan = ANY(v_jenjang) THEN
    v_maks := 10;
  ELSE
    v_maks := 15;
  END IF;

  IF NEW.kapasitas < 1 OR NEW.kapasitas > v_maks THEN
    RAISE EXCEPTION 'KAPASITAS_TIDAK_VALID';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cek_kapasitas_kelas
  BEFORE INSERT OR UPDATE OF kapasitas, program_id ON public.kelas
  FOR EACH ROW
  EXECUTE FUNCTION public.cek_kapasitas_kelas();

CREATE OR REPLACE FUNCTION public.cegah_hapus_siswa_booking_aktif()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.siswa_id = OLD.id
      AND b.status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'terkonfirmasi')
  ) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL'
      USING DETAIL = 'Profil anak tidak dapat dihapus karena masih memiliki booking aktif';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_cegah_hapus_siswa_booking_aktif
  BEFORE DELETE ON public.siswa
  FOR EACH ROW
  EXECUTE FUNCTION public.cegah_hapus_siswa_booking_aktif();
