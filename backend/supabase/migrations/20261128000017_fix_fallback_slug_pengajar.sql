-- ============================================================================
-- Migration 17: Perbaiki Fallback `buat_slug_pengajar_unik` & Normalisasi Aksen
--   1. Saat nama terlalu pendek (< 3), non-latin, format UUID, atau termasuk
--      daftar tercadang (termasuk 'pengajar'), kandidat pertama langsung mulai
--      dari 'pengajar-1', 'pengajar-2', dst. (selaras dengan CHECK constraint
--      & fungsi `buatSlugUnik` frontend pada ec3802b).
--   2. Hapus diakritik/aksen (normalize NFD) sebelum membentuk slug.
--   3. Pada trigger `isi_slug_profil_pengajar`, kirim '' jika nama NULL agar
--      fallback tetap masuk jalur 'pengajar-1'.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.buat_slug_pengajar_unik(
  p_nama text,
  p_abaikan_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_base text;
  v_kandidat text;
  v_n integer := 0;
BEGIN
  v_base := regexp_replace(normalize(COALESCE(p_nama, ''), NFD), E'[\\u0300-\\u036f]', '', 'g');
  v_base := lower(v_base);
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := btrim(v_base, '-');
  v_base := left(v_base, 32);
  v_base := btrim(v_base, '-');

  IF v_base = ''
     OR char_length(v_base) < 3
     OR v_base ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     OR v_base = ANY (ARRAY['admin','masuk','daftar','baru','profil','edit','api','auth','pengajar','kodie','kiko','support']) THEN
    v_base := 'pengajar';
    v_n := 1; -- 'pengajar' polos tercadang, jadi kandidat pertama 'pengajar-1'
  END IF;

  LOOP
    IF v_n = 0 THEN
      v_kandidat := v_base;
    ELSE
      v_kandidat := left(v_base, 32) || '-' || v_n::text;
    END IF;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.profil_pengajar pp
      WHERE pp.slug = v_kandidat
        AND (p_abaikan_id IS NULL OR pp.pengguna_id != p_abaikan_id)
    );

    v_n := v_n + 1;
  END LOOP;

  RETURN v_kandidat;
END;
$$;

REVOKE ALL ON FUNCTION public.buat_slug_pengajar_unik(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_slug_pengajar_unik(text, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.isi_slug_profil_pengajar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_nama text;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    SELECT u.nama INTO v_nama
    FROM public.pengguna u
    WHERE u.id = NEW.pengguna_id;

    NEW.slug := public.buat_slug_pengajar_unik(COALESCE(v_nama, ''), NEW.pengguna_id);
  ELSE
    NEW.slug := lower(btrim(NEW.slug));
  END IF;

  RETURN NEW;
END;
$$;
