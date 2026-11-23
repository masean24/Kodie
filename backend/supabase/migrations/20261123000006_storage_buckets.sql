-- ============================================================================
-- Migration 6: Storage Buckets & Policies
-- Sumber kebenaran: docs/PRD.md Bagian 9 ("Unggah file")
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'bukti-bayar',
    'bukti-bayar',
    false,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'foto-pengajar',
    'foto-pengajar',
    true,
    1048576,
    ARRAY['image/jpeg', 'image/png']
  ),
  (
    'dokumen-pengajar',
    'dokumen-pengajar',
    false,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  ),
  (
    'pengaturan',
    'pengaturan',
    false,
    1048576,
    ARRAY['image/jpeg', 'image/png']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- POLICIES FOR storage.objects
-- ----------------------------------------------------------------------------

-- 1. bukti-bayar (privat): {booking_id}/{uuid}.{ext}
--    Akses: Pembuat booking, orang tua siswa, admin
CREATE POLICY "bukti_bayar_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bukti-bayar'
    AND (
      public.peran_saya() = 'admin'::public.peran_pengguna
      OR EXISTS (
        SELECT 1
        FROM public.booking b
        WHERE b.id::text = (storage.foldername(name))[1]
          AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
      )
    )
  );

CREATE POLICY "bukti_bayar_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bukti-bayar'
    AND public.peran_saya() IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna)
    AND EXISTS (
      SELECT 1
      FROM public.booking b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND (b.dibuat_oleh = auth.uid() OR public.adalah_siswa_saya(b.siswa_id))
    )
  );

-- 2. foto-pengajar (publik, ditampilkan hanya untuk pengajar terverifikasi): {auth.uid()}/{uuid}.{ext}
CREATE POLICY "foto_pengajar_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'foto-pengajar'
    AND (
      public.peran_saya() = 'admin'::public.peran_pengguna
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.pengguna u
        WHERE u.id::text = (storage.foldername(name))[1]
          AND u.peran = 'pengajar'::public.peran_pengguna
          AND u.status = 'terverifikasi'::public.status_pengguna
      )
    )
  );

CREATE POLICY "foto_pengajar_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'foto-pengajar'
    AND public.peran_saya() = 'pengajar'::public.peran_pengguna
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "foto_pengajar_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'foto-pengajar'
    AND public.peran_saya() = 'pengajar'::public.peran_pengguna
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. dokumen-pengajar (privat): {auth.uid()}/{uuid}.{ext}
--    Akses: Pengajar pemilik untuk unggah, admin untuk melihat
CREATE POLICY "dokumen_pengajar_select_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dokumen-pengajar'
    AND public.peran_saya() = 'admin'::public.peran_pengguna
  );

CREATE POLICY "dokumen_pengajar_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dokumen-pengajar'
    AND public.peran_saya() = 'pengajar'::public.peran_pengguna
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "dokumen_pengajar_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dokumen-pengajar'
    AND public.peran_saya() = 'pengajar'::public.peran_pengguna
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. pengaturan (privat, gambar QRIS): Pengguna login lewat signed URL, admin untuk unggah
CREATE POLICY "pengaturan_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pengaturan');

CREATE POLICY "pengaturan_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pengaturan'
    AND public.peran_saya() = 'admin'::public.peran_pengguna
  );

CREATE POLICY "pengaturan_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pengaturan'
    AND public.peran_saya() = 'admin'::public.peran_pengguna
  );

CREATE POLICY "pengaturan_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pengaturan'
    AND public.peran_saya() = 'admin'::public.peran_pengguna
  );
