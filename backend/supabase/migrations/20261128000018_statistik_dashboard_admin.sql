-- ============================================================================
-- Migration 18: Statistik platform, pendapatan bagi hasil, & pendaftar trial
--               untuk Dashboard Admin (`admin_statistik_platform`)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_statistik_platform()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_orang_tua integer := 0;
  v_siswa_mandiri integer := 0;
  v_pengajar_terverifikasi integer := 0;
  v_pengajar_menunggu integer := 0;
  v_total_pengguna integer := 0;
  v_profil_siswa integer := 0;

  v_booking_lunas integer := 0;
  v_omzet_kotor integer := 0;
  v_bagian_pengajar integer := 0;
  v_pendapatan_bersih_platform integer := 0;
  v_booking_referral integer := 0;
  v_total_potongan_referral integer := 0;
  v_honor_tercatat integer := 0;
  v_honor_dibayar integer := 0;

  v_trial_total integer := 0;
  v_trial_aktif integer := 0;
  v_trial_selesai integer := 0;
  v_trial_konversi integer := 0;
  v_daftar_trial jsonb := '[]'::jsonb;
BEGIN
  IF public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna
     OR public.status_saya() IS DISTINCT FROM 'aktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  -- 1. Pengguna per peran + jumlah profil siswa aktif (termasuk anak di akun orang tua)
  SELECT
    count(*) FILTER (WHERE u.peran = 'orang_tua'::public.peran_pengguna AND u.status <> 'nonaktif'::public.status_pengguna)::integer,
    count(*) FILTER (WHERE u.peran = 'siswa'::public.peran_pengguna AND u.status <> 'nonaktif'::public.status_pengguna)::integer,
    count(*) FILTER (WHERE u.peran = 'pengajar'::public.peran_pengguna AND u.status = 'terverifikasi'::public.status_pengguna)::integer,
    count(*) FILTER (WHERE u.peran = 'pengajar'::public.peran_pengguna AND u.status = 'menunggu_verifikasi'::public.status_pengguna)::integer
  INTO v_orang_tua, v_siswa_mandiri, v_pengajar_terverifikasi, v_pengajar_menunggu
  FROM public.pengguna u;

  v_total_pengguna := v_orang_tua + v_siswa_mandiri + v_pengajar_terverifikasi + v_pengajar_menunggu;

  SELECT count(*)::integer
  INTO v_profil_siswa
  FROM public.siswa sw
  LEFT JOIN public.pengguna u ON u.id = sw.pengguna_id
  WHERE sw.pengguna_id IS NULL OR u.status = 'aktif'::public.status_pengguna;

  -- 2. Pendapatan paket & bagi hasil 30%/40% (mengikuti rumus kirim_laporan)
  SELECT
    count(*)::integer,
    COALESCE(SUM(b.total), 0)::integer,
    COALESCE(
      SUM(
        ROUND(
          b.total * CASE
            WHEN b.kode_referral IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM public.kode_referral kr
                WHERE kr.pengajar_id = k.pengajar_id
                  AND kr.kode = b.kode_referral
              )
            THEN 0.40
            ELSE 0.30
          END
        )
      ),
      0
    )::integer,
    count(*) FILTER (WHERE b.kode_referral IS NOT NULL)::integer,
    COALESCE(SUM(b.potongan), 0)::integer
  INTO v_booking_lunas, v_omzet_kotor, v_bagian_pengajar, v_booking_referral, v_total_potongan_referral
  FROM public.booking b
  JOIN public.kelas k ON k.id = b.kelas_id
  WHERE b.jenis = 'paket'::public.jenis_booking
    AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking);

  v_pendapatan_bersih_platform := v_omzet_kotor - v_bagian_pengajar;

  SELECT
    COALESCE(SUM(h.jumlah), 0)::integer,
    COALESCE(SUM(h.jumlah) FILTER (WHERE h.status = 'dibayar'::public.status_honor), 0)::integer
  INTO v_honor_tercatat, v_honor_dibayar
  FROM public.honor h;

  -- 3. Pendaftar trial gratis Sesi 1 & konversi ke pembelian paket
  SELECT
    count(*)::integer,
    count(*) FILTER (WHERE b.status = 'terkonfirmasi'::public.status_booking)::integer,
    count(*) FILTER (WHERE b.status = 'selesai'::public.status_booking)::integer,
    count(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM public.booking bp
        WHERE bp.siswa_id = b.siswa_id
          AND bp.jenis = 'paket'::public.jenis_booking
          AND bp.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
          AND bp.dibuat_pada >= b.dibuat_pada
      )
    )::integer
  INTO v_trial_total, v_trial_aktif, v_trial_selesai, v_trial_konversi
  FROM public.booking b
  WHERE b.jenis = 'trial'::public.jenis_booking
    AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking);

  SELECT COALESCE(
    jsonb_agg(t.item ORDER BY t.dibuat_pada DESC),
    '[]'::jsonb
  )
  INTO v_daftar_trial
  FROM (
    SELECT
      b.dibuat_pada,
      jsonb_build_object(
        'booking_id', b.id,
        'kode', b.kode,
        'status', b.status,
        'dibuat_pada', b.dibuat_pada,
        'siswa_id', sw.id,
        'siswa_nama', sw.nama,
        'siswa_jenjang', sw.jenjang,
        'siswa_kelas', sw.kelas,
        'pemesan_nama', pem.nama,
        'pemesan_peran', pem.peran,
        'kelas_id', k.id,
        'program_nama', pr.nama,
        'program_slug', pr.slug,
        'kelas_level', k.level,
        'pengajar_nama', pg.nama,
        'sesi_1_mulai_pada', s1.mulai_pada,
        'sesi_1_status', s1.status,
        'sudah_lanjut_paket', EXISTS (
          SELECT 1
          FROM public.booking bp
          WHERE bp.siswa_id = b.siswa_id
            AND bp.jenis = 'paket'::public.jenis_booking
            AND bp.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
            AND bp.dibuat_pada >= b.dibuat_pada
        )
      ) AS item
    FROM public.booking b
    JOIN public.siswa sw ON sw.id = b.siswa_id
    JOIN public.pengguna pem ON pem.id = b.dibuat_oleh
    JOIN public.kelas k ON k.id = b.kelas_id
    JOIN public.program pr ON pr.id = k.program_id
    JOIN public.pengguna pg ON pg.id = k.pengajar_id
    LEFT JOIN public.sesi s1 ON s1.kelas_id = k.id AND s1.nomor = 1
    WHERE b.jenis = 'trial'::public.jenis_booking
      AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
    ORDER BY b.dibuat_pada DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'pengguna', jsonb_build_object(
      'total', v_total_pengguna,
      'orang_tua', v_orang_tua,
      'siswa_mandiri', v_siswa_mandiri,
      'pengajar_terverifikasi', v_pengajar_terverifikasi,
      'pengajar_menunggu', v_pengajar_menunggu,
      'profil_siswa', v_profil_siswa
    ),
    'pendapatan', jsonb_build_object(
      'omzet_kotor', v_omzet_kotor,
      'bagian_pengajar', v_bagian_pengajar,
      'pendapatan_bersih_platform', v_pendapatan_bersih_platform,
      'honor_tercatat', v_honor_tercatat,
      'honor_dibayar', v_honor_dibayar,
      'booking_lunas', v_booking_lunas,
      'booking_referral', v_booking_referral,
      'total_potongan_referral', v_total_potongan_referral
    ),
    'trial', jsonb_build_object(
      'total', v_trial_total,
      'aktif', v_trial_aktif,
      'selesai', v_trial_selesai,
      'konversi_paket', v_trial_konversi,
      'daftar_terbaru', v_daftar_trial
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_statistik_platform() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_statistik_platform() TO authenticated;
