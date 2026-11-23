-- ============================================================================
-- Migration 5: RPC per Fitur (F2-F14), Trigger Notifikasi, Prioritas & Log Admin
-- Sumber kebenaran: docs/PRD.md Bagian 4, 5, 8, 9 & docs/KEPUTUSAN.md
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.seq_kode_booking START 1;

-- ----------------------------------------------------------------------------
-- HELPER INTERNAL: Notifikasi & Kedaluwarsa Booking
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kedaluwarsakan_booking_lewat_batas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    UPDATE public.booking b
    SET status = 'kedaluwarsa'::public.status_booking
    WHERE b.status = 'menunggu_pembayaran'::public.status_booking
      AND b.batas_bayar_pada <= now()
    RETURNING b.id, b.kode, b.dibuat_oleh, b.siswa_id
  LOOP
    v_count := v_count + 1;

    INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
    SELECT DISTINCT
      uid,
      'booking_status'::public.tipe_notifikasi,
      'Booking kedaluwarsa',
      'Booking ' || v_row.kode || ' kedaluwarsa karena melewati batas waktu pembayaran. Kursi telah dilepas.',
      CASE
        WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/booking/' || v_row.id::text
        ELSE '/siswa/booking/' || v_row.id::text
      END
    FROM (
      SELECT v_row.dibuat_oleh AS uid
      UNION
      SELECT s.orang_tua_id FROM public.siswa s WHERE s.id = v_row.siswa_id AND s.orang_tua_id IS NOT NULL
      UNION
      SELECT s.pengguna_id FROM public.siswa s WHERE s.id = v_row.siswa_id AND s.pengguna_id IS NOT NULL
    ) targets
    JOIN public.pengguna u ON u.id = targets.uid;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.kedaluwarsakan_booking_lewat_batas() FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- F2: PERSETUJUAN ORANG TUA
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.buat_link_persetujuan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_siswa_id uuid;
  v_token text;
  v_hash text;
  v_kedaluwarsa timestamptz := now() + interval '7 days';
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'siswa'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT s.id INTO v_siswa_id
  FROM public.siswa s
  WHERE s.pengguna_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF public.status_saya() = 'aktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL' USING DETAIL = 'Akun siswa sudah disetujui dan aktif';
  END IF;

  -- Batalkan token lama yang masih menunggu
  UPDATE public.persetujuan_orang_tua
  SET status = 'kedaluwarsa'::public.status_persetujuan
  WHERE siswa_id = v_siswa_id
    AND status = 'menunggu'::public.status_persetujuan;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.persetujuan_orang_tua (
    siswa_id,
    token_hash,
    kedaluwarsa_pada,
    status
  )
  VALUES (
    v_siswa_id,
    v_hash,
    v_kedaluwarsa,
    'menunggu'::public.status_persetujuan
  );

  RETURN jsonb_build_object(
    'token', v_token,
    'kedaluwarsa_pada', v_kedaluwarsa
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.info_persetujuan(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hash text;
  v_row record;
BEGIN
  IF NULLIF(btrim(p_token), '') IS NULL THEN
    RAISE EXCEPTION 'TOKEN_TIDAK_BERLAKU';
  END IF;

  v_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

  SELECT
    po.id,
    po.status,
    po.kedaluwarsa_pada,
    s.id AS siswa_id,
    s.nama,
    s.jenjang,
    s.kelas,
    s.sekolah
  INTO v_row
  FROM public.persetujuan_orang_tua po
  JOIN public.siswa s ON s.id = po.siswa_id
  WHERE po.token_hash = v_hash;

  IF NOT FOUND OR v_row.status != 'menunggu'::public.status_persetujuan OR v_row.kedaluwarsa_pada <= now() THEN
    RAISE EXCEPTION 'TOKEN_TIDAK_BERLAKU';
  END IF;

  RETURN jsonb_build_object(
    'siswa_id', v_row.siswa_id,
    'nama', v_row.nama,
    'jenjang', v_row.jenjang,
    'kelas', v_row.kelas,
    'sekolah', v_row.sekolah,
    'kedaluwarsa_pada', v_row.kedaluwarsa_pada
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.putuskan_persetujuan(p_token text, p_keputusan text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hash text;
  v_po record;
  v_siswa record;
  v_status_baru public.status_persetujuan;
BEGIN
  IF p_keputusan NOT IN ('setujui', 'tolak') THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NULLIF(btrim(p_token), '') IS NULL THEN
    RAISE EXCEPTION 'TOKEN_TIDAK_BERLAKU';
  END IF;

  v_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

  SELECT * INTO v_po
  FROM public.persetujuan_orang_tua po
  WHERE po.token_hash = v_hash
  FOR UPDATE;

  IF NOT FOUND OR v_po.status != 'menunggu'::public.status_persetujuan OR v_po.kedaluwarsa_pada <= now() THEN
    IF FOUND AND v_po.status = 'menunggu'::public.status_persetujuan AND v_po.kedaluwarsa_pada <= now() THEN
      UPDATE public.persetujuan_orang_tua
      SET status = 'kedaluwarsa'::public.status_persetujuan
      WHERE id = v_po.id;
    END IF;
    RAISE EXCEPTION 'TOKEN_TIDAK_BERLAKU';
  END IF;

  SELECT * INTO v_siswa
  FROM public.siswa s
  WHERE s.id = v_po.siswa_id
  FOR UPDATE;

  IF p_keputusan = 'setujui' THEN
    IF auth.uid() IS NULL
       OR public.peran_saya() IS DISTINCT FROM 'orang_tua'::public.peran_pengguna
       OR public.status_saya() IS DISTINCT FROM 'aktif'::public.status_pengguna THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;

    v_status_baru := 'disetujui'::public.status_persetujuan;

    UPDATE public.persetujuan_orang_tua
    SET
      status = v_status_baru,
      orang_tua_id = auth.uid(),
      diputuskan_pada = now()
    WHERE id = v_po.id;

    UPDATE public.siswa
    SET orang_tua_id = auth.uid()
    WHERE id = v_siswa.id;

    IF v_siswa.pengguna_id IS NOT NULL THEN
      UPDATE public.pengguna
      SET status = 'aktif'::public.status_pengguna
      WHERE id = v_siswa.pengguna_id;

      INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
      VALUES (
        v_siswa.pengguna_id,
        'persetujuan_diputuskan'::public.tipe_notifikasi,
        'Akun disetujui orang tua',
        'Orang tua Anda telah menyetujui pendaftaran. Akun Anda kini aktif dan dapat memesan kelas.',
        '/siswa'
      );
    END IF;
  ELSE
    v_status_baru := 'ditolak'::public.status_persetujuan;

    UPDATE public.persetujuan_orang_tua
    SET
      status = v_status_baru,
      orang_tua_id = auth.uid(),
      diputuskan_pada = now()
    WHERE id = v_po.id;

    IF v_siswa.pengguna_id IS NOT NULL THEN
      UPDATE public.pengguna
      SET status = 'ditolak_orang_tua'::public.status_pengguna
      WHERE id = v_siswa.pengguna_id;

      INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
      VALUES (
        v_siswa.pengguna_id,
        'persetujuan_diputuskan'::public.tipe_notifikasi,
        'Persetujuan orang tua ditolak',
        'Permintaan persetujuan akun ditolak oleh orang tua atau wali.',
        '/siswa/persetujuan'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status_baru,
    'siswa_id', v_siswa.id,
    'diputuskan_pada', now()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- F4: TES MINAT JURUSAN IT
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hitung_tes_minat(
  p_jawaban jsonb,
  p_siswa_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_soal record;
  v_kode_jawaban text;
  v_opsi jsonb;
  v_soft integer := 0;
  v_jar integer := 0;
  v_iot integer := 0;
  v_ai integer := 0;
  v_total integer := 0;
  v_pct_soft integer := 0;
  v_pct_jar integer := 0;
  v_pct_iot integer := 0;
  v_pct_ai integer := 0;
  v_bidang public.bidang_it;
  v_skor_json jsonb;
  v_jurusan jsonb;
  v_program jsonb := '["Simulasi Jurusan IT", "Kelas Reguler Teknologi"]'::jsonb;
  v_siswa record;
  v_tersimpan boolean := false;
  v_hasil_id uuid := NULL;
BEGIN
  IF p_jawaban IS NULL OR jsonb_typeof(p_jawaban) NOT IN ('object', 'array') THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  FOR v_soal IN
    SELECT sm.id, sm.urutan, sm.opsi
    FROM public.soal_minat sm
    ORDER BY sm.urutan ASC
  LOOP
    v_kode_jawaban := NULL;

    IF jsonb_typeof(p_jawaban) = 'object' THEN
      v_kode_jawaban := COALESCE(
        p_jawaban ->> v_soal.urutan::text,
        p_jawaban ->> v_soal.id::text
      );
    ELSE
      SELECT COALESCE(el->>'kode', el->>'opsi', el->>'jawaban')
      INTO v_kode_jawaban
      FROM jsonb_array_elements(p_jawaban) AS el
      WHERE (el->>'urutan')::integer = v_soal.urutan
         OR (el->>'soal_id') = v_soal.id::text
      LIMIT 1;
    END IF;

    IF NULLIF(btrim(v_kode_jawaban), '') IS NULL THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    v_kode_jawaban := upper(btrim(v_kode_jawaban));

    SELECT opt INTO v_opsi
    FROM jsonb_array_elements(v_soal.opsi) AS opt
    WHERE upper(opt->>'kode') = v_kode_jawaban
    LIMIT 1;

    IF v_opsi IS NULL THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    v_soft := v_soft + COALESCE((v_opsi->>'software')::integer, 0);
    v_jar  := v_jar  + COALESCE((v_opsi->>'jaringan')::integer, 0);
    v_iot  := v_iot  + COALESCE((v_opsi->>'iot')::integer, 0);
    v_ai   := v_ai   + COALESCE((v_opsi->>'ai_data')::integer, 0);
  END LOOP;

  v_total := v_soft + v_jar + v_iot + v_ai;

  IF v_total > 0 THEN
    v_pct_soft := round((v_soft::numeric / v_total) * 100)::integer;
    v_pct_jar  := round((v_jar::numeric  / v_total) * 100)::integer;
    v_pct_iot  := round((v_iot::numeric  / v_total) * 100)::integer;
    v_pct_ai   := round((v_ai::numeric   / v_total) * 100)::integer;
  END IF;

  -- Tie-break prioritas: Software > Jaringan > IoT > AI & Data
  IF v_soft >= v_jar AND v_soft >= v_iot AND v_soft >= v_ai THEN
    v_bidang := 'software'::public.bidang_it;
    v_jurusan := '["Informatika", "Rekayasa Perangkat Lunak", "Sistem Informasi"]'::jsonb;
  ELSIF v_jar >= v_iot AND v_jar >= v_ai THEN
    v_bidang := 'jaringan'::public.bidang_it;
    v_jurusan := '["Teknik Komputer", "Keamanan Siber"]'::jsonb;
  ELSIF v_iot >= v_ai THEN
    v_bidang := 'iot'::public.bidang_it;
    v_jurusan := '["Teknik Komputer", "Teknik Elektro"]'::jsonb;
  ELSE
    v_bidang := 'ai_data'::public.bidang_it;
    v_jurusan := '["Informatika", "Sains Data"]'::jsonb;
  END IF;

  v_skor_json := jsonb_build_object(
    'software', v_pct_soft,
    'jaringan', v_pct_jar,
    'iot', v_pct_iot,
    'ai_data', v_pct_ai
  );

  IF auth.uid() IS NOT NULL AND p_siswa_id IS NOT NULL THEN
    IF public.peran_saya() NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna)
       OR NOT public.adalah_siswa_saya(p_siswa_id) THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;

    SELECT s.jenjang, s.kelas INTO v_siswa
    FROM public.siswa s
    WHERE s.id = p_siswa_id;

    IF v_siswa.jenjang = 'SD'::public.jenjang_pendidikan THEN
      v_program := '["Coding Dasar"]'::jsonb;
    ELSIF v_siswa.jenjang = 'SMP'::public.jenjang_pendidikan AND v_siswa.kelas IN (7, 8) THEN
      v_program := '["Kelas Reguler Teknologi"]'::jsonb;
    ELSE
      v_program := '["Simulasi Jurusan IT", "Kelas Reguler Teknologi"]'::jsonb;
    END IF;

    INSERT INTO public.hasil_minat (
      siswa_id,
      dikerjakan_oleh,
      jawaban,
      skor,
      bidang_teratas
    )
    VALUES (
      p_siswa_id,
      auth.uid(),
      p_jawaban,
      v_skor_json,
      v_bidang
    )
    RETURNING id INTO v_hasil_id;

    v_tersimpan := true;
  END IF;

  RETURN jsonb_build_object(
    'id', v_hasil_id,
    'tersimpan', v_tersimpan,
    'skor', v_skor_json,
    'skor_mentah', jsonb_build_object(
      'software', v_soft,
      'jaringan', v_jar,
      'iot', v_iot,
      'ai_data', v_ai
    ),
    'bidang_teratas', v_bidang,
    'rekomendasi_jurusan', v_jurusan,
    'rekomendasi_program', v_program
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- F6: BOOKING & PEMBAYARAN MANUAL
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.buat_booking(
  p_kelas_id uuid,
  p_siswa_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran public.peran_pengguna := public.peran_saya();
  v_siswa record;
  v_siswa_user_status public.status_pengguna;
  v_kelas record;
  v_sesi1_mulai timestamptz;
  v_terpakai integer;
  v_kode text;
  v_booking_id uuid;
  v_batas timestamptz := now() + interval '24 hours';
BEGIN
  IF auth.uid() IS NULL OR v_peran NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_kelas_id IS NULL OR p_siswa_id IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NOT public.adalah_siswa_saya(p_siswa_id) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF public.status_saya() = 'nonaktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_siswa
  FROM public.siswa s
  WHERE s.id = p_siswa_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_siswa.pengguna_id IS NOT NULL THEN
    SELECT u.status INTO v_siswa_user_status
    FROM public.pengguna u
    WHERE u.id = v_siswa.pengguna_id;

    IF v_siswa_user_status IN ('menunggu_persetujuan'::public.status_pengguna, 'ditolak_orang_tua'::public.status_pengguna) THEN
      RAISE EXCEPTION 'SISWA_BELUM_DISETUJUI';
    ELSIF v_siswa_user_status = 'nonaktif'::public.status_pengguna THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;
  END IF;

  -- Bersihkan booking kedaluwarsa terlebih dahulu agar kursi akurat
  PERFORM public.kedaluwarsakan_booking_lewat_batas();

  -- Kunci baris kelas untuk mencegah race condition overbooking
  SELECT
    k.id,
    k.kapasitas,
    k.status AS kelas_status,
    p.harga_paket,
    p.jenjang AS prog_jenjang,
    p.kelas_min,
    p.kelas_maks,
    p.aktif AS prog_aktif,
    u.status AS pengajar_status
  INTO v_kelas
  FROM public.kelas k
  JOIN public.program p ON p.id = k.program_id
  JOIN public.pengguna u ON u.id = k.pengajar_id
  WHERE k.id = p_kelas_id
  FOR UPDATE OF k;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_kelas.kelas_status != 'terbuka'::public.status_kelas
     OR NOT v_kelas.prog_aktif
     OR v_kelas.pengajar_status != 'terverifikasi'::public.status_pengguna THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NOT (v_siswa.jenjang = ANY(v_kelas.prog_jenjang))
     OR v_siswa.kelas < v_kelas.kelas_min
     OR v_siswa.kelas > v_kelas.kelas_maks THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT s.mulai_pada INTO v_sesi1_mulai
  FROM public.sesi s
  WHERE s.kelas_id = p_kelas_id AND s.nomor = 1;

  IF v_sesi1_mulai IS NULL OR v_sesi1_mulai <= now() THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = p_kelas_id
      AND b.siswa_id = p_siswa_id
      AND b.status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'terkonfirmasi')
  ) THEN
    RAISE EXCEPTION 'BOOKING_GANDA';
  END IF;

  SELECT count(*)::integer INTO v_terpakai
  FROM public.booking b
  WHERE b.kelas_id = p_kelas_id
    AND b.status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'terkonfirmasi');

  IF v_terpakai >= v_kelas.kapasitas THEN
    RAISE EXCEPTION 'KELAS_PENUH';
  END IF;

  v_kode := 'BK-'
    || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD')
    || '-'
    || lpad((nextval('public.seq_kode_booking') % 10000)::text, 4, '0');

  INSERT INTO public.booking (
    kode,
    kelas_id,
    siswa_id,
    dibuat_oleh,
    status,
    total,
    batas_bayar_pada
  )
  VALUES (
    v_kode,
    p_kelas_id,
    p_siswa_id,
    auth.uid(),
    'menunggu_pembayaran'::public.status_booking,
    v_kelas.harga_paket,
    v_batas
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'id', v_booking_id,
    'kode', v_kode,
    'status', 'menunggu_pembayaran',
    'total', v_kelas.harga_paket,
    'batas_bayar_pada', v_batas
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.batalkan_booking(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking record;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_booking
  FROM public.booking b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_booking.dibuat_oleh != auth.uid() AND NOT public.adalah_siswa_saya(v_booking.siswa_id) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF v_booking.status != 'menunggu_pembayaran'::public.status_booking THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.pembayaran p
    WHERE p.booking_id = p_booking_id
      AND p.status IN ('menunggu'::public.status_pembayaran, 'disetujui'::public.status_pembayaran)
  ) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.booking
  SET status = 'dibatalkan'::public.status_booking
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'id', p_booking_id,
    'status', 'dibatalkan'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.kirim_bukti_bayar(
  p_booking_id uuid,
  p_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking record;
  v_obj record;
  v_size bigint;
  v_mime text;
  v_pembayaran_id uuid;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_booking_id IS NULL OR NULLIF(btrim(p_path), '') IS NULL THEN
    RAISE EXCEPTION 'FILE_TIDAK_VALID';
  END IF;

  SELECT * INTO v_booking
  FROM public.booking b
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_booking.dibuat_oleh != auth.uid() AND NOT public.adalah_siswa_saya(v_booking.siswa_id) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF v_booking.status != 'menunggu_pembayaran'::public.status_booking THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_booking.batas_bayar_pada <= now() THEN
    UPDATE public.booking
    SET status = 'kedaluwarsa'::public.status_booking
    WHERE id = p_booking_id;
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  -- Validasi path & metadata file di storage.objects
  IF p_path NOT LIKE (p_booking_id::text || '/%')
     OR lower(p_path) !~ '\.(jpg|jpeg|png|pdf)$' THEN
    RAISE EXCEPTION 'FILE_TIDAK_VALID';
  END IF;

  SELECT o.id, o.metadata INTO v_obj
  FROM storage.objects o
  WHERE o.bucket_id = 'bukti-bayar'
    AND o.name = p_path;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FILE_TIDAK_VALID';
  END IF;

  v_size := COALESCE((v_obj.metadata->>'size')::bigint, 0);
  v_mime := COALESCE(v_obj.metadata->>'mimetype', '');

  IF v_size > 2097152 OR (v_mime != '' AND v_mime NOT IN ('image/jpeg', 'image/png', 'application/pdf')) THEN
    RAISE EXCEPTION 'FILE_TIDAK_VALID';
  END IF;

  INSERT INTO public.pembayaran (booking_id, bukti_path, status)
  VALUES (p_booking_id, p_path, 'menunggu'::public.status_pembayaran)
  RETURNING id INTO v_pembayaran_id;

  UPDATE public.booking
  SET status = 'menunggu_verifikasi'::public.status_booking
  WHERE id = p_booking_id;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT
    u.id,
    'pembayaran_masuk'::public.tipe_notifikasi,
    'Bukti pembayaran masuk',
    'Booking ' || v_booking.kode || ' menunggu verifikasi pembayaran.',
    '/admin/pembayaran/' || v_pembayaran_id::text
  FROM public.pengguna u
  WHERE u.peran = 'admin'::public.peran_pengguna
    AND u.status = 'aktif'::public.status_pengguna;

  RETURN jsonb_build_object(
    'pembayaran_id', v_pembayaran_id,
    'booking_id', p_booking_id,
    'status', 'menunggu_verifikasi'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- F8: BUKA KELAS, GESER SESI, LINK MASUK SESI
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.buka_kelas(
  p_program_id uuid,
  p_tanggal_mulai date,
  p_jam_mulai time,
  p_kapasitas integer,
  p_level integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_program record;
  v_maks integer;
  v_mulai_1 timestamptz;
  v_s_mulai timestamptz;
  v_s_selesai timestamptz;
  v_kelas_id uuid;
  v_sesi_id uuid;
  v_sesi_ids uuid[] := '{}'::uuid[];
  i integer;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF public.status_saya() IS DISTINCT FROM 'terverifikasi'::public.status_pengguna THEN
    RAISE EXCEPTION 'PENGAJAR_BELUM_TERVERIFIKASI';
  END IF;

  IF p_program_id IS NULL OR p_tanggal_mulai IS NULL OR p_jam_mulai IS NULL OR p_kapasitas IS NULL OR p_level IS NULL OR p_level < 1 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.pengajar_program pp
    WHERE pp.pengajar_id = auth.uid()
      AND pp.program_id = p_program_id
      AND pp.disetujui = true
  ) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_program
  FROM public.program p
  WHERE p.id = p_program_id AND p.aktif = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF 'SD'::public.jenjang_pendidikan = ANY(v_program.jenjang) THEN
    v_maks := 10;
  ELSE
    v_maks := 15;
  END IF;

  IF p_kapasitas < 1 OR p_kapasitas > v_maks THEN
    RAISE EXCEPTION 'KAPASITAS_TIDAK_VALID';
  END IF;

  -- Input jadwal pengajar dalam WIB (Asia/Jakarta) -> simpan UTC timestamptz
  v_mulai_1 := (p_tanggal_mulai::timestamp + p_jam_mulai) AT TIME ZONE 'Asia/Jakarta';

  IF v_mulai_1 <= now() THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  -- Cek bentrok jadwal untuk ke-4 sesi mingguan
  FOR i IN 0..(v_program.jumlah_sesi - 1) LOOP
    v_s_mulai := v_mulai_1 + (i * interval '7 days');
    v_s_selesai := v_s_mulai + make_interval(mins => v_program.durasi_menit);

    IF EXISTS (
      SELECT 1
      FROM public.sesi s
      JOIN public.kelas k ON k.id = s.kelas_id
      WHERE k.pengajar_id = auth.uid()
        AND k.status != 'disembunyikan'::public.status_kelas
        AND s.status != 'dibatalkan'::public.status_sesi
        AND tstzrange(s.mulai_pada, s.selesai_pada, '[)') && tstzrange(v_s_mulai, v_s_selesai, '[)')
    ) THEN
      RAISE EXCEPTION 'JADWAL_BENTROK';
    END IF;
  END LOOP;

  INSERT INTO public.kelas (
    program_id,
    pengajar_id,
    level,
    kapasitas,
    jam_mulai,
    status
  )
  VALUES (
    p_program_id,
    auth.uid(),
    p_level,
    p_kapasitas,
    p_jam_mulai,
    'terbuka'::public.status_kelas
  )
  RETURNING id INTO v_kelas_id;

  FOR i IN 0..(v_program.jumlah_sesi - 1) LOOP
    v_s_mulai := v_mulai_1 + (i * interval '7 days');
    v_s_selesai := v_s_mulai + make_interval(mins => v_program.durasi_menit);

    INSERT INTO public.sesi (kelas_id, nomor, mulai_pada, selesai_pada, status)
    VALUES (v_kelas_id, i + 1, v_s_mulai, v_s_selesai, 'terjadwal'::public.status_sesi)
    RETURNING id INTO v_sesi_id;

    v_sesi_ids := array_append(v_sesi_ids, v_sesi_id);
  END LOOP;

  RETURN jsonb_build_object(
    'kelas_id', v_kelas_id,
    'sesi_ids', to_jsonb(v_sesi_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.geser_sesi(
  p_sesi_id uuid,
  p_mulai_pada timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_selesai_baru timestamptz;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_sesi_id IS NULL OR p_mulai_pada IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT
    s.*,
    k.pengajar_id,
    p.durasi_menit,
    p.nama AS program_nama
  INTO v_sesi
  FROM public.sesi s
  JOIN public.kelas k ON k.id = s.kelas_id
  JOIN public.program p ON p.id = k.program_id
  WHERE s.id = p_sesi_id
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_sesi.pengajar_id != auth.uid() THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  -- Maksimal 24 jam sebelum sesi dimulai (F8)
  IF v_sesi.status != 'terjadwal'::public.status_sesi
     OR v_sesi.mulai_pada <= now() + interval '24 hours'
     OR p_mulai_pada <= now() + interval '24 hours' THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  v_selesai_baru := p_mulai_pada + make_interval(mins => v_sesi.durasi_menit);

  IF EXISTS (
    SELECT 1
    FROM public.sesi s2
    JOIN public.kelas k2 ON k2.id = s2.kelas_id
    WHERE k2.pengajar_id = auth.uid()
      AND s2.id != p_sesi_id
      AND k2.status != 'disembunyikan'::public.status_kelas
      AND s2.status != 'dibatalkan'::public.status_sesi
      AND tstzrange(s2.mulai_pada, s2.selesai_pada, '[)') && tstzrange(p_mulai_pada, v_selesai_baru, '[)')
  ) THEN
    RAISE EXCEPTION 'JADWAL_BENTROK';
  END IF;

  UPDATE public.sesi
  SET
    mulai_pada = p_mulai_pada,
    selesai_pada = v_selesai_baru
  WHERE id = p_sesi_id;

  -- Kirim notifikasi ke siswa & orang tua dengan booking terkonfirmasi
  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT DISTINCT
    target.uid,
    'sesi_dijadwal_ulang'::public.tipe_notifikasi,
    'Jadwal sesi digeser',
    'Sesi ' || v_sesi.nomor || ' kelas ' || v_sesi.program_nama || ' dijadwal ulang.',
    CASE
      WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/sesi/' || p_sesi_id::text
      ELSE '/siswa/sesi/' || p_sesi_id::text
    END
  FROM public.booking b
  JOIN public.siswa sw ON sw.id = b.siswa_id
  CROSS JOIN LATERAL (
    SELECT sw.orang_tua_id AS uid WHERE sw.orang_tua_id IS NOT NULL
    UNION
    SELECT sw.pengguna_id AS uid WHERE sw.pengguna_id IS NOT NULL
  ) target
  JOIN public.pengguna u ON u.id = target.uid
  WHERE b.kelas_id = v_sesi.kelas_id
    AND b.status = 'terkonfirmasi'::public.status_booking;

  RETURN jsonb_build_object(
    'id', p_sesi_id,
    'mulai_pada', p_mulai_pada,
    'selesai_pada', v_selesai_baru
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.link_masuk_sesi(p_sesi_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_berhak boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT s.*, k.pengajar_id
  INTO v_sesi
  FROM public.sesi s
  JOIN public.kelas k ON k.id = s.kelas_id
  WHERE s.id = p_sesi_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF public.peran_saya() = 'pengajar'::public.peran_pengguna
     AND v_sesi.pengajar_id = auth.uid()
     AND public.status_saya() = 'terverifikasi'::public.status_pengguna THEN
    v_berhak := true;
  ELSIF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = v_sesi.kelas_id
      AND b.status = 'terkonfirmasi'::public.status_booking
      AND public.adalah_siswa_saya(b.siswa_id)
  ) THEN
    v_berhak := true;
  END IF;

  IF NOT v_berhak THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF v_sesi.status != 'terjadwal'::public.status_sesi
     OR now() < (v_sesi.mulai_pada - interval '15 minutes')
     OR now() > v_sesi.selesai_pada THEN
    RAISE EXCEPTION 'SESI_BELUM_DIBUKA';
  END IF;

  IF NULLIF(btrim(v_sesi.meet_uri), '') IS NULL THEN
    RAISE EXCEPTION 'LINK_MEET_BELUM_ADA';
  END IF;

  RETURN jsonb_build_object('meet_uri', v_sesi.meet_uri);
END;
$$;

-- ----------------------------------------------------------------------------
-- F9: TEACHING PLAYBOOK
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.playbook_sesi(p_sesi_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_peran public.peran_pengguna := public.peran_saya();
  v_sesi record;
  v_playbook record;
BEGIN
  IF auth.uid() IS NULL OR v_peran NOT IN ('pengajar'::public.peran_pengguna, 'admin'::public.peran_pengguna) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT s.*, k.program_id, k.level, k.pengajar_id
  INTO v_sesi
  FROM public.sesi s
  JOIN public.kelas k ON k.id = s.kelas_id
  WHERE s.id = p_sesi_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_peran = 'pengajar'::public.peran_pengguna THEN
    IF v_sesi.pengajar_id != auth.uid() THEN
      RAISE EXCEPTION 'TIDAK_BERHAK';
    END IF;
    IF now() < (v_sesi.mulai_pada - interval '24 hours') THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;
  END IF;

  SELECT * INTO v_playbook
  FROM public.playbook pb
  WHERE pb.program_id = v_sesi.program_id
    AND pb.level = v_sesi.level
    AND pb.nomor_sesi = v_sesi.nomor;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_playbook);
END;
$$;

-- ----------------------------------------------------------------------------
-- F10 & F11: LAPORAN SETELAH KELAS & RAPOR REKOMENDASI JURUSAN
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kirim_laporan(
  p_sesi_id uuid,
  p_ringkasan text,
  p_rekaman_url text,
  p_kendala text,
  p_siswa jsonb,
  p_rapor jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_laporan_id uuid;
  v_item jsonb;
  v_rapor_item jsonb;
  v_siswa_id uuid;
  v_hadir boolean;
  v_catatan text;
  v_hadir_ids uuid[] := '{}'::uuid[];
  v_wajib_rapor boolean := false;
  v_rapor_count integer := 0;
  v_target_siswa_ids uuid[] := '{}'::uuid[];
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT
    s.*,
    k.pengajar_id,
    k.program_id,
    p.slug AS program_slug,
    p.honor_per_sesi
  INTO v_sesi
  FROM public.sesi s
  JOIN public.kelas k ON k.id = s.kelas_id
  JOIN public.program p ON p.id = k.program_id
  WHERE s.id = p_sesi_id
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_sesi.pengajar_id != auth.uid() THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF now() < v_sesi.mulai_pada OR v_sesi.status = 'dibatalkan'::public.status_sesi THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF EXISTS (SELECT 1 FROM public.laporan_sesi ls WHERE ls.sesi_id = p_sesi_id) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NULLIF(btrim(p_ringkasan), '') IS NULL OR char_length(p_ringkasan) > 500 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF p_siswa IS NULL OR jsonb_typeof(p_siswa) != 'array' THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  v_wajib_rapor := (v_sesi.program_slug = 'simulasi-jurusan-it' AND v_sesi.nomor = 4);

  INSERT INTO public.laporan_sesi (
    sesi_id,
    pengajar_id,
    ringkasan,
    rekaman_url,
    kendala
  )
  VALUES (
    p_sesi_id,
    auth.uid(),
    btrim(p_ringkasan),
    NULLIF(btrim(p_rekaman_url), ''),
    NULLIF(btrim(p_kendala), '')
  )
  RETURNING id INTO v_laporan_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_siswa) LOOP
    BEGIN
      v_siswa_id := (v_item->>'siswa_id')::uuid;
      v_hadir := (v_item->>'hadir')::boolean;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END;

    IF v_siswa_id IS NULL OR v_hadir IS NULL THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.booking b
      WHERE b.kelas_id = v_sesi.kelas_id
        AND b.siswa_id = v_siswa_id
        AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
    ) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    v_catatan := NULLIF(btrim(v_item->>'catatan'), '');
    IF v_hadir AND (v_catatan IS NULL OR char_length(v_catatan) > 300) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;
    IF NOT v_hadir AND v_catatan IS NOT NULL AND char_length(v_catatan) > 300 THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    INSERT INTO public.laporan_siswa (
      laporan_sesi_id,
      siswa_id,
      hadir,
      catatan,
      karya_url
    )
    VALUES (
      v_laporan_id,
      v_siswa_id,
      v_hadir,
      v_catatan,
      NULLIF(btrim(v_item->>'karya_url'), '')
    );

    v_target_siswa_ids := array_append(v_target_siswa_ids, v_siswa_id);
    IF v_hadir THEN
      v_hadir_ids := array_append(v_hadir_ids, v_siswa_id);
    END IF;
  END LOOP;

  -- Pastikan semua siswa terkonfirmasi di kelas tercantum dalam p_siswa
  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = v_sesi.kelas_id
      AND b.status = 'terkonfirmasi'::public.status_booking
      AND NOT (b.siswa_id = ANY(v_target_siswa_ids))
  ) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  -- Proses rapor jurusan jika ada (wajib untuk sesi 4 Simulasi Jurusan IT bagi setiap siswa hadir)
  IF p_rapor IS NOT NULL AND jsonb_typeof(p_rapor) = 'array' THEN
    FOR v_rapor_item IN SELECT * FROM jsonb_array_elements(p_rapor) LOOP
      v_siswa_id := (v_rapor_item->>'siswa_id')::uuid;
      IF v_siswa_id IS NULL OR NOT (v_siswa_id = ANY(v_target_siswa_ids)) THEN
        RAISE EXCEPTION 'VALIDASI_GAGAL';
      END IF;

      INSERT INTO public.rapor_jurusan (
        sesi_id,
        siswa_id,
        skor_software,
        skor_jaringan,
        skor_iot,
        skor_ai_data,
        bidang_rekomendasi,
        alasan,
        saran
      )
      VALUES (
        p_sesi_id,
        v_siswa_id,
        (v_rapor_item->>'skor_software')::integer,
        (v_rapor_item->>'skor_jaringan')::integer,
        (v_rapor_item->>'skor_iot')::integer,
        (v_rapor_item->>'skor_ai_data')::integer,
        (v_rapor_item->>'bidang_rekomendasi')::public.bidang_it,
        btrim(v_rapor_item->>'alasan'),
        btrim(v_rapor_item->>'saran')
      );
      v_rapor_count := v_rapor_count + 1;
    END LOOP;
  END IF;

  IF v_wajib_rapor AND cardinality(v_hadir_ids) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(v_hadir_ids) AS hs(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.rapor_jurusan rj
        WHERE rj.sesi_id = p_sesi_id AND rj.siswa_id = hs.id
      )
    ) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;
  END IF;

  UPDATE public.sesi
  SET status = 'selesai'::public.status_sesi
  WHERE id = p_sesi_id;

  IF v_sesi.nomor = 4 THEN
    UPDATE public.kelas
    SET status = 'selesai'::public.status_kelas
    WHERE id = v_sesi.kelas_id;

    UPDATE public.booking
    SET status = 'selesai'::public.status_booking
    WHERE kelas_id = v_sesi.kelas_id
      AND status = 'terkonfirmasi'::public.status_booking;
  END IF;

  -- Catat honor pengajar saat laporan dikirim (F13)
  INSERT INTO public.honor (pengajar_id, sesi_id, jumlah, status)
  VALUES (auth.uid(), p_sesi_id, v_sesi.honor_per_sesi, 'belum_dibayar'::public.status_honor)
  ON CONFLICT (sesi_id) DO NOTHING;

  -- Kirim notifikasi realtime ke siswa & orang tua
  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT DISTINCT
    target.uid,
    'laporan_dikirim'::public.tipe_notifikasi,
    'Laporan sesi tersedia',
    'Pengajar telah mengirim laporan untuk sesi ' || v_sesi.nomor || '.',
    CASE
      WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/sesi/' || p_sesi_id::text
      ELSE '/siswa/sesi/' || p_sesi_id::text
    END
  FROM unnest(v_target_siswa_ids) AS sid
  JOIN public.siswa sw ON sw.id = sid
  CROSS JOIN LATERAL (
    SELECT sw.orang_tua_id AS uid WHERE sw.orang_tua_id IS NOT NULL
    UNION
    SELECT sw.pengguna_id AS uid WHERE sw.pengguna_id IS NOT NULL
  ) target
  JOIN public.pengguna u ON u.id = target.uid;

  RETURN jsonb_build_object(
    'laporan_sesi_id', v_laporan_id,
    'sesi_id', p_sesi_id,
    'status', 'selesai'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ubah_laporan(
  p_sesi_id uuid,
  p_ringkasan text,
  p_rekaman_url text,
  p_kendala text,
  p_siswa jsonb,
  p_rapor jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ls record;
  v_sesi record;
  v_item jsonb;
  v_rapor_item jsonb;
  v_siswa_id uuid;
  v_hadir boolean;
  v_catatan text;
  v_hadir_ids uuid[] := '{}'::uuid[];
  v_target_siswa_ids uuid[] := '{}'::uuid[];
  v_wajib_rapor boolean := false;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_ls
  FROM public.laporan_sesi ls
  WHERE ls.sesi_id = p_sesi_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_ls.pengajar_id != auth.uid() THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF now() > v_ls.dikirim_pada + interval '24 hours' THEN
    RAISE EXCEPTION 'LAPORAN_TERKUNCI';
  END IF;

  SELECT s.*, p.slug AS program_slug
  INTO v_sesi
  FROM public.sesi s
  JOIN public.kelas k ON k.id = s.kelas_id
  JOIN public.program p ON p.id = k.program_id
  WHERE s.id = p_sesi_id;

  IF NULLIF(btrim(p_ringkasan), '') IS NULL OR char_length(p_ringkasan) > 500 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF p_siswa IS NULL OR jsonb_typeof(p_siswa) != 'array' THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  v_wajib_rapor := (v_sesi.program_slug = 'simulasi-jurusan-it' AND v_sesi.nomor = 4);

  UPDATE public.laporan_sesi
  SET
    ringkasan = btrim(p_ringkasan),
    rekaman_url = NULLIF(btrim(p_rekaman_url), ''),
    kendala = NULLIF(btrim(p_kendala), ''),
    diubah_pada = now()
  WHERE id = v_ls.id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_siswa) LOOP
    v_siswa_id := (v_item->>'siswa_id')::uuid;
    v_hadir := (v_item->>'hadir')::boolean;
    v_catatan := NULLIF(btrim(v_item->>'catatan'), '');

    IF v_siswa_id IS NULL OR v_hadir IS NULL THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    IF v_hadir AND (v_catatan IS NULL OR char_length(v_catatan) > 300) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    INSERT INTO public.laporan_siswa (laporan_sesi_id, siswa_id, hadir, catatan, karya_url)
    VALUES (
      v_ls.id,
      v_siswa_id,
      v_hadir,
      v_catatan,
      NULLIF(btrim(v_item->>'karya_url'), '')
    )
    ON CONFLICT (laporan_sesi_id, siswa_id) DO UPDATE SET
      hadir = EXCLUDED.hadir,
      catatan = EXCLUDED.catatan,
      karya_url = EXCLUDED.karya_url;

    v_target_siswa_ids := array_append(v_target_siswa_ids, v_siswa_id);
    IF v_hadir THEN
      v_hadir_ids := array_append(v_hadir_ids, v_siswa_id);
    END IF;
  END LOOP;

  IF p_rapor IS NOT NULL AND jsonb_typeof(p_rapor) = 'array' THEN
    FOR v_rapor_item IN SELECT * FROM jsonb_array_elements(p_rapor) LOOP
      v_siswa_id := (v_rapor_item->>'siswa_id')::uuid;
      INSERT INTO public.rapor_jurusan (
        sesi_id,
        siswa_id,
        skor_software,
        skor_jaringan,
        skor_iot,
        skor_ai_data,
        bidang_rekomendasi,
        alasan,
        saran
      )
      VALUES (
        p_sesi_id,
        v_siswa_id,
        (v_rapor_item->>'skor_software')::integer,
        (v_rapor_item->>'skor_jaringan')::integer,
        (v_rapor_item->>'skor_iot')::integer,
        (v_rapor_item->>'skor_ai_data')::integer,
        (v_rapor_item->>'bidang_rekomendasi')::public.bidang_it,
        btrim(v_rapor_item->>'alasan'),
        btrim(v_rapor_item->>'saran')
      )
      ON CONFLICT (sesi_id, siswa_id) DO UPDATE SET
        skor_software = EXCLUDED.skor_software,
        skor_jaringan = EXCLUDED.skor_jaringan,
        skor_iot = EXCLUDED.skor_iot,
        skor_ai_data = EXCLUDED.skor_ai_data,
        bidang_rekomendasi = EXCLUDED.bidang_rekomendasi,
        alasan = EXCLUDED.alasan,
        saran = EXCLUDED.saran;
    END LOOP;
  END IF;

  IF v_wajib_rapor AND cardinality(v_hadir_ids) > 0 THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(v_hadir_ids) AS hs(id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.rapor_jurusan rj
        WHERE rj.sesi_id = p_sesi_id AND rj.siswa_id = hs.id
      )
    ) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'laporan_sesi_id', v_ls.id,
    'diubah_pada', now()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- F12: RATING & LAPORAN MASALAH + TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.beri_rating(
  p_sesi_id uuid,
  p_siswa_id uuid,
  p_bintang integer,
  p_komentar text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_rating_id uuid;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF NOT public.adalah_siswa_saya(p_siswa_id) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_bintang IS NULL OR p_bintang < 1 OR p_bintang > 5 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF p_komentar IS NOT NULL AND char_length(p_komentar) > 300 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT s.* INTO v_sesi
  FROM public.sesi s
  WHERE s.id = p_sesi_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.booking b
    WHERE b.kelas_id = v_sesi.kelas_id
      AND b.siswa_id = p_siswa_id
      AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
  ) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.laporan_sesi ls WHERE ls.sesi_id = p_sesi_id
  ) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  BEGIN
    INSERT INTO public.rating (sesi_id, siswa_id, pemberi_id, bintang, komentar)
    VALUES (p_sesi_id, p_siswa_id, auth.uid(), p_bintang, NULLIF(btrim(p_komentar), ''))
    RETURNING id INTO v_rating_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END;

  RETURN jsonb_build_object(
    'id', v_rating_id,
    'bintang', p_bintang
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.set_prioritas_laporan_masalah()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.kategori = 'perilaku_tidak_pantas'::public.kategori_masalah THEN
    NEW.prioritas := 'tinggi'::public.prioritas_masalah;
  ELSE
    NEW.prioritas := 'normal'::public.prioritas_masalah;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prioritas_laporan_masalah ON public.laporan_masalah;
CREATE TRIGGER trg_prioritas_laporan_masalah
  BEFORE INSERT ON public.laporan_masalah
  FOR EACH ROW
  EXECUTE FUNCTION public.set_prioritas_laporan_masalah();

CREATE OR REPLACE FUNCTION public.notifikasi_laporan_masalah_baru()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT
    u.id,
    'laporan_masalah_baru'::public.tipe_notifikasi,
    CASE
      WHEN NEW.prioritas = 'tinggi'::public.prioritas_masalah THEN '[PRIORITAS TINGGI] Laporan masalah baru'
      ELSE 'Laporan masalah baru'
    END,
    'Kategori: ' || NEW.kategori::text || ' (' || NEW.prioritas::text || ')',
    '/admin/laporan-masalah'
  FROM public.pengguna u
  WHERE u.peran = 'admin'::public.peran_pengguna
    AND u.status = 'aktif'::public.status_pengguna;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifikasi_laporan_masalah ON public.laporan_masalah;
CREATE TRIGGER trg_notifikasi_laporan_masalah
  AFTER INSERT ON public.laporan_masalah
  FOR EACH ROW
  EXECUTE FUNCTION public.notifikasi_laporan_masalah_baru();

-- ----------------------------------------------------------------------------
-- BAGIAN 9: NOTIFIKASI
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.baca_semua_notifikasi()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  UPDATE public.notifikasi
  SET dibaca_pada = now()
  WHERE pengguna_id = auth.uid()
    AND dibaca_pada IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- F6, F7, F12, F13, F14: RPC ADMIN + OTOMATIS LOG_ADMIN
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_wawancara_selesai(
  p_pengajar_id uuid,
  p_selesai boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  UPDATE public.profil_pengajar
  SET wawancara_selesai = COALESCE(p_selesai, true)
  WHERE pengguna_id = p_pengajar_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'wawancara_selesai',
    'pengajar',
    p_pengajar_id::text,
    jsonb_build_object('wawancara_selesai', COALESCE(p_selesai, true))
  );

  RETURN jsonb_build_object('pengajar_id', p_pengajar_id, 'wawancara_selesai', COALESCE(p_selesai, true));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_setujui_pengajar(
  p_pengajar_id uuid,
  p_program_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profil record;
  v_pid uuid;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_pengajar_id IS NULL OR p_program_ids IS NULL OR cardinality(p_program_ids) = 0 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_profil
  FROM public.profil_pengajar pp
  WHERE pp.pengguna_id = p_pengajar_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF NULLIF(btrim(v_profil.identitas_path), '') IS NULL
     OR NULLIF(btrim(v_profil.skck_path), '') IS NULL
     OR NOT v_profil.wawancara_selesai THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.pengguna
  SET status = 'terverifikasi'::public.status_pengguna
  WHERE id = p_pengajar_id
    AND peran = 'pengajar'::public.peran_pengguna;

  UPDATE public.profil_pengajar
  SET
    alasan_penolakan = NULL,
    diverifikasi_pada = now(),
    diverifikasi_oleh = auth.uid()
  WHERE pengguna_id = p_pengajar_id;

  UPDATE public.pengajar_program
  SET disetujui = false
  WHERE pengajar_id = p_pengajar_id;

  FOREACH v_pid IN ARRAY p_program_ids LOOP
    INSERT INTO public.pengajar_program (pengajar_id, program_id, disetujui)
    VALUES (p_pengajar_id, v_pid, true)
    ON CONFLICT (pengajar_id, program_id) DO UPDATE SET disetujui = true;
  END LOOP;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  VALUES (
    p_pengajar_id,
    'pengajar_status'::public.tipe_notifikasi,
    'Akun pengajar terverifikasi',
    'Selamat! Verifikasi Anda telah disetujui. Anda sudah dapat membuka kelas.',
    '/mengajar'
  );

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'setujui_pengajar',
    'pengajar',
    p_pengajar_id::text,
    jsonb_build_object('program_ids', to_jsonb(p_program_ids))
  );

  RETURN jsonb_build_object('pengajar_id', p_pengajar_id, 'status', 'terverifikasi');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_tolak_pengajar(
  p_pengajar_id uuid,
  p_alasan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_pengajar_id IS NULL OR NULLIF(btrim(p_alasan), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.pengguna
  SET status = 'ditolak'::public.status_pengguna
  WHERE id = p_pengajar_id
    AND peran = 'pengajar'::public.peran_pengguna;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.profil_pengajar
  SET
    alasan_penolakan = btrim(p_alasan),
    diverifikasi_oleh = auth.uid(),
    diverifikasi_pada = now()
  WHERE pengguna_id = p_pengajar_id;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  VALUES (
    p_pengajar_id,
    'pengajar_status'::public.tipe_notifikasi,
    'Pendaftaran pengajar ditolak',
    'Alasan: ' || btrim(p_alasan),
    '/mengajar'
  );

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'tolak_pengajar',
    'pengajar',
    p_pengajar_id::text,
    jsonb_build_object('alasan', btrim(p_alasan))
  );

  RETURN jsonb_build_object('pengajar_id', p_pengajar_id, 'status', 'ditolak');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_nonaktifkan_pengguna(
  p_pengguna_id uuid,
  p_alasan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user record;
  v_booking_terdampak jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_pengguna_id IS NULL OR NULLIF(btrim(p_alasan), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_user
  FROM public.pengguna u
  WHERE u.id = p_pengguna_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_user.peran = 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  UPDATE public.pengguna
  SET status = 'nonaktif'::public.status_pengguna
  WHERE id = p_pengguna_id;

  IF v_user.peran = 'pengajar'::public.peran_pengguna THEN
    UPDATE public.profil_pengajar
    SET alasan_penolakan = btrim(p_alasan)
    WHERE pengguna_id = p_pengguna_id;

    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'booking_id', b.id,
          'kode', b.kode,
          'kelas_id', b.kelas_id,
          'siswa_id', b.siswa_id,
          'status', b.status
        )
      ),
      '[]'::jsonb
    )
    INTO v_booking_terdampak
    FROM public.booking b
    JOIN public.kelas k ON k.id = b.kelas_id
    WHERE k.pengajar_id = p_pengguna_id
      AND b.status IN ('menunggu_pembayaran'::public.status_booking, 'menunggu_verifikasi'::public.status_booking, 'terkonfirmasi'::public.status_booking);

    UPDATE public.kelas
    SET status = 'disembunyikan'::public.status_kelas
    WHERE pengajar_id = p_pengguna_id
      AND status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas);

    INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
    VALUES (
      p_pengguna_id,
      'pengajar_status'::public.tipe_notifikasi,
      'Akun pengajar dinonaktifkan',
      'Alasan: ' || btrim(p_alasan),
      '/mengajar'
    );
  END IF;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'nonaktifkan_pengguna',
    v_user.peran::text,
    p_pengguna_id::text,
    jsonb_build_object('alasan', btrim(p_alasan), 'booking_terdampak', v_booking_terdampak)
  );

  RETURN jsonb_build_object(
    'pengguna_id', p_pengguna_id,
    'status', 'nonaktif',
    'booking_terdampak', v_booking_terdampak
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_setujui_pembayaran(p_pembayaran_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bayar record;
  v_booking record;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_bayar
  FROM public.pembayaran p
  WHERE p.id = p_pembayaran_id
  FOR UPDATE;

  IF NOT FOUND OR v_bayar.status != 'menunggu'::public.status_pembayaran THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_booking
  FROM public.booking b
  WHERE b.id = v_bayar.booking_id
  FOR UPDATE;

  UPDATE public.pembayaran
  SET
    status = 'disetujui'::public.status_pembayaran,
    alasan_penolakan = NULL,
    diverifikasi_oleh = auth.uid(),
    diverifikasi_pada = now()
  WHERE id = p_pembayaran_id;

  UPDATE public.booking
  SET status = 'terkonfirmasi'::public.status_booking
  WHERE id = v_booking.id;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT DISTINCT
    target.uid,
    'booking_status'::public.tipe_notifikasi,
    'Pembayaran disetujui',
    'Booking ' || v_booking.kode || ' telah terkonfirmasi. Anda dapat masuk kelas sesuai jadwal.',
    CASE
      WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/booking/' || v_booking.id::text
      ELSE '/siswa/booking/' || v_booking.id::text
    END
  FROM (
    SELECT v_booking.dibuat_oleh AS uid
    UNION
    SELECT s.orang_tua_id FROM public.siswa s WHERE s.id = v_booking.siswa_id AND s.orang_tua_id IS NOT NULL
    UNION
    SELECT s.pengguna_id FROM public.siswa s WHERE s.id = v_booking.siswa_id AND s.pengguna_id IS NOT NULL
  ) target
  JOIN public.pengguna u ON u.id = target.uid;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'setujui_pembayaran',
    'pembayaran',
    p_pembayaran_id::text,
    jsonb_build_object('booking_id', v_booking.id, 'kode', v_booking.kode)
  );

  RETURN jsonb_build_object(
    'pembayaran_id', p_pembayaran_id,
    'booking_id', v_booking.id,
    'status', 'terkonfirmasi'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_tolak_pembayaran(
  p_pembayaran_id uuid,
  p_alasan text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bayar record;
  v_booking record;
  v_batas_baru timestamptz := now() + interval '24 hours';
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_pembayaran_id IS NULL OR NULLIF(btrim(p_alasan), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_bayar
  FROM public.pembayaran p
  WHERE p.id = p_pembayaran_id
  FOR UPDATE;

  IF NOT FOUND OR v_bayar.status != 'menunggu'::public.status_pembayaran THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_booking
  FROM public.booking b
  WHERE b.id = v_bayar.booking_id
  FOR UPDATE;

  UPDATE public.pembayaran
  SET
    status = 'ditolak'::public.status_pembayaran,
    alasan_penolakan = btrim(p_alasan),
    diverifikasi_oleh = auth.uid(),
    diverifikasi_pada = now()
  WHERE id = p_pembayaran_id;

  UPDATE public.booking
  SET
    status = 'menunggu_pembayaran'::public.status_booking,
    batas_bayar_pada = v_batas_baru
  WHERE id = v_booking.id;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT DISTINCT
    target.uid,
    'booking_status'::public.tipe_notifikasi,
    'Bukti bayar ditolak',
    'Booking ' || v_booking.kode || ' ditolak: ' || btrim(p_alasan) || '. Silakan unggah ulang dalam 24 jam.',
    CASE
      WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/booking/' || v_booking.id::text
      ELSE '/siswa/booking/' || v_booking.id::text
    END
  FROM (
    SELECT v_booking.dibuat_oleh AS uid
    UNION
    SELECT s.orang_tua_id FROM public.siswa s WHERE s.id = v_booking.siswa_id AND s.orang_tua_id IS NOT NULL
    UNION
    SELECT s.pengguna_id FROM public.siswa s WHERE s.id = v_booking.siswa_id AND s.pengguna_id IS NOT NULL
  ) target
  JOIN public.pengguna u ON u.id = target.uid;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'tolak_pembayaran',
    'pembayaran',
    p_pembayaran_id::text,
    jsonb_build_object('booking_id', v_booking.id, 'alasan', btrim(p_alasan), 'batas_bayar_baru', v_batas_baru)
  );

  RETURN jsonb_build_object(
    'pembayaran_id', p_pembayaran_id,
    'booking_id', v_booking.id,
    'status', 'menunggu_pembayaran',
    'batas_bayar_pada', v_batas_baru
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ubah_laporan_masalah(
  p_id uuid,
  p_status public.status_masalah
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_id IS NULL OR p_status IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.laporan_masalah
  SET status = p_status
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'ubah_laporan_masalah',
    'laporan_masalah',
    p_id::text,
    jsonb_build_object('status', p_status)
  );

  RETURN jsonb_build_object('id', p_id, 'status', p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_tandai_honor_dibayar(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_honor record;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_honor
  FROM public.honor h
  WHERE h.id = p_id
  FOR UPDATE;

  IF NOT FOUND OR v_honor.status = 'dibayar'::public.status_honor THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.honor
  SET
    status = 'dibayar'::public.status_honor,
    dibayar_pada = now(),
    dibayar_oleh = auth.uid()
  WHERE id = p_id;

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'tandai_honor_dibayar',
    'honor',
    p_id::text,
    jsonb_build_object('pengajar_id', v_honor.pengajar_id, 'jumlah', v_honor.jumlah)
  );

  RETURN jsonb_build_object('id', p_id, 'status', 'dibayar', 'dibayar_pada', now());
END;
$$;

-- ----------------------------------------------------------------------------
-- GRANT EXECUTE SESUAI PERAN DI PRD BAGIAN 8
-- ----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.buat_link_persetujuan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.info_persetujuan(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.putuskan_persetujuan(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hitung_tes_minat(jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.buat_booking(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.batalkan_booking(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kirim_bukti_bayar(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.buka_kelas(uuid, date, time, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.geser_sesi(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.link_masuk_sesi(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.playbook_sesi(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kirim_laporan(uuid, text, text, text, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ubah_laporan(uuid, text, text, text, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.beri_rating(uuid, uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.baca_semua_notifikasi() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_wawancara_selesai(uuid, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_setujui_pengajar(uuid, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_tolak_pengajar(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_nonaktifkan_pengguna(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_setujui_pembayaran(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_tolak_pembayaran(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_ubah_laporan_masalah(uuid, public.status_masalah) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_tandai_honor_dibayar(uuid) FROM PUBLIC;

-- Publik (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.info_persetujuan(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.putuskan_persetujuan(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hitung_tes_minat(jsonb, uuid) TO anon, authenticated;

-- Authenticated (role dicek di awal setiap fungsi)
GRANT EXECUTE ON FUNCTION public.buat_link_persetujuan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buat_booking(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batalkan_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kirim_bukti_bayar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buka_kelas(uuid, date, time, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.geser_sesi(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_masuk_sesi(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.playbook_sesi(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kirim_laporan(uuid, text, text, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ubah_laporan(uuid, text, text, text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.beri_rating(uuid, uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.baca_semua_notifikasi() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_wawancara_selesai(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_setujui_pengajar(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tolak_pengajar(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nonaktifkan_pengguna(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_setujui_pembayaran(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tolak_pembayaran(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ubah_laporan_masalah(uuid, public.status_masalah) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tandai_honor_dibayar(uuid) TO authenticated;
