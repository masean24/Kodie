-- ============================================================================
-- Migration 16: Slug Kustom & Otomatis Profil Publik Pengajar (`/pengajar/[slug]`)
--   1. Tambah `profil_pengajar.slug` (UNIQUE, CHECK 3–40 huruf kecil/angka/hyphen)
--   2. Backfill akun pengajar yang sudah ada + trigger BEFORE INSERT otomatis
--   3. RPC `ubah_slug_pengajar(p_slug)` (error SLUG_TIDAK_VALID / SLUG_SUDAH_DIPAKAI)
--   4. Ekspos `slug` di `pengajar_publik` & `pengajar_slug` di `kelas_katalog`
-- ============================================================================

-- 1. Helper pembentuk slug unik dari nama pengajar
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
  v_base := lower(COALESCE(p_nama, ''));
  v_base := regexp_replace(v_base, '[^a-z0-9]+', '-', 'g');
  v_base := btrim(v_base, '-');
  v_base := left(v_base, 32);
  v_base := btrim(v_base, '-');

  IF v_base = ''
     OR char_length(v_base) < 3
     OR v_base ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     OR v_base = ANY (ARRAY['admin','masuk','daftar','baru','profil','edit','api','auth','pengajar','kodie','kiko','support']) THEN
    v_base := 'pengajar';
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

-- 2. Tambah kolom `slug`, backfill baris eksisting, & pasang constraint + trigger
ALTER TABLE public.profil_pengajar
  ADD COLUMN IF NOT EXISTS slug text;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT pp.pengguna_id, u.nama
    FROM public.profil_pengajar pp
    JOIN public.pengguna u ON u.id = pp.pengguna_id
    WHERE pp.slug IS NULL OR btrim(pp.slug) = ''
    ORDER BY pp.diverifikasi_pada NULLS LAST, pp.pengguna_id ASC
  LOOP
    UPDATE public.profil_pengajar
    SET slug = public.buat_slug_pengajar_unik(r.nama, r.pengguna_id)
    WHERE pengguna_id = r.pengguna_id;
  END LOOP;
END;
$$;

ALTER TABLE public.profil_pengajar
  ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.profil_pengajar
  DROP CONSTRAINT IF EXISTS uq_profil_pengajar_slug,
  ADD CONSTRAINT uq_profil_pengajar_slug UNIQUE (slug);

ALTER TABLE public.profil_pengajar
  DROP CONSTRAINT IF EXISTS chk_profil_pengajar_slug,
  ADD CONSTRAINT chk_profil_pengajar_slug CHECK (
    char_length(slug) BETWEEN 3 AND 40
    AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND slug NOT IN ('admin','masuk','daftar','baru','profil','edit','api','auth','pengajar','kodie','kiko','support')
  );

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

    NEW.slug := public.buat_slug_pengajar_unik(COALESCE(v_nama, 'pengajar'), NEW.pengguna_id);
  ELSE
    NEW.slug := lower(btrim(NEW.slug));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_isi_slug_profil_pengajar ON public.profil_pengajar;
CREATE TRIGGER trg_isi_slug_profil_pengajar
  BEFORE INSERT ON public.profil_pengajar
  FOR EACH ROW
  EXECUTE FUNCTION public.isi_slug_profil_pengajar();

-- 3. RPC ubah_slug_pengajar(p_slug) agar pengajar bisa mengkustomisasi username tautan profil
CREATE OR REPLACE FUNCTION public.ubah_slug_pengajar(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_slug text := lower(btrim(COALESCE(p_slug, '')));
BEGIN
  IF auth.uid() IS NULL
     OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna
     OR public.status_saya() = 'nonaktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF char_length(v_slug) < 3
     OR char_length(v_slug) > 40
     OR v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     OR v_slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     OR v_slug = ANY (ARRAY['admin','masuk','daftar','baru','profil','edit','api','auth','pengajar','kodie','kiko','support']) THEN
    RAISE EXCEPTION 'SLUG_TIDAK_VALID';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profil_pengajar pp
    WHERE pp.slug = v_slug
      AND pp.pengguna_id != auth.uid()
  ) THEN
    RAISE EXCEPTION 'SLUG_SUDAH_DIPAKAI';
  END IF;

  BEGIN
    UPDATE public.profil_pengajar
    SET slug = v_slug
    WHERE pengguna_id = auth.uid();
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'SLUG_SUDAH_DIPAKAI';
  END;

  RETURN jsonb_build_object(
    'pengajar_id', auth.uid(),
    'slug', v_slug
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ubah_slug_pengajar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ubah_slug_pengajar(text) TO authenticated;

-- 4. Append `slug` di akhir `pengajar_publik` & `pengajar_slug` di akhir `kelas_katalog`
CREATE OR REPLACE VIEW public.pengajar_publik AS
SELECT
  u.id,
  u.nama,
  pp.status_kerja,
  pp.kampus,
  pp.jurusan,
  pp.keahlian,
  pp.cv_url,
  pp.foto_path,
  pp.diverifikasi_pada,
  COALESCE(prog.program_ids, '{}'::uuid[]) AS program_ids,
  COALESCE(rt.jumlah_rating, 0)::integer AS jumlah_rating,
  CASE
    WHEN COALESCE(rt.jumlah_rating, 0) >= 3 THEN rt.rata_rata
    ELSE NULL
  END AS rata_rata_rating,
  pp.bio,
  pp.slug
FROM public.pengguna u
JOIN public.profil_pengajar pp ON pp.pengguna_id = u.id
LEFT JOIN LATERAL (
  SELECT array_agg(pgp.program_id ORDER BY pgp.program_id) AS program_ids
  FROM public.pengajar_program pgp
  WHERE pgp.pengajar_id = u.id AND pgp.disetujui = true
) prog ON true
LEFT JOIN LATERAL (
  SELECT
    count(*)::integer AS jumlah_rating,
    round(avg(r.bintang)::numeric, 2) AS rata_rata
  FROM public.rating r
  JOIN public.sesi s ON s.id = r.sesi_id
  JOIN public.kelas k ON k.id = s.kelas_id
  WHERE k.pengajar_id = u.id
) rt ON true
WHERE u.peran = 'pengajar'::public.peran_pengguna
  AND u.status = 'terverifikasi'::public.status_pengguna;

GRANT SELECT ON public.pengajar_publik TO anon, authenticated;

CREATE OR REPLACE VIEW public.kelas_katalog AS
SELECT
  k.id,
  k.program_id,
  p.slug AS program_slug,
  p.nama AS program_nama,
  p.jenjang,
  p.kelas_min,
  p.kelas_maks,
  k.level,
  p.durasi_menit,
  p.jumlah_sesi,
  p.harga_paket,
  k.pengajar_id,
  u.nama AS pengajar_nama,
  pp.foto_path AS pengajar_foto_path,
  k.kapasitas,
  COALESCE(bk.terpakai, 0)::integer AS kursi_terpakai,
  GREATEST(k.kapasitas - COALESCE(bk.terpakai, 0), 0)::integer AS sisa_kursi,
  k.jam_mulai,
  s1.mulai_pada AS sesi_pertama_mulai_pada,
  EXTRACT(ISODOW FROM (s1.mulai_pada AT TIME ZONE 'Asia/Jakarta'))::integer AS hari_mingguan,
  k.status,
  (
    k.status = 'terbuka'::public.status_kelas
    AND s1.mulai_pada > now()
    AND (k.kapasitas - COALESCE(bk.terpakai, 0)) > 0
  ) AS bisa_dibooking,
  k.dibuat_pada,
  pp.slug AS pengajar_slug
FROM public.kelas k
JOIN public.program p ON p.id = k.program_id
JOIN public.pengguna u ON u.id = k.pengajar_id
JOIN public.profil_pengajar pp ON pp.pengguna_id = k.pengajar_id
LEFT JOIN LATERAL (
  SELECT s.mulai_pada
  FROM public.sesi s
  WHERE s.kelas_id = k.id AND s.nomor = 1
  LIMIT 1
) s1 ON true
LEFT JOIN LATERAL (
  SELECT count(*)::integer AS terpakai
  FROM public.booking b
  WHERE b.kelas_id = k.id
    AND (
      b.status IN ('menunggu_verifikasi', 'terkonfirmasi')
      OR (b.status = 'menunggu_pembayaran' AND b.batas_bayar_pada > now())
    )
) bk ON true
WHERE p.aktif = true
  AND u.status = 'terverifikasi'::public.status_pengguna
  AND k.status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas);

GRANT SELECT ON public.kelas_katalog TO anon, authenticated;
