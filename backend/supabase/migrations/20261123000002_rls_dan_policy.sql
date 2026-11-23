-- ============================================================================
-- Migration 2: Helper peran_saya(), aktifkan RLS di SEMUA tabel, dan Policy
-- Sumber kebenaran: docs/PRD.md Bagian 3, 7, 8, 10
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS (SECURITY DEFINER + STABLE + search_path = '')
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.peran_saya()
RETURNS public.peran_pengguna
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.peran
  FROM public.pengguna p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.status_saya()
RETURNS public.status_pengguna
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.status
  FROM public.pengguna p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.adalah_siswa_saya(p_siswa_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.siswa s
    WHERE s.id = p_siswa_id
      AND (s.pengguna_id = auth.uid() OR s.orang_tua_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.peran_saya() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.status_saya() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adalah_siswa_saya(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.peran_saya() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.status_saya() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.adalah_siswa_saya(uuid) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. ENABLE RLS ON ALL 22 TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persetujuan_orang_tua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profil_pengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengajar_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal_minat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_minat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapor_jurusan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rating ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laporan_masalah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_admin ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. FIELD PROTECTION TRIGGERS FOR DIRECT TABLE UPDATES
-- ----------------------------------------------------------------------------

-- Mencegah pengguna biasa mengubah peran atau status dirinya sendiri lewat UPDATE pengguna
CREATE OR REPLACE FUNCTION public.jaga_kolom_pengguna()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    IF NEW.peran IS DISTINCT FROM OLD.peran OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_jaga_kolom_pengguna
  BEFORE UPDATE ON public.pengguna
  FOR EACH ROW
  EXECUTE FUNCTION public.jaga_kolom_pengguna();

-- Mencegah pengajar memodifikasi kolom verifikasi admin pada profil_pengajar
CREATE OR REPLACE FUNCTION public.jaga_kolom_profil_pengajar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    IF NEW.wawancara_selesai IS DISTINCT FROM OLD.wawancara_selesai
       OR NEW.alasan_penolakan IS DISTINCT FROM OLD.alasan_penolakan
       OR NEW.diverifikasi_pada IS DISTINCT FROM OLD.diverifikasi_pada
       OR NEW.diverifikasi_oleh IS DISTINCT FROM OLD.diverifikasi_oleh THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_jaga_kolom_profil_pengajar
  BEFORE UPDATE ON public.profil_pengajar
  FOR EACH ROW
  EXECUTE FUNCTION public.jaga_kolom_profil_pengajar();

-- Mencegah perubahan kolom notifikasi selain dibaca_pada oleh pemilik
CREATE OR REPLACE FUNCTION public.jaga_kolom_notifikasi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    IF NEW.pengguna_id IS DISTINCT FROM OLD.pengguna_id
       OR NEW.tipe IS DISTINCT FROM OLD.tipe
       OR NEW.judul IS DISTINCT FROM OLD.judul
       OR NEW.isi IS DISTINCT FROM OLD.isi
       OR NEW.tautan IS DISTINCT FROM OLD.tautan
       OR NEW.dibuat_pada IS DISTINCT FROM OLD.dibuat_pada THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_jaga_kolom_notifikasi
  BEFORE UPDATE ON public.notifikasi
  FOR EACH ROW
  EXECUTE FUNCTION public.jaga_kolom_notifikasi();

-- ----------------------------------------------------------------------------
-- 4. POLICIES PER TABLE
-- ----------------------------------------------------------------------------

-- 4.1 pengguna
CREATE POLICY "pengguna_select"
  ON public.pengguna FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.peran_saya() = 'admin');

CREATE POLICY "pengguna_update_sendiri"
  ON public.pengguna FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4.2 siswa
CREATE POLICY "siswa_select"
  ON public.siswa FOR SELECT
  TO authenticated
  USING (
    orang_tua_id = auth.uid()
    OR pengguna_id = auth.uid()
    OR public.peran_saya() = 'admin'
    OR (
      public.peran_saya() = 'pengajar'
      AND EXISTS (
        SELECT 1
        FROM public.booking b
        JOIN public.kelas k ON k.id = b.kelas_id
        WHERE b.siswa_id = siswa.id
          AND b.status IN ('terkonfirmasi', 'selesai')
          AND k.pengajar_id = auth.uid()
      )
    )
  );

CREATE POLICY "siswa_insert_ortu"
  ON public.siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    public.peran_saya() = 'orang_tua'
    AND public.status_saya() = 'aktif'
    AND orang_tua_id = auth.uid()
    AND pengguna_id IS NULL
  );

CREATE POLICY "siswa_update_ortu"
  ON public.siswa FOR UPDATE
  TO authenticated
  USING (
    (public.peran_saya() = 'orang_tua' AND orang_tua_id = auth.uid())
    OR public.peran_saya() = 'admin'
  )
  WITH CHECK (
    (public.peran_saya() = 'orang_tua' AND orang_tua_id = auth.uid())
    OR public.peran_saya() = 'admin'
  );

CREATE POLICY "siswa_delete_ortu"
  ON public.siswa FOR DELETE
  TO authenticated
  USING (public.peran_saya() = 'orang_tua' AND orang_tua_id = auth.uid());

-- 4.3 persetujuan_orang_tua (hanya baca oleh siswa pemilik, ortu terkait, atau admin; mutasi via RPC)
CREATE POLICY "persetujuan_select"
  ON public.persetujuan_orang_tua FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR orang_tua_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.siswa s
      WHERE s.id = persetujuan_orang_tua.siswa_id
        AND s.pengguna_id = auth.uid()
    )
  );

-- 4.4 profil_pengajar (publik memakai view pengajar_publik agar dokumen sensitif terlindungi)
CREATE POLICY "profil_pengajar_select"
  ON public.profil_pengajar FOR SELECT
  TO authenticated
  USING (pengguna_id = auth.uid() OR public.peran_saya() = 'admin');

CREATE POLICY "profil_pengajar_update"
  ON public.profil_pengajar FOR UPDATE
  TO authenticated
  USING (
    (pengguna_id = auth.uid() AND public.peran_saya() = 'pengajar')
    OR public.peran_saya() = 'admin'
  )
  WITH CHECK (
    (pengguna_id = auth.uid() AND public.peran_saya() = 'pengajar')
    OR public.peran_saya() = 'admin'
  );

-- 4.5 program
CREATE POLICY "program_select"
  ON public.program FOR SELECT
  TO anon, authenticated
  USING (aktif = true OR public.peran_saya() = 'admin');

CREATE POLICY "program_admin_insert"
  ON public.program FOR INSERT
  TO authenticated
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "program_admin_update"
  ON public.program FOR UPDATE
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "program_admin_delete"
  ON public.program FOR DELETE
  TO authenticated
  USING (public.peran_saya() = 'admin');

-- 4.6 pengajar_program
CREATE POLICY "pengajar_program_select"
  ON public.pengajar_program FOR SELECT
  TO authenticated
  USING (pengajar_id = auth.uid() OR public.peran_saya() = 'admin');

CREATE POLICY "pengajar_program_insert_pengajar"
  ON public.pengajar_program FOR INSERT
  TO authenticated
  WITH CHECK (
    (pengajar_id = auth.uid() AND public.peran_saya() = 'pengajar' AND disetujui = false)
    OR public.peran_saya() = 'admin'
  );

CREATE POLICY "pengajar_program_delete_pengajar"
  ON public.pengajar_program FOR DELETE
  TO authenticated
  USING (
    (pengajar_id = auth.uid() AND public.peran_saya() = 'pengajar' AND disetujui = false)
    OR public.peran_saya() = 'admin'
  );

CREATE POLICY "pengajar_program_update_admin"
  ON public.pengajar_program FOR UPDATE
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

-- 4.7 kelas
CREATE POLICY "kelas_select"
  ON public.kelas FOR SELECT
  TO anon, authenticated
  USING (
    status != 'disembunyikan'
    OR pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.booking b
      WHERE b.kelas_id = kelas.id
        AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
    )
  );

CREATE POLICY "kelas_admin_insert"
  ON public.kelas FOR INSERT
  TO authenticated
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "kelas_admin_update"
  ON public.kelas FOR UPDATE
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "kelas_admin_delete"
  ON public.kelas FOR DELETE
  TO authenticated
  USING (public.peran_saya() = 'admin');

-- 4.8 sesi (akses langsung hanya admin agar meet_uri tidak terbaca; non-admin memakai view sesi_saya & RPC link_masuk_sesi)
CREATE POLICY "sesi_select_admin"
  ON public.sesi FOR SELECT
  TO authenticated
  USING (public.peran_saya() = 'admin');

CREATE POLICY "sesi_admin_insert"
  ON public.sesi FOR INSERT
  TO authenticated
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "sesi_admin_update"
  ON public.sesi FOR UPDATE
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

CREATE POLICY "sesi_admin_delete"
  ON public.sesi FOR DELETE
  TO authenticated
  USING (public.peran_saya() = 'admin');

-- 4.9 booking (mutasi via RPC buat_booking, batalkan_booking, kirim_bukti_bayar, admin_*)
CREATE POLICY "booking_select"
  ON public.booking FOR SELECT
  TO authenticated
  USING (
    dibuat_oleh = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
    OR public.peran_saya() = 'admin'
    OR (
      public.peran_saya() = 'pengajar'
      AND status IN ('terkonfirmasi', 'selesai')
      AND EXISTS (
        SELECT 1 FROM public.kelas k
        WHERE k.id = booking.kelas_id AND k.pengajar_id = auth.uid()
      )
    )
  );

-- 4.10 pembayaran
CREATE POLICY "pembayaran_select"
  ON public.pembayaran FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.booking b
      WHERE b.id = pembayaran.booking_id
        AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
    )
  );

-- 4.11 playbook (hanya admin langsung; pengajar lewat RPC playbook_sesi agar aturan H-1 & kepemilikan terjaga)
CREATE POLICY "playbook_admin_all"
  ON public.playbook FOR ALL
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

-- 4.12 laporan_sesi (siswa & ortu memakai view laporan_saya agar rekaman_url tersembunyi)
CREATE POLICY "laporan_sesi_select"
  ON public.laporan_sesi FOR SELECT
  TO authenticated
  USING (pengajar_id = auth.uid() OR public.peran_saya() = 'admin');

-- 4.13 laporan_siswa
CREATE POLICY "laporan_siswa_select"
  ON public.laporan_siswa FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR public.adalah_siswa_saya(siswa_id)
    OR EXISTS (
      SELECT 1 FROM public.laporan_sesi ls
      WHERE ls.id = laporan_siswa.laporan_sesi_id
        AND ls.pengajar_id = auth.uid()
    )
  );

-- 4.14 soal_minat (publik membaca view soal_minat_publik tanpa bobot)
CREATE POLICY "soal_minat_admin_all"
  ON public.soal_minat FOR ALL
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

-- 4.15 hasil_minat
CREATE POLICY "hasil_minat_select"
  ON public.hasil_minat FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR dikerjakan_oleh = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
  );

-- 4.16 rapor_jurusan
CREATE POLICY "rapor_jurusan_select"
  ON public.rapor_jurusan FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR public.adalah_siswa_saya(siswa_id)
    OR EXISTS (
      SELECT 1 FROM public.sesi s
      JOIN public.kelas k ON k.id = s.kelas_id
      WHERE s.id = rapor_jurusan.sesi_id
        AND k.pengajar_id = auth.uid()
    )
  );

-- 4.17 rating
CREATE POLICY "rating_select"
  ON public.rating FOR SELECT
  TO authenticated
  USING (
    public.peran_saya() = 'admin'
    OR pemberi_id = auth.uid()
    OR public.adalah_siswa_saya(siswa_id)
    OR EXISTS (
      SELECT 1 FROM public.sesi s
      JOIN public.kelas k ON k.id = s.kelas_id
      WHERE s.id = rating.sesi_id
        AND k.pengajar_id = auth.uid()
    )
  );

-- 4.18 laporan_masalah
CREATE POLICY "laporan_masalah_select"
  ON public.laporan_masalah FOR SELECT
  TO authenticated
  USING (pelapor_id = auth.uid() OR public.peran_saya() = 'admin');

CREATE POLICY "laporan_masalah_insert"
  ON public.laporan_masalah FOR INSERT
  TO authenticated
  WITH CHECK (
    public.peran_saya() IN ('orang_tua', 'siswa')
    AND pelapor_id = auth.uid()
  );

CREATE POLICY "laporan_masalah_update_admin"
  ON public.laporan_masalah FOR UPDATE
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

-- 4.19 honor
CREATE POLICY "honor_select"
  ON public.honor FOR SELECT
  TO authenticated
  USING (pengajar_id = auth.uid() OR public.peran_saya() = 'admin');

-- 4.20 notifikasi
CREATE POLICY "notifikasi_select"
  ON public.notifikasi FOR SELECT
  TO authenticated
  USING (pengguna_id = auth.uid());

CREATE POLICY "notifikasi_update"
  ON public.notifikasi FOR UPDATE
  TO authenticated
  USING (pengguna_id = auth.uid())
  WITH CHECK (pengguna_id = auth.uid());

-- 4.21 pengaturan
CREATE POLICY "pengaturan_select"
  ON public.pengaturan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pengaturan_admin_all"
  ON public.pengaturan FOR ALL
  TO authenticated
  USING (public.peran_saya() = 'admin')
  WITH CHECK (public.peran_saya() = 'admin');

-- 4.22 log_admin
CREATE POLICY "log_admin_select"
  ON public.log_admin FOR SELECT
  TO authenticated
  USING (public.peran_saya() = 'admin');
