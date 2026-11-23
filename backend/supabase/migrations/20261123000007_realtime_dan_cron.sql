-- ============================================================================
-- Migration 7: Publication Realtime & Tugas Terjadwal (pg_cron + pg_net)
-- Sumber kebenaran: docs/PRD.md Bagian 9
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REALTIME PUBLICATION UNTUK TABEL notifikasi
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifikasi'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifikasi;
    END IF;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. FUNGSI TUGAS TERJADWAL (CRON)
-- ----------------------------------------------------------------------------

-- 2.1 Kedaluwarsa booking (setiap 5 menit)
CREATE OR REPLACE FUNCTION public.cron_kedaluwarsa_booking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.kedaluwarsakan_booking_lewat_batas();
END;
$$;

-- 2.2 Kedaluwarsa token persetujuan (setiap 1 jam)
CREATE OR REPLACE FUNCTION public.cron_kedaluwarsa_token_persetujuan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.persetujuan_orang_tua
  SET status = 'kedaluwarsa'::public.status_persetujuan
  WHERE status = 'menunggu'::public.status_persetujuan
    AND kedaluwarsa_pada <= now();
END;
$$;

-- 2.3 Pengingat sesi dimulai 1 jam lagi (setiap 5 menit)
CREATE OR REPLACE FUNCTION public.cron_pengingat_sesi()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_tautan_pengajar text;
BEGIN
  FOR v_sesi IN
    SELECT s.id, s.kelas_id, s.nomor, s.mulai_pada, k.pengajar_id, p.nama AS program_nama
    FROM public.sesi s
    JOIN public.kelas k ON k.id = s.kelas_id
    JOIN public.program p ON p.id = k.program_id
    WHERE s.status = 'terjadwal'::public.status_sesi
      AND k.status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas)
      AND s.mulai_pada > now() + interval '50 minutes'
      AND s.mulai_pada <= now() + interval '65 minutes'
  LOOP
    v_tautan_pengajar := '/mengajar/kelas/' || v_sesi.kelas_id::text;

    -- Notifikasi pengajar jika belum dikirim untuk sesi ini
    IF NOT EXISTS (
      SELECT 1 FROM public.notifikasi n
      WHERE n.pengguna_id = v_sesi.pengajar_id
        AND n.tipe = 'pengingat'::public.tipe_notifikasi
        AND n.tautan = v_tautan_pengajar
        AND n.judul = 'Sesi dimulai 1 jam lagi'
        AND n.dibuat_pada > now() - interval '3 hours'
    ) THEN
      INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
      VALUES (
        v_sesi.pengajar_id,
        'pengingat'::public.tipe_notifikasi,
        'Sesi dimulai 1 jam lagi',
        'Sesi ' || v_sesi.nomor || ' kelas ' || v_sesi.program_nama || ' akan dimulai dalam 1 jam.',
        v_tautan_pengajar
      );
    END IF;

    -- Notifikasi siswa & orang tua yang terkonfirmasi
    INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
    SELECT DISTINCT
      target.uid,
      'pengingat'::public.tipe_notifikasi,
      'Sesi dimulai 1 jam lagi',
      'Sesi ' || v_sesi.nomor || ' kelas ' || v_sesi.program_nama || ' akan dimulai dalam 1 jam.',
      CASE
        WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/sesi/' || v_sesi.id::text
        ELSE '/siswa/sesi/' || v_sesi.id::text
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
      AND b.status = 'terkonfirmasi'::public.status_booking
      AND NOT EXISTS (
        SELECT 1 FROM public.notifikasi n
        WHERE n.pengguna_id = target.uid
          AND n.tipe = 'pengingat'::public.tipe_notifikasi
          AND n.judul = 'Sesi dimulai 1 jam lagi'
          AND n.tautan = CASE
            WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/sesi/' || v_sesi.id::text
            ELSE '/siswa/sesi/' || v_sesi.id::text
          END
          AND n.dibuat_pada > now() - interval '3 hours'
      );
  END LOOP;
END;
$$;

-- 2.4 Pengingat laporan belum dikirim 2 jam setelah sesi berakhir (setiap 15 menit)
CREATE OR REPLACE FUNCTION public.cron_pengingat_laporan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sesi record;
  v_tautan text;
BEGIN
  FOR v_sesi IN
    SELECT s.id, s.nomor, k.pengajar_id, p.nama AS program_nama
    FROM public.sesi s
    JOIN public.kelas k ON k.id = s.kelas_id
    JOIN public.program p ON p.id = k.program_id
    WHERE s.status = 'terjadwal'::public.status_sesi
      AND s.selesai_pada <= now() - interval '2 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.laporan_sesi ls WHERE ls.sesi_id = s.id
      )
      AND EXISTS (
        SELECT 1 FROM public.booking b
        WHERE b.kelas_id = k.id AND b.status = 'terkonfirmasi'::public.status_booking
      )
  LOOP
    v_tautan := '/mengajar/sesi/' || v_sesi.id::text || '/laporan';

    IF NOT EXISTS (
      SELECT 1 FROM public.notifikasi n
      WHERE n.pengguna_id = v_sesi.pengajar_id
        AND n.tipe = 'pengingat'::public.tipe_notifikasi
        AND n.tautan = v_tautan
        AND n.dibuat_pada > now() - interval '12 hours'
    ) THEN
      INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
      VALUES (
        v_sesi.pengajar_id,
        'pengingat'::public.tipe_notifikasi,
        'Pengingat laporan sesi',
        'Laporan untuk sesi ' || v_sesi.nomor || ' kelas ' || v_sesi.program_nama || ' belum dikirim.',
        v_tautan
      );
    END IF;
  END LOOP;
END;
$$;

-- 2.5 Update status kelas otomatis (setiap 15 menit)
CREATE OR REPLACE FUNCTION public.cron_status_kelas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Kelas menjadi 'berjalan' saat sesi 1 dimulai
  UPDATE public.kelas k
  SET status = 'berjalan'::public.status_kelas
  WHERE k.status = 'terbuka'::public.status_kelas
    AND EXISTS (
      SELECT 1 FROM public.sesi s1
      WHERE s1.kelas_id = k.id
        AND s1.nomor = 1
        AND s1.mulai_pada <= now()
    );

  -- Kelas menjadi 'selesai' setelah sesi 4 punya laporan
  UPDATE public.kelas k
  SET status = 'selesai'::public.status_kelas
  WHERE k.status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas)
    AND EXISTS (
      SELECT 1
      FROM public.sesi s4
      JOIN public.laporan_sesi ls ON ls.sesi_id = s4.id
      WHERE s4.kelas_id = k.id
        AND s4.nomor = 4
    );
END;
$$;

-- 2.6 Coba ulang membuat link Google Meet via Edge Function buat-meet (setiap 15 menit)
-- Catatan: Membutuhkan Supabase Vault secrets `project_url` dan `service_role_key`
-- atau akan dilewati dengan aman jika belum dikonfigurasi di Vault.
CREATE OR REPLACE FUNCTION public.cron_coba_ulang_meet()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.sesi s
    WHERE s.status = 'terjadwal'::public.status_sesi
      AND s.meet_uri IS NULL
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RETURN;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
    WHERE name = 'project_url'
    LIMIT 1;

    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN;
  END;

  IF NULLIF(v_url, '') IS NULL OR NULLIF(v_key, '') IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/buat-meet',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cron_kedaluwarsa_booking() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_kedaluwarsa_token_persetujuan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_pengingat_sesi() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_pengingat_laporan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_status_kelas() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cron_coba_ulang_meet() FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 3. PENJADWALAN pg_cron
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    CREATE EXTENSION IF NOT EXISTS pg_net;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobname)
    FROM cron.job
    WHERE jobname IN (
      'kedaluwarsa-booking',
      'kedaluwarsa-token-persetujuan',
      'pengingat-sesi',
      'pengingat-laporan',
      'status-kelas',
      'coba-ulang-meet'
    );

    PERFORM cron.schedule('kedaluwarsa-booking', '*/5 * * * *', 'SELECT public.cron_kedaluwarsa_booking();');
    PERFORM cron.schedule('kedaluwarsa-token-persetujuan', '0 * * * *', 'SELECT public.cron_kedaluwarsa_token_persetujuan();');
    PERFORM cron.schedule('pengingat-sesi', '*/5 * * * *', 'SELECT public.cron_pengingat_sesi();');
    PERFORM cron.schedule('pengingat-laporan', '*/15 * * * *', 'SELECT public.cron_pengingat_laporan();');
    PERFORM cron.schedule('status-kelas', '*/15 * * * *', 'SELECT public.cron_status_kelas();');
    PERFORM cron.schedule('coba-ulang-meet', '*/15 * * * *', 'SELECT public.cron_coba_ulang_meet();');
  END IF;
END;
$$;
