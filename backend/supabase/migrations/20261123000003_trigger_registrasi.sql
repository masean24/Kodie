-- ============================================================================
-- Migration 3: Trigger Registrasi dari auth.users
-- Sumber kebenaran: docs/PRD.md Bagian 4 (F1, F7), Bagian 7, Bagian 8 & KEPUTUSAN.md
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tangani_pengguna_baru()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_app_meta jsonb := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  v_peran_teks text := NULLIF(btrim(v_meta->>'peran'), '');
  v_nama text := NULLIF(btrim(v_meta->>'nama'), '');
  v_no_wa text := NULLIF(btrim(v_meta->>'no_wa'), '');
  v_jenjang_teks text;
  v_kelas integer;
  v_tanggal_lahir date;
  v_keahlian public.bidang_it[];
BEGIN
  -- Hanya service_role Admin API yang dapat menulis raw_app_meta_data._seed_admin;
  -- registrasi publik (signUp) tidak pernah bisa mengisi app_metadata.
  IF COALESCE((v_app_meta->>'_seed_admin')::boolean, false) = true THEN
    RETURN NEW;
  END IF;

  -- Tolak peran admin dari registrasi publik
  IF v_peran_teks IS NULL OR v_peran_teks = 'admin' THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF v_peran_teks NOT IN ('orang_tua', 'siswa', 'pengajar') THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_nama IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_peran_teks = 'orang_tua' THEN
    INSERT INTO public.pengguna (id, peran, nama, no_wa, status)
    VALUES (NEW.id, 'orang_tua', v_nama, v_no_wa, 'aktif');

  ELSIF v_peran_teks = 'siswa' THEN
    v_jenjang_teks := NULLIF(btrim(v_meta->>'jenjang'), '');
    IF v_jenjang_teks IS NULL OR v_jenjang_teks NOT IN ('SMP', 'SMA') THEN
      -- Siswa SD tidak boleh mendaftar sendiri; wajib didaftarkan orang tua (F1)
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    BEGIN
      v_kelas := (v_meta->>'kelas')::integer;
      v_tanggal_lahir := (v_meta->>'tanggal_lahir')::date;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END;

    IF v_kelas IS NULL OR v_tanggal_lahir IS NULL THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    INSERT INTO public.pengguna (id, peran, nama, no_wa, status)
    VALUES (NEW.id, 'siswa', v_nama, v_no_wa, 'menunggu_persetujuan');

    INSERT INTO public.siswa (
      nama,
      tanggal_lahir,
      jenjang,
      kelas,
      sekolah,
      pengguna_id,
      nama_orang_tua,
      email_orang_tua
    )
    VALUES (
      v_nama,
      v_tanggal_lahir,
      v_jenjang_teks::public.jenjang_pendidikan,
      v_kelas,
      NULLIF(btrim(v_meta->>'sekolah'), ''),
      NEW.id,
      NULLIF(btrim(v_meta->>'nama_orang_tua'), ''),
      NULLIF(btrim(v_meta->>'email_orang_tua'), '')
    );

  ELSIF v_peran_teks = 'pengajar' THEN
    INSERT INTO public.pengguna (id, peran, nama, no_wa, status)
    VALUES (NEW.id, 'pengajar', v_nama, v_no_wa, 'menunggu_verifikasi');

    IF jsonb_typeof(v_meta->'keahlian') = 'array' THEN
      SELECT COALESCE(array_agg(elem::public.bidang_it), '{}'::public.bidang_it[])
      INTO v_keahlian
      FROM jsonb_array_elements_text(v_meta->'keahlian') AS elem
      WHERE elem IN ('software', 'jaringan', 'iot', 'ai_data');
    ELSE
      v_keahlian := '{}'::public.bidang_it[];
    END IF;

    INSERT INTO public.profil_pengajar (
      pengguna_id,
      status_kerja,
      kampus,
      jurusan,
      keahlian,
      cv_url
    )
    VALUES (
      NEW.id,
      CASE
        WHEN NULLIF(btrim(v_meta->>'status_kerja'), '') IN ('mahasiswa', 'lulusan', 'pencari_kerja')
        THEN (v_meta->>'status_kerja')::public.status_kerja_pengajar
        ELSE NULL
      END,
      NULLIF(btrim(v_meta->>'kampus'), ''),
      NULLIF(btrim(v_meta->>'jurusan'), ''),
      v_keahlian,
      NULLIF(btrim(v_meta->>'cv_url'), '')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.tangani_pengguna_baru();
