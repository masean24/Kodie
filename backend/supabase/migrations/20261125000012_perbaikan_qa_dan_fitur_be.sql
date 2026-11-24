-- ============================================================================
-- Migration 12: Penguatan Audit Privasi, Bio & Ulasan Pengajar Publik,
--               Silabus Sesi 1-4 Publik, dan Waitlist Kelas Penuh
-- Tindak lanjut temuan QA (docs/KEPUTUSAN.md & rangkuman_perbaikan_kodie.md)
-- Seluruh perubahan 100% backward-compatible dengan FE saat ini.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUDIT TRAIL PERSETUJUAN KEBIJAKAN PRIVASI (T-28, LH-03)
-- ----------------------------------------------------------------------------

ALTER TABLE public.pengguna
  ADD COLUMN IF NOT EXISTS privasi_disetujui_pada timestamptz NOT NULL DEFAULT now();

-- ----------------------------------------------------------------------------
-- 2. BIO GAYA MENGAJAR & VIEW ULASAN TERVERIFIKASI PENGAJAR (T-10, T-12, T-14, T-24)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profil_pengajar
  ADD COLUMN IF NOT EXISTS bio text CHECK (bio IS NULL OR char_length(bio) <= 600);

-- Perbarui tangani_pengguna_baru(): catat privasi_disetujui_pada & bio opsional pengajar
-- Tetap mempertahankan blokir role admin & blokir siswa SD mendaftar mandiri.
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
  v_bio text := NULLIF(btrim(v_meta->>'bio'), '');
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

  -- Tolak eksplisit bila FE mengirim privasi_disetujui = false (tetap backward-compatible jika tidak dikirim)
  IF lower(COALESCE(v_meta->>'privasi_disetujui', '')) = 'false' THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL'
      USING DETAIL = 'Persetujuan kebijakan privasi wajib dicentang';
  END IF;

  IF v_bio IS NOT NULL AND char_length(v_bio) > 600 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL'
      USING DETAIL = 'Bio pengajar maksimal 600 karakter';
  END IF;

  IF v_peran_teks = 'orang_tua' THEN
    INSERT INTO public.pengguna (id, peran, nama, no_wa, status, privasi_disetujui_pada)
    VALUES (NEW.id, 'orang_tua', v_nama, v_no_wa, 'aktif', now());

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

    INSERT INTO public.pengguna (id, peran, nama, no_wa, status, privasi_disetujui_pada)
    VALUES (NEW.id, 'siswa', v_nama, v_no_wa, 'menunggu_persetujuan', now());

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
    INSERT INTO public.pengguna (id, peran, nama, no_wa, status, privasi_disetujui_pada)
    VALUES (NEW.id, 'pengajar', v_nama, v_no_wa, 'menunggu_verifikasi', now());

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
      cv_url,
      bio
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
      NULLIF(btrim(v_meta->>'cv_url'), ''),
      v_bio
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Append kolom bio di akhir view pengajar_publik agar urutan kolom lama tidak berubah
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
  pp.bio
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

-- View publik ulasan terverifikasi pengajar (inisial pemberi + peran, tanpa identitas anak, min 3 rating)
CREATE OR REPLACE VIEW public.ulasan_pengajar_publik AS
SELECT
  r.id,
  k.pengajar_id,
  p.slug AS program_slug,
  p.nama AS program_nama,
  r.bintang,
  r.komentar,
  upper(left(btrim(u.nama), 1)) || '*** · ' ||
    CASE u.peran
      WHEN 'orang_tua'::public.peran_pengguna THEN 'Orang Tua'
      WHEN 'siswa'::public.peran_pengguna THEN 'Siswa'
      ELSE 'Peserta'
    END AS pemberi_label,
  r.dibuat_pada
FROM public.rating r
JOIN public.sesi s ON s.id = r.sesi_id
JOIN public.kelas k ON k.id = s.kelas_id
JOIN public.program p ON p.id = k.program_id
JOIN public.pengguna pg ON pg.id = k.pengajar_id
JOIN public.pengguna u ON u.id = r.pemberi_id
WHERE pg.peran = 'pengajar'::public.peran_pengguna
  AND pg.status = 'terverifikasi'::public.status_pengguna
  AND r.komentar IS NOT NULL
  AND char_length(btrim(r.komentar)) > 0
  AND (
    SELECT count(*)
    FROM public.rating r2
    JOIN public.sesi s2 ON s2.id = r2.sesi_id
    JOIN public.kelas k2 ON k2.id = s2.kelas_id
    WHERE k2.pengajar_id = k.pengajar_id
  ) >= 3
ORDER BY r.dibuat_pada DESC;

GRANT SELECT ON public.ulasan_pengajar_publik TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. SILABUS SESI 1-4 PUBLIK PADA TABEL PROGRAM (T-10, T-12, T-14, T-24)
-- ----------------------------------------------------------------------------

ALTER TABLE public.program
  ADD COLUMN IF NOT EXISTS silabus jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.program
SET silabus = '[
  {
    "sesi": 1,
    "judul": "Logika Urutan & Karakter Pertama",
    "topik": "Mengenal instruksi berurutan (sequence), Stage, Sprite, serta blok Events, Motion, dan Looks di Scratch.",
    "hasil_proyek": "Animasi karakter menyapa dan berjalan mengikuti urutan perintah."
  },
  {
    "sesi": 2,
    "judul": "Perulangan (Loop) & Animasi Halus",
    "topik": "Menggunakan blok repeat dan forever, pergantian kostum, dan pantulan otomatis saat menyentuh tepi layar.",
    "hasil_proyek": "Animasi akuarium atau karakter bergerak terus dengan latar kustom."
  },
  {
    "sesi": 3,
    "judul": "Percabangan Kondisi (If-Then) & Kontrol Keyboard",
    "topik": "Memahami logika sebab-akibat dengan blok if-then, sensor sentuh objek/warna, dan kontrol tombol arah.",
    "hasil_proyek": "Karakter interaktif yang merespons tombol dan rintangan."
  },
  {
    "sesi": 4,
    "judul": "Variabel Skor & Game Mini Interaktif",
    "topik": "Membuat variabel skor/nyawa, menggabungkan urutan, loop, dan kondisi menjadi game mini utuh.",
    "hasil_proyek": "Game tangkap objek sederhana siap dipamerkan ke orang tua."
  }
]'::jsonb
WHERE slug = 'coding-dasar';

UPDATE public.program
SET silabus = '[
  {
    "sesi": 1,
    "judul": "Fondasi Struktur Web HTML5",
    "topik": "Memahami cara browser membaca HTML, struktur tag semantik (heading, paragraf, daftar, gambar, tautan), dan Inspect Element.",
    "hasil_proyek": "Halaman web profil pelajar satu halaman."
  },
  {
    "sesi": 2,
    "judul": "Styling Modern dengan CSS & Flexbox",
    "topik": "Menerapkan selektor CSS, Box Model (margin, padding, border), serta penataan responsif memakai Flexbox.",
    "hasil_proyek": "Kartu profil dan galeri hobi modern yang rapi di laptop dan ponsel."
  },
  {
    "sesi": 3,
    "judul": "Interaktivitas Web dengan JavaScript & DOM",
    "topik": "Mengenal variabel, fungsi, event listener tombol/form, dan manipulasi elemen DOM secara langsung.",
    "hasil_proyek": "Aplikasi web catatan atau daftar tugas interaktif di browser."
  },
  {
    "sesi": 4,
    "judul": "Simulasi IoT Virtual & Pengenalan AI Dasar",
    "topik": "Merancang logika sensor dan LED di simulator Wokwi serta mencoba klasifikasi teks sederhana dengan AI.",
    "hasil_proyek": "Purwarupa lampu otomatis virtual dan demo asisten teks sederhana."
  }
]'::jsonb
WHERE slug = 'kelas-reguler-teknologi';

UPDATE public.program
SET silabus = '[
  {
    "sesi": 1,
    "judul": "Simulasi 1: Software Engineering",
    "topik": "Mengenal alur kerja Software Engineer, logika pemrograman antarmuka web, penanganan event, dan debugging dasar.",
    "hasil_proyek": "Aplikasi web mini Kalkulator Target Tabungan."
  },
  {
    "sesi": 2,
    "judul": "Simulasi 2: Jaringan Komputer & Keamanan Siber",
    "topik": "Memahami IP Address, DNS, router, protokol HTTP/HTTPS, inspeksi Network Tab, serta mengenali ancaman phishing.",
    "hasil_proyek": "Analisis lalu lintas request browser dan investigasi keamanan tautan."
  },
  {
    "sesi": 3,
    "judul": "Simulasi 3: Internet of Things (IoT) Virtual",
    "topik": "Mengenal mikrokontroler ESP32/Arduino, wiring sensor jarak & suhu, serta pemrograman logika perangkat di Wokwi.",
    "hasil_proyek": "Simulasi perangkat rumah pintar berbasis sensor otomatis."
  },
  {
    "sesi": 4,
    "judul": "Simulasi 4: AI & Sains Data + Rapor Jurusan",
    "topik": "Mencoba eksperimen klasifikasi teks AI, evaluasi kesalahan model, dan refleksi minat keempat bidang IT.",
    "hasil_proyek": "Notebook klasifikasi AI dan Rapor Rekomendasi Jurusan Kuliah."
  }
]'::jsonb
WHERE slug = 'simulasi-jurusan-it';

-- ----------------------------------------------------------------------------
-- 4. WAITLIST KELAS PENUH + NOTIFIKASI OTOMATIS (T-11, T-16, T-17)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_waitlist') THEN
    CREATE TYPE public.status_waitlist AS ENUM (
      'menunggu',
      'diberitahu',
      'dibatalkan'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.waitlist_kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  siswa_id uuid REFERENCES public.siswa(id) ON DELETE SET NULL,
  status public.status_waitlist NOT NULL DEFAULT 'menunggu',
  diberitahu_pada timestamptz,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_unik_aktif
  ON public.waitlist_kelas (kelas_id, pengguna_id)
  WHERE status = 'menunggu';

CREATE INDEX IF NOT EXISTS idx_waitlist_kelas_status
  ON public.waitlist_kelas (kelas_id, status, dibuat_pada ASC);

ALTER TABLE public.waitlist_kelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_kelas_select" ON public.waitlist_kelas;
CREATE POLICY "waitlist_kelas_select"
  ON public.waitlist_kelas FOR SELECT
  TO authenticated
  USING (
    pengguna_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
  );

GRANT SELECT ON public.waitlist_kelas TO authenticated;
GRANT ALL ON public.waitlist_kelas TO service_role;

CREATE OR REPLACE FUNCTION public.daftar_waitlist_kelas(
  p_kelas_id uuid,
  p_siswa_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kelas record;
  v_sesi1_mulai timestamptz;
  v_terpakai integer;
  v_existing record;
  v_waitlist_id uuid;
BEGIN
  IF auth.uid() IS NULL
     OR public.peran_saya() NOT IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna)
     OR public.status_saya() IS DISTINCT FROM 'aktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_kelas_id IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF p_siswa_id IS NOT NULL AND NOT public.adalah_siswa_saya(p_siswa_id) THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  PERFORM public.kedaluwarsakan_booking_lewat_batas();

  SELECT
    k.id,
    k.kapasitas,
    k.status AS kelas_status,
    p.aktif AS prog_aktif,
    u.status AS pengajar_status
  INTO v_kelas
  FROM public.kelas k
  JOIN public.program p ON p.id = k.program_id
  JOIN public.pengguna u ON u.id = k.pengajar_id
  WHERE k.id = p_kelas_id
  FOR UPDATE OF k;

  IF NOT FOUND
     OR v_kelas.kelas_status != 'terbuka'::public.status_kelas
     OR NOT v_kelas.prog_aktif
     OR v_kelas.pengajar_status != 'terverifikasi'::public.status_pengguna THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT s.mulai_pada INTO v_sesi1_mulai
  FROM public.sesi s
  WHERE s.kelas_id = p_kelas_id AND s.nomor = 1;

  IF v_sesi1_mulai IS NULL OR v_sesi1_mulai <= now() THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT count(*)::integer INTO v_terpakai
  FROM public.booking b
  WHERE b.kelas_id = p_kelas_id
    AND b.status IN (
      'menunggu_pembayaran'::public.status_booking,
      'menunggu_verifikasi'::public.status_booking,
      'terkonfirmasi'::public.status_booking
    );

  IF v_terpakai < v_kelas.kapasitas THEN
    RAISE EXCEPTION 'KELAS_MASIH_TERSEDIA';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = p_kelas_id
      AND b.status IN (
        'menunggu_pembayaran'::public.status_booking,
        'menunggu_verifikasi'::public.status_booking,
        'terkonfirmasi'::public.status_booking
      )
      AND (
        b.dibuat_oleh = auth.uid()
        OR (p_siswa_id IS NOT NULL AND b.siswa_id = p_siswa_id)
      )
  ) THEN
    RAISE EXCEPTION 'SUDAH_TERDAFTAR';
  END IF;

  SELECT * INTO v_existing
  FROM public.waitlist_kelas w
  WHERE w.kelas_id = p_kelas_id
    AND w.pengguna_id = auth.uid()
    AND w.status = 'menunggu'::public.status_waitlist
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_existing.id,
      'kelas_id', v_existing.kelas_id,
      'siswa_id', v_existing.siswa_id,
      'status', 'menunggu',
      'sudah_terdaftar', true
    );
  END IF;

  INSERT INTO public.waitlist_kelas (kelas_id, pengguna_id, siswa_id, status)
  VALUES (p_kelas_id, auth.uid(), p_siswa_id, 'menunggu'::public.status_waitlist)
  RETURNING id INTO v_waitlist_id;

  RETURN jsonb_build_object(
    'id', v_waitlist_id,
    'kelas_id', p_kelas_id,
    'siswa_id', p_siswa_id,
    'status', 'menunggu',
    'sudah_terdaftar', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.batal_waitlist_kelas(p_kelas_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_waitlist_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_kelas_id IS NULL THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.waitlist_kelas
  SET status = 'dibatalkan'::public.status_waitlist
  WHERE kelas_id = p_kelas_id
    AND pengguna_id = auth.uid()
    AND status = 'menunggu'::public.status_waitlist
  RETURNING id INTO v_waitlist_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  RETURN jsonb_build_object(
    'id', v_waitlist_id,
    'kelas_id', p_kelas_id,
    'status', 'dibatalkan'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.daftar_waitlist_kelas(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.batal_waitlist_kelas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.daftar_waitlist_kelas(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batal_waitlist_kelas(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.notifikasi_waitlist_kursi_tersedia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kelas record;
  v_sesi1_mulai timestamptz;
  v_terpakai integer;
  v_wait_ids uuid[];
BEGIN
  IF OLD.status NOT IN (
    'menunggu_pembayaran'::public.status_booking,
    'menunggu_verifikasi'::public.status_booking,
    'terkonfirmasi'::public.status_booking
  ) OR NEW.status NOT IN (
    'dibatalkan'::public.status_booking,
    'kedaluwarsa'::public.status_booking
  ) THEN
    RETURN NEW;
  END IF;

  SELECT
    k.id,
    k.kapasitas,
    k.status AS kelas_status,
    p.aktif AS prog_aktif,
    p.nama AS program_nama
  INTO v_kelas
  FROM public.kelas k
  JOIN public.program p ON p.id = k.program_id
  WHERE k.id = NEW.kelas_id;

  IF NOT FOUND
     OR v_kelas.kelas_status != 'terbuka'::public.status_kelas
     OR NOT v_kelas.prog_aktif THEN
    RETURN NEW;
  END IF;

  SELECT s.mulai_pada INTO v_sesi1_mulai
  FROM public.sesi s
  WHERE s.kelas_id = NEW.kelas_id AND s.nomor = 1;

  IF v_sesi1_mulai IS NULL OR v_sesi1_mulai <= now() THEN
    RETURN NEW;
  END IF;

  SELECT count(*)::integer INTO v_terpakai
  FROM public.booking b
  WHERE b.kelas_id = NEW.kelas_id
    AND b.status IN (
      'menunggu_pembayaran'::public.status_booking,
      'menunggu_verifikasi'::public.status_booking,
      'terkonfirmasi'::public.status_booking
    );

  IF v_terpakai >= v_kelas.kapasitas THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(w.id) INTO v_wait_ids
  FROM public.waitlist_kelas w
  WHERE w.kelas_id = NEW.kelas_id
    AND w.status = 'menunggu'::public.status_waitlist;

  IF v_wait_ids IS NULL OR cardinality(v_wait_ids) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT
    w.pengguna_id,
    'booking_status'::public.tipe_notifikasi,
    'Kursi kelas tersedia kembali',
    'Kursi pada kelas ' || v_kelas.program_nama || ' kembali terbuka. Segera pesan sebelum kuota penuh lagi.',
    '/kelas/' || NEW.kelas_id::text
  FROM public.waitlist_kelas w
  WHERE w.id = ANY(v_wait_ids);

  UPDATE public.waitlist_kelas
  SET
    status = 'diberitahu'::public.status_waitlist,
    diberitahu_pada = now()
  WHERE id = ANY(v_wait_ids);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notifikasi_waitlist_kursi_tersedia ON public.booking;
CREATE TRIGGER trg_notifikasi_waitlist_kursi_tersedia
  AFTER UPDATE OF status ON public.booking
  FOR EACH ROW
  EXECUTE FUNCTION public.notifikasi_waitlist_kursi_tersedia();
