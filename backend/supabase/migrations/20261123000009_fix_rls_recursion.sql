-- ============================================================================
-- Migration 9: Menghilangkan rekursi silang RLS antar tabel (booking <-> kelas <-> siswa)
-- Menggunakan fungsi helper SECURITY DEFINER STABLE set search_path = ''
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adalah_kelas_pengajar_saya(p_kelas_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kelas k
    WHERE k.id = p_kelas_id
      AND k.pengajar_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.adalah_sesi_pengajar_saya(p_sesi_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sesi s
    JOIN public.kelas k ON k.id = s.kelas_id
    WHERE s.id = p_sesi_id
      AND k.pengajar_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.adalah_peserta_kelas_saya(p_siswa_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking b
    JOIN public.kelas k ON k.id = b.kelas_id
    WHERE b.siswa_id = p_siswa_id
      AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
      AND k.pengajar_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.punya_booking_di_kelas(p_kelas_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = p_kelas_id
      AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.adalah_booking_saya(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.id = p_booking_id
      AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
  );
$$;

REVOKE ALL ON FUNCTION public.adalah_kelas_pengajar_saya(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adalah_sesi_pengajar_saya(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adalah_peserta_kelas_saya(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.punya_booking_di_kelas(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adalah_booking_saya(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.adalah_kelas_pengajar_saya(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adalah_sesi_pengajar_saya(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adalah_peserta_kelas_saya(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.punya_booking_di_kelas(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adalah_booking_saya(uuid) TO anon, authenticated;

-- Perbarui policy yang berpotensi saling memanggil
DROP POLICY IF EXISTS "siswa_select" ON public.siswa;
CREATE POLICY "siswa_select"
  ON public.siswa FOR SELECT
  TO authenticated
  USING (
    orang_tua_id = auth.uid()
    OR pengguna_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR (
      public.peran_saya() = 'pengajar'::public.peran_pengguna
      AND public.adalah_peserta_kelas_saya(id)
    )
  );

DROP POLICY IF EXISTS "persetujuan_select" ON public.persetujuan_orang_tua;
CREATE POLICY "persetujuan_select"
  ON public.persetujuan_orang_tua FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'::public.peran_pengguna
    OR orang_tua_id = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
  );

DROP POLICY IF EXISTS "kelas_select" ON public.kelas;
CREATE POLICY "kelas_select"
  ON public.kelas FOR SELECT
  TO anon, authenticated
  USING (
    status != 'disembunyikan'::public.status_kelas
    OR pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR public.punya_booking_di_kelas(id)
  );

DROP POLICY IF EXISTS "booking_select" ON public.booking;
CREATE POLICY "booking_select"
  ON public.booking FOR SELECT
  TO authenticated
  USING (
    dibuat_oleh = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR (
      public.peran_saya() = 'pengajar'::public.peran_pengguna
      AND status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
      AND public.adalah_kelas_pengajar_saya(kelas_id)
    )
  );

DROP POLICY IF EXISTS "pembayaran_select" ON public.pembayaran;
CREATE POLICY "pembayaran_select"
  ON public.pembayaran FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'::public.peran_pengguna
    OR public.adalah_booking_saya(booking_id)
  );

DROP POLICY IF EXISTS "rapor_jurusan_select" ON public.rapor_jurusan;
CREATE POLICY "rapor_jurusan_select"
  ON public.rapor_jurusan FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'::public.peran_pengguna
    OR public.adalah_siswa_saya(siswa_id)
    OR public.adalah_sesi_pengajar_saya(sesi_id)
  );

DROP POLICY IF EXISTS "rating_select" ON public.rating;
CREATE POLICY "rating_select"
  ON public.rating FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'::public.peran_pengguna
    OR pemberi_id = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
    OR public.adalah_sesi_pengajar_saya(sesi_id)
  );
