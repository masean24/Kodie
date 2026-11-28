-- ============================================================================
-- Migration 15: Perbaiki RLS SELECT pengalaman_pengajar & sertifikat_pengajar
--   Gunakan helper SECURITY DEFINER `adalah_pengajar_terverifikasi(uuid)`
--   agar anon dan pengguna login dapat membaca detail profil pengajar yang
--   terverifikasi tanpa memerlukan hak SELECT langsung pada `public.pengguna`.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.adalah_pengajar_terverifikasi(p_pengajar_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pengguna u
    WHERE u.id = p_pengajar_id
      AND u.peran = 'pengajar'::public.peran_pengguna
      AND u.status = 'terverifikasi'::public.status_pengguna
  );
$$;

REVOKE ALL ON FUNCTION public.adalah_pengajar_terverifikasi(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adalah_pengajar_terverifikasi(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "pengalaman_pengajar_select" ON public.pengalaman_pengajar;
CREATE POLICY "pengalaman_pengajar_select"
  ON public.pengalaman_pengajar FOR SELECT
  TO anon, authenticated
  USING (
    pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR public.adalah_pengajar_terverifikasi(pengajar_id)
  );

DROP POLICY IF EXISTS "sertifikat_pengajar_select" ON public.sertifikat_pengajar;
CREATE POLICY "sertifikat_pengajar_select"
  ON public.sertifikat_pengajar FOR SELECT
  TO anon, authenticated
  USING (
    pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR public.adalah_pengajar_terverifikasi(pengajar_id)
  );
