-- ============================================================================
-- Migration 8: Schema, Table, View & Sequence Privileges untuk PostgREST
-- Memastikan service_role, authenticated, dan anon memiliki hak dasar Postgres
-- sesuai matriks akses (RLS pada Migration 2 tetap menegakkan akses per baris).
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Service role penuh untuk skrip Admin API, cron, dan Edge Function
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Hak akses view untuk anon dan authenticated
GRANT SELECT ON public.kelas_katalog TO anon, authenticated;
GRANT SELECT ON public.pengajar_publik TO anon, authenticated;
GRANT SELECT ON public.soal_minat_publik TO anon, authenticated;
GRANT SELECT ON public.sesi_saya TO authenticated;
GRANT SELECT ON public.laporan_saya TO authenticated;
GRANT SELECT ON public.rapor_saya TO authenticated;
GRANT SELECT ON public.admin_ringkasan TO authenticated;

-- Hak akses tabel publik untuk anon (RLS tetap menyaring baris aktif)
GRANT SELECT ON public.program TO anon;
GRANT SELECT ON public.kelas TO anon;

-- Hak akses tabel untuk authenticated (RLS pada Migration 2 mengontrol baris per peran)
GRANT SELECT ON
  public.pengguna,
  public.siswa,
  public.persetujuan_orang_tua,
  public.profil_pengajar,
  public.program,
  public.pengajar_program,
  public.kelas,
  public.sesi,
  public.booking,
  public.pembayaran,
  public.playbook,
  public.laporan_sesi,
  public.laporan_siswa,
  public.soal_minat,
  public.hasil_minat,
  public.rapor_jurusan,
  public.rating,
  public.laporan_masalah,
  public.honor,
  public.notifikasi,
  public.pengaturan,
  public.log_admin
TO authenticated;

GRANT INSERT ON
  public.siswa,
  public.pengajar_program,
  public.laporan_masalah,
  public.program,
  public.kelas,
  public.sesi,
  public.playbook,
  public.soal_minat,
  public.pengaturan
TO authenticated;

GRANT UPDATE ON
  public.pengguna,
  public.siswa,
  public.profil_pengajar,
  public.notifikasi,
  public.program,
  public.pengajar_program,
  public.kelas,
  public.sesi,
  public.playbook,
  public.soal_minat,
  public.laporan_masalah,
  public.pengaturan
TO authenticated;

GRANT DELETE ON
  public.siswa,
  public.pengajar_program,
  public.program,
  public.kelas,
  public.sesi,
  public.playbook,
  public.soal_minat,
  public.pengaturan
TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Default privileges untuk objek baru di masa depan
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO postgres, service_role;
