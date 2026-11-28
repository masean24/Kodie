-- ============================================================================
-- Migration 14: Spesifikasi Backend 2026-11-28 (Saran Dosen Pembimbing)
--   1. Jenjang TK (kelas = 0, kapasitas maks. 6) & Program baru `kenal-komputer`
--      beserta pembaruan harga paket (225rb / 250rb / 350rb / 400rb) & playbook
--   2. Tabel `kode_referral` + RPC `buat_kode_referral()` (unik, idempoten)
--   3. Kolom `booking.jenis`, `kode_referral`, `potongan`; perbarui `buat_booking`
--      (potongan 5% referral); tambah `buat_booking_trial` + isolasi Sesi 1
--   4. Skema bagi hasil 30% / 40% di `kirim_laporan` + view `perkiraan_bagi_hasil_saya`
--   5. Tabel `pengalaman_pengajar` & `sertifikat_pengajar` + RPC
--      `simpan_detail_profil_pengajar` (RLS baca publik untuk pengajar terverifikasi)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JENJANG TK PADA SISWA, PROGRAM, KAPASITAS KELAS, & TES MINAT
-- ----------------------------------------------------------------------------

ALTER TABLE public.siswa
  DROP CONSTRAINT IF EXISTS chk_siswa_jenjang_kelas,
  ADD CONSTRAINT chk_siswa_jenjang_kelas CHECK (
    (jenjang = 'TK'::public.jenjang_pendidikan AND kelas = 0) OR
    (jenjang = 'SD'::public.jenjang_pendidikan AND kelas BETWEEN 1 AND 6) OR
    (jenjang = 'SMP'::public.jenjang_pendidikan AND kelas BETWEEN 7 AND 9) OR
    (jenjang = 'SMA'::public.jenjang_pendidikan AND kelas BETWEEN 10 AND 12)
  );

ALTER TABLE public.siswa
  DROP CONSTRAINT IF EXISTS chk_siswa_sd_wajib_orang_tua,
  ADD CONSTRAINT chk_siswa_sd_wajib_orang_tua CHECK (
    jenjang NOT IN ('TK'::public.jenjang_pendidikan, 'SD'::public.jenjang_pendidikan)
    OR (orang_tua_id IS NOT NULL AND pengguna_id IS NULL)
  );

-- Izinkan `program.kelas_min` mulai dari 0 (TK B)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'public.program'::regclass
      AND contype = 'c'
  LOOP
    IF r.def LIKE '%kelas_min%' AND r.def NOT LIKE '%kelas_maks%' THEN
      EXECUTE format('ALTER TABLE public.program DROP CONSTRAINT IF EXISTS %I', r.conname);
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.program
  DROP CONSTRAINT IF EXISTS chk_program_kelas_min,
  ADD CONSTRAINT chk_program_kelas_min CHECK (kelas_min BETWEEN 0 AND 12);

-- Trigger kapasitas kelas: TK maks 6, SD maks 10, SMP/SMA maks 15
CREATE OR REPLACE FUNCTION public.cek_kapasitas_kelas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_jenjang public.jenjang_pendidikan[];
  v_maks integer;
BEGIN
  SELECT p.jenjang INTO v_jenjang
  FROM public.program p
  WHERE p.id = NEW.program_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL' USING DETAIL = 'Program tidak ditemukan';
  END IF;

  IF 'TK'::public.jenjang_pendidikan = ANY(v_jenjang) THEN
    v_maks := 6;
  ELSIF 'SD'::public.jenjang_pendidikan = ANY(v_jenjang) THEN
    v_maks := 10;
  ELSE
    v_maks := 15;
  END IF;

  IF NEW.kapasitas < 1 OR NEW.kapasitas > v_maks THEN
    RAISE EXCEPTION 'KAPASITAS_TIDAK_VALID';
  END IF;

  RETURN NEW;
END;
$$;

-- Program baru: Kenal Komputer + perbarui harga paket 2026-11-28
INSERT INTO public.program (
  id,
  slug,
  nama,
  jenjang,
  kelas_min,
  kelas_maks,
  level,
  deskripsi,
  durasi_menit,
  jumlah_sesi,
  harga_paket,
  honor_per_sesi,
  aktif,
  silabus
)
VALUES (
  '11111111-1111-4111-8111-000000000004',
  'kenal-komputer',
  'Kenal Komputer',
  ARRAY['TK', 'SD']::public.jenjang_pendidikan[],
  0,
  1,
  1,
  'Kenalan dengan komputer untuk anak usia 5–7 tahun: memakai mouse dan keyboard, membuka aplikasi di Windows, menyimpan karya ke folder, dan aman di internet. Didampingi orang tua di setiap sesi.',
  45,
  4,
  225000,
  0,
  true,
  '[
    {"sesi":1,"judul":"Halo Komputer: Mouse, Keyboard, dan Layar","topik":"Mengenal bagian komputer, menyalakan dan mematikan dengan benar, menggerakkan mouse, klik dan klik dua kali, serta posisi duduk yang sehat.","hasil_proyek":"Mewarnai gambar di Paint dengan klik dan seret."},
    {"sesi":2,"judul":"Jelajah Windows: Desktop, Ikon, dan Jendela","topik":"Mengenal desktop, menu Start, membuka dan menutup aplikasi, memperbesar, mengecilkan, dan memindahkan jendela.","hasil_proyek":"Membuka tiga aplikasi sendiri dan menatanya berdampingan."},
    {"sesi":3,"judul":"Rumah untuk Karya: Folder dan File","topik":"Membuat folder, memberi nama, menyimpan gambar ke folder yang tepat, menyalin, memindahkan, dan menghapus file dengan aman.","hasil_proyek":"Folder \"Karyaku\" berisi gambar dari sesi 1 dan 2 yang tersusun rapi."},
    {"sesi":4,"judul":"Mengetik Nama dan Aman di Internet","topik":"Mengetik huruf dan angka di keyboard, membuka peramban bersama orang tua, dan aturan aman: tidak membagikan data pribadi.","hasil_proyek":"Kartu nama digital sederhana disimpan di folder \"Karyaku\"."}
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  nama = EXCLUDED.nama,
  jenjang = EXCLUDED.jenjang,
  kelas_min = EXCLUDED.kelas_min,
  kelas_maks = EXCLUDED.kelas_maks,
  level = EXCLUDED.level,
  deskripsi = EXCLUDED.deskripsi,
  durasi_menit = EXCLUDED.durasi_menit,
  jumlah_sesi = EXCLUDED.jumlah_sesi,
  harga_paket = EXCLUDED.harga_paket,
  honor_per_sesi = EXCLUDED.honor_per_sesi,
  aktif = EXCLUDED.aktif,
  silabus = EXCLUDED.silabus;

UPDATE public.program SET harga_paket = 250000 WHERE slug = 'coding-dasar';
UPDATE public.program SET harga_paket = 350000 WHERE slug = 'kelas-reguler-teknologi';
UPDATE public.program SET harga_paket = 400000 WHERE slug = 'simulasi-jurusan-it';

-- Playbook Sesi 1–4 untuk Kenal Komputer (45 menit, pendampingan orang tua)
INSERT INTO public.playbook (program_id, level, nomor_sesi, judul, konten_md, starter_url)
VALUES
  (
    '11111111-1111-4111-8111-000000000004',
    1,
    1,
    'Kenal Komputer Sesi 1: Mouse, Keyboard, dan Layar',
    $md$## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengenal layar monitor, mouse, dan keyboard dengan posisi duduk yang nyaman.
2. Melakukan gerakan mouse, klik kiri, klik dua kali, dan klik-seret di Paint.

## Persiapan pengajar
- Pastikan orang tua mendampingi anak di samping perangkat pada awal kelas.
- Siapkan contoh gambar rumah sederhana di Paint.

## Alur kelas (45 menit)
- **00–07 Pembukaan:** Sapa anak dan orang tua, periksa layar serta posisi tangan di mouse.
- **07–25 Praktik terpandu:** Buka aplikasi Paint, pilih kuas dan warna, latih klik-seret membentuk garis dan lingkaran.
- **25–38 Tantangan:** Anak mewarnai bentuk matahari dan rumah dengan minimal 3 warna berbeda.
- **38–45 Penutup:** Anak memamerkan gambar di layar; apresiasi bersama orang tua.

## Tantangan untuk siswa
1. **Dasar:** Gambar satu bentuk rumah atau wajah tersenyum memakai kuas warna favorit di Paint.
2. **Lanjutan:** Isi warna di dalam gambar menggunakan ikon ember cat (*Fill*).

## Kunci jawaban dan solusi umum
- *Warna tumpah ke seluruh layar:* Pastikan bentuk bangun tertutup rapat atau gunakan tombol Undo (`Ctrl+Z`).
- *Mouse terasa terlalu cepat:* Minta orang tua membantu memegangi tangan anak perlahan di langkah awal.

## Catatan keamanan
- Kelas anak usia 5–7 tahun wajib didampingi orang tua dan selalu lewat link resmi platform.$md$,
    NULL
  ),
  (
    '11111111-1111-4111-8111-000000000004',
    1,
    2,
    'Kenal Komputer Sesi 2: Desktop, Ikon, dan Jendela',
    $md$## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengenali tampilan Desktop, menu Start, dan ikon aplikasi.
2. Membuka, memperbesar, mengecilkan, memindahkan, dan menutup jendela aplikasi.

## Persiapan pengajar
- Siapkan 3 aplikasi bawaan (Paint, Notepad, Kalkulator) untuk simulasi buka-tutup.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Ulas klik dan klik dua kali dari sesi 1.
- **06–25 Praktik terpandu:** Membuka menu Start, mengenali tombol minimalkan (`_`), maksimalkan (`□`), dan tutup (`×`).
- **25–38 Tantangan:** Anak membuka Paint dan Kalkulator bersamaan lalu menatanya berdampingan.
- **38–45 Penutup:** Rangkuman fungsi tombol jendela dan pratinjau folder di sesi 3.

## Tantangan untuk siswa
1. **Dasar:** Buka aplikasi Notepad lewat menu Start, lalu kecilkan dan besarkan lagi jendelanya.
2. **Lanjutan:** Susun jendela Paint di sebelah kiri dan Notepad di sebelah kanan.

## Kunci jawaban dan solusi umum
- *Jendela hilang ke bawah:* Arahkan anak melihat ikon aplikasi yang menyala di taskbar bawah.

## Catatan keamanan
- Pastikan orang tua mendampingi saat menavigasi menu sistem agar tidak menutup jendela Meet secara tidak sengaja.$md$,
    NULL
  ),
  (
    '11111111-1111-4111-8111-000000000004',
    1,
    3,
    'Kenal Komputer Sesi 3: Folder dan File Karyaku',
    $md$## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Memahami konsep folder sebagai "rumah" tempat menyimpan file karya.
2. Membuat folder bernama `Karyaku` dan menyimpan gambar Paint ke dalamnya.

## Persiapan pengajar
- Siapkan contoh folder rapi di Desktop untuk demonstrasi *File Explorer*.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Analogi lemari map dan laci penyimpanan untuk mengenalkan folder dan file.
- **06–25 Praktik terpandu:** Klik kanan di Desktop/Dokumen untuk membuat folder `Karyaku`, lalu simpan file gambar ke folder itu.
- **25–38 Tantangan:** Anak membuat satu gambar baru, menyimpannya dengan nama sendiri di folder `Karyaku`, lalu membukanya kembali.
- **38–45 Penutup:** Apresiasi anak karena sudah bisa merapikan karyanya sendiri.

## Tantangan untuk siswa
1. **Dasar:** Buat folder bernama `Karyaku` dan simpan minimal 1 gambar di dalamnya.
2. **Lanjutan:** Salin satu gambar ke folder tersebut atau ubah namanya menjadi `gambar-aku`.

## Kunci jawaban dan solusi umum
- *Lupa lokasi menyimpan file:* Cek bilah lokasi paling kiri di jendela Save As (`Desktop` atau `Documents`).

## Catatan keamanan
- Ingatkan anak hanya menghapus atau memindahkan file karyanya sendiri di folder `Karyaku`, jangan menyentuh folder sistem.$md$,
    NULL
  ),
  (
    '11111111-1111-4111-8111-000000000004',
    1,
    4,
    'Kenal Komputer Sesi 4: Mengetik Nama & Aman di Internet',
    $md$## Tujuan sesi
Setelah sesi ini, anak (didampingi orang tua) bisa:
1. Mengetik huruf kapital, spasi, dan angka di keyboard untuk membuat kartu nama digital di Notepad/Paint.
2. Memahami aturan dasar aman berinternet bersama orang tua.

## Persiapan pengajar
- Siapkan ilustrasi lampu hijau/merah aturan aman internet untuk anak usia dini.

## Alur kelas (45 menit)
- **00–06 Pembukaan:** Kenali tombol `Shift`, `Space`, `Enter`, dan `Backspace` di keyboard.
- **06–25 Praktik terpandu:** Mengetik nama panggilan, kelas, dan hobi singkat di Notepad/Paint menjadi kartu nama digital.
- **25–37 Tantangan & Keamanan:** Menyimpan kartu nama ke folder `Karyaku`, lalu kuis singkat memilih hal yang boleh vs tidak boleh dibagikan online.
- **37–45 Penutup:** Showcase kartu nama karya semua anak; tutup program Kenal Komputer Level 1 bersama orang tua.

## Tantangan untuk siswa
1. **Dasar:** Ketik nama panggilan dan 1 benda/warna kesukaan, lalu simpan di folder `Karyaku`.
2. **Lanjutan:** Tambahkan gambar bintang di samping nama menggunakan aplikasi Paint.

## Kunci jawaban dan solusi umum
- *Huruf besar semua terus-menerus:* Cek lampu tombol `Caps Lock` dan tekan sekali untuk mematikannya.

## Catatan keamanan
- Tekankan aturan wajib: anak tidak pernah membuka peramban tanpa orang tua dan tidak membagikan alamat rumah, nomor HP, atau foto pribadi di internet.$md$,
    NULL
  )
ON CONFLICT (program_id, level, nomor_sesi) DO UPDATE SET
  judul = EXCLUDED.judul,
  konten_md = EXCLUDED.konten_md,
  starter_url = EXCLUDED.starter_url;

-- ----------------------------------------------------------------------------
-- 2. KODE REFERRAL PENGAJAR
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kode_referral (
  pengajar_id uuid PRIMARY KEY REFERENCES public.pengguna(id) ON DELETE CASCADE,
  kode text NOT NULL UNIQUE CHECK (kode ~ '^[A-Z0-9-]{4,20}$'),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kode_referral ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kode_referral_select" ON public.kode_referral;
CREATE POLICY "kode_referral_select"
  ON public.kode_referral FOR SELECT
  TO authenticated
  USING (
    pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
  );

GRANT SELECT ON public.kode_referral TO authenticated;
GRANT ALL ON public.kode_referral TO service_role;

CREATE OR REPLACE FUNCTION public.buat_kode_referral()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing record;
  v_nama text;
  v_prefix text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_suffix text;
  v_kode text;
  v_attempt integer := 0;
  v_idx integer;
  v_inserted record;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF public.status_saya() IS DISTINCT FROM 'terverifikasi'::public.status_pengguna THEN
    RAISE EXCEPTION 'PENGAJAR_BELUM_TERVERIFIKASI';
  END IF;

  SELECT * INTO v_existing
  FROM public.kode_referral kr
  WHERE kr.pengajar_id = auth.uid();

  IF FOUND THEN
    RETURN jsonb_build_object(
      'pengajar_id', v_existing.pengajar_id,
      'kode', v_existing.kode,
      'dibuat_pada', v_existing.dibuat_pada
    );
  END IF;

  SELECT u.nama INTO v_nama
  FROM public.pengguna u
  WHERE u.id = auth.uid();

  v_prefix := left(regexp_replace(upper(COALESCE(v_nama, '')), '[^A-Z]', '', 'g'), 5);
  IF char_length(v_prefix) = 0 THEN
    v_prefix := 'KODIE';
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_suffix := '';
    FOR i IN 1..4 LOOP
      v_idx := (get_byte(extensions.gen_random_bytes(1), 0) % 32) + 1;
      v_suffix := v_suffix || substr(v_alphabet, v_idx, 1);
    END LOOP;
    v_kode := v_prefix || '-' || v_suffix;

    BEGIN
      INSERT INTO public.kode_referral (pengajar_id, kode)
      VALUES (auth.uid(), v_kode)
      RETURNING * INTO v_inserted;

      RETURN jsonb_build_object(
        'pengajar_id', v_inserted.pengajar_id,
        'kode', v_inserted.kode,
        'dibuat_pada', v_inserted.dibuat_pada
      );
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO v_existing
      FROM public.kode_referral kr
      WHERE kr.pengajar_id = auth.uid();

      IF FOUND THEN
        RETURN jsonb_build_object(
          'pengajar_id', v_existing.pengajar_id,
          'kode', v_existing.kode,
          'dibuat_pada', v_existing.dibuat_pada
        );
      END IF;

      IF v_attempt >= 12 THEN
        RAISE EXCEPTION 'VALIDASI_GAGAL' USING DETAIL = 'Gagal menghasilkan kode referral unik';
      END IF;
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.buat_kode_referral() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_kode_referral() TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. BOOKING TRIAL & POTONGAN REFERRAL 5%
-- ----------------------------------------------------------------------------

ALTER TABLE public.booking
  ADD COLUMN IF NOT EXISTS jenis public.jenis_booking NOT NULL DEFAULT 'paket',
  ADD COLUMN IF NOT EXISTS kode_referral text,
  ADD COLUMN IF NOT EXISTS potongan integer NOT NULL DEFAULT 0 CHECK (potongan >= 0);

DROP INDEX IF EXISTS public.idx_booking_satu_trial_per_siswa;
CREATE UNIQUE INDEX idx_booking_satu_trial_per_siswa
  ON public.booking (siswa_id)
  WHERE jenis = 'trial'::public.jenis_booking
    AND status NOT IN ('dibatalkan'::public.status_booking, 'kedaluwarsa'::public.status_booking);

CREATE INDEX IF NOT EXISTS idx_booking_kode_referral
  ON public.booking (kode_referral)
  WHERE kode_referral IS NOT NULL;

-- Hapus overload 2-argumen lama sebelum membuat signature 3-argumen dengan default NULL
DROP FUNCTION IF EXISTS public.buat_booking(uuid, uuid);

CREATE OR REPLACE FUNCTION public.buat_booking(
  p_kelas_id uuid,
  p_siswa_id uuid,
  p_kode_referral text DEFAULT NULL
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
  v_kode_ref text;
  v_potongan integer := 0;
  v_total integer;
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

  v_kode_ref := upper(regexp_replace(btrim(COALESCE(p_kode_referral, '')), '\s+', '', 'g'));
  IF v_kode_ref != '' AND v_kode_ref !~ '^[A-Z0-9-]{4,20}$' THEN
    RAISE EXCEPTION 'KODE_REFERRAL_TIDAK_VALID';
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

  PERFORM public.kedaluwarsakan_booking_lewat_batas();

  SELECT
    k.id,
    k.pengajar_id,
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

  IF v_kode_ref != '' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.kode_referral kr
      WHERE kr.kode = v_kode_ref
        AND kr.pengajar_id = v_kelas.pengajar_id
    ) THEN
      RAISE EXCEPTION 'KODE_REFERRAL_TIDAK_VALID';
    END IF;
    v_potongan := floor((v_kelas.harga_paket::numeric * 5) / 100)::integer;
  END IF;

  v_total := GREATEST(v_kelas.harga_paket - v_potongan, 0);

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
    batas_bayar_pada,
    jenis,
    kode_referral,
    potongan
  )
  VALUES (
    v_kode,
    p_kelas_id,
    p_siswa_id,
    auth.uid(),
    'menunggu_pembayaran'::public.status_booking,
    v_total,
    v_batas,
    'paket'::public.jenis_booking,
    NULLIF(v_kode_ref, ''),
    v_potongan
  )
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'id', v_booking_id,
    'kode', v_kode,
    'status', 'menunggu_pembayaran',
    'total', v_total,
    'batas_bayar_pada', v_batas
  );
END;
$$;

REVOKE ALL ON FUNCTION public.buat_booking(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_booking(uuid, uuid, text) TO authenticated;

-- Booking trial gratis (hanya Sesi 1, sekali per anak, langsung terkonfirmasi Rp0)
CREATE OR REPLACE FUNCTION public.buat_booking_trial(
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
  v_sekarang timestamptz := now();
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

  PERFORM public.kedaluwarsakan_booking_lewat_batas();

  SELECT
    k.id,
    k.pengajar_id,
    k.kapasitas,
    k.status AS kelas_status,
    p.jenjang AS prog_jenjang,
    p.kelas_min,
    p.kelas_maks,
    p.aktif AS prog_aktif,
    p.nama AS program_nama,
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

  IF NOT (v_siswa.jenjang = ANY(v_kelas.prog_jenjang))
     OR v_siswa.kelas < v_kelas.kelas_min
     OR v_siswa.kelas > v_kelas.kelas_maks THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT s.mulai_pada INTO v_sesi1_mulai
  FROM public.sesi s
  WHERE s.kelas_id = p_kelas_id AND s.nomor = 1;

  IF v_kelas.kelas_status != 'terbuka'::public.status_kelas
     OR NOT v_kelas.prog_aktif
     OR v_kelas.pengajar_status != 'terverifikasi'::public.status_pengguna
     OR v_sesi1_mulai IS NULL
     OR v_sesi1_mulai <= v_sekarang THEN
    RAISE EXCEPTION 'TRIAL_TIDAK_TERSEDIA';
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

  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.siswa_id = p_siswa_id
      AND b.jenis = 'trial'::public.jenis_booking
      AND b.status NOT IN ('dibatalkan'::public.status_booking, 'kedaluwarsa'::public.status_booking)
  ) THEN
    RAISE EXCEPTION 'TRIAL_SUDAH_DIPAKAI';
  END IF;

  v_kode := 'BK-'
    || to_char(v_sekarang AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD')
    || '-'
    || lpad((nextval('public.seq_kode_booking') % 10000)::text, 4, '0');

  BEGIN
    INSERT INTO public.booking (
      kode,
      kelas_id,
      siswa_id,
      dibuat_oleh,
      status,
      total,
      batas_bayar_pada,
      jenis,
      kode_referral,
      potongan
    )
    VALUES (
      v_kode,
      p_kelas_id,
      p_siswa_id,
      auth.uid(),
      'terkonfirmasi'::public.status_booking,
      0,
      v_sekarang,
      'trial'::public.jenis_booking,
      NULL,
      0
    )
    RETURNING id INTO v_booking_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'TRIAL_SUDAH_DIPAKAI';
  END;

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT DISTINCT
    target.uid,
    'booking_status'::public.tipe_notifikasi,
    'Trial class Sesi 1 aktif',
    'Booking trial ' || v_kode || ' untuk Sesi 1 ' || v_kelas.program_nama || ' langsung terkonfirmasi tanpa biaya.',
    CASE
      WHEN u.peran = 'orang_tua'::public.peran_pengguna THEN '/orang-tua/booking/' || v_booking_id::text
      ELSE '/siswa/booking/' || v_booking_id::text
    END
  FROM (
    SELECT auth.uid() AS uid
    UNION
    SELECT v_siswa.orang_tua_id AS uid WHERE v_siswa.orang_tua_id IS NOT NULL
    UNION
    SELECT v_siswa.pengguna_id AS uid WHERE v_siswa.pengguna_id IS NOT NULL
  ) target
  JOIN public.pengguna u ON u.id = target.uid;

  RETURN jsonb_build_object(
    'id', v_booking_id,
    'kode', v_kode,
    'status', 'terkonfirmasi',
    'total', 0,
    'batas_bayar_pada', v_sekarang
  );
END;
$$;

REVOKE ALL ON FUNCTION public.buat_booking_trial(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buat_booking_trial(uuid, uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. ISOLASI TRIAL SESI 1, BAGI HASIL 30%/40%, BUKA KELAS TK, & TES MINAT TK
-- ----------------------------------------------------------------------------

-- View sesi_saya: peserta trial hanya melihat & mengakses Sesi 1
CREATE OR REPLACE VIEW public.sesi_saya AS
SELECT
  s.id,
  s.kelas_id,
  s.nomor,
  s.mulai_pada,
  s.selesai_pada,
  s.status,
  (s.meet_uri IS NOT NULL) AS punya_meet,
  s.meet_gagal_terakhir,
  k.program_id,
  p.slug AS program_slug,
  p.nama AS program_nama,
  k.level,
  k.pengajar_id,
  u.nama AS pengajar_nama,
  (
    (
      k.pengajar_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.booking b
        WHERE b.kelas_id = k.id
          AND b.status = 'terkonfirmasi'::public.status_booking
          AND (b.jenis != 'trial'::public.jenis_booking OR s.nomor = 1)
          AND public.adalah_siswa_saya(b.siswa_id)
      )
    )
    AND s.status = 'terjadwal'::public.status_sesi
    AND now() >= (s.mulai_pada - interval '15 minutes')
    AND now() <= s.selesai_pada
  ) AS bisa_masuk_kelas
FROM public.sesi s
JOIN public.kelas k ON k.id = s.kelas_id
JOIN public.program p ON p.id = k.program_id
JOIN public.pengguna u ON u.id = k.pengajar_id
WHERE
  public.peran_saya() = 'admin'::public.peran_pengguna
  OR k.pengajar_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = k.id
      AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
      AND (b.jenis != 'trial'::public.jenis_booking OR s.nomor = 1)
      AND public.adalah_siswa_saya(b.siswa_id)
  );

GRANT SELECT ON public.sesi_saya TO authenticated;

-- View perkiraan_bagi_hasil_saya: estimasi honor per sesi kelas aktif
CREATE OR REPLACE VIEW public.perkiraan_bagi_hasil_saya AS
SELECT
  k.id AS kelas_id,
  p.nama AS program_nama,
  p.slug AS program_slug,
  k.level,
  k.status,
  count(b.id)::integer AS jumlah_siswa,
  count(b.id) FILTER (WHERE b.kode_referral IS NOT NULL AND kr.kode IS NOT NULL)::integer AS siswa_referral,
  COALESCE(
    round(
      SUM(
        b.total::numeric * CASE
          WHEN b.kode_referral IS NOT NULL AND kr.kode IS NOT NULL THEN 0.40
          ELSE 0.30
        END
      ) / GREATEST(p.jumlah_sesi, 1)
    ),
    0
  )::integer AS honor_per_sesi,
  p.jumlah_sesi
FROM public.kelas k
JOIN public.program p ON p.id = k.program_id
LEFT JOIN public.booking b
  ON b.kelas_id = k.id
  AND b.jenis = 'paket'::public.jenis_booking
  AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
LEFT JOIN public.kode_referral kr
  ON kr.pengajar_id = k.pengajar_id
  AND kr.kode = b.kode_referral
WHERE k.pengajar_id = auth.uid()
  AND k.status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas)
GROUP BY k.id, p.nama, p.slug, k.level, k.status, p.jumlah_sesi;

GRANT SELECT ON public.perkiraan_bagi_hasil_saya TO authenticated;

-- Perbarui buka_kelas: kapasitas maks 6 untuk program jenjang TK
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

  IF 'TK'::public.jenjang_pendidikan = ANY(v_program.jenjang) THEN
    v_maks := 6;
  ELSIF 'SD'::public.jenjang_pendidikan = ANY(v_program.jenjang) THEN
    v_maks := 10;
  ELSE
    v_maks := 15;
  END IF;

  IF p_kapasitas < 1 OR p_kapasitas > v_maks THEN
    RAISE EXCEPTION 'KAPASITAS_TIDAK_VALID';
  END IF;

  v_mulai_1 := (p_tanggal_mulai::timestamp + p_jam_mulai) AT TIME ZONE 'Asia/Jakarta';

  IF v_mulai_1 <= now() THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

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

-- Perbarui hitung_tes_minat: dukung jenjang TK / SD kelas 1 -> Kenal Komputer
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

    IF v_siswa.jenjang = 'TK'::public.jenjang_pendidikan
       OR (v_siswa.jenjang = 'SD'::public.jenjang_pendidikan AND v_siswa.kelas <= 1) THEN
      v_program := '["Kenal Komputer"]'::jsonb;
    ELSIF v_siswa.jenjang = 'SD'::public.jenjang_pendidikan THEN
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

-- Perbarui link_masuk_sesi: trial hanya berhak atas Sesi 1
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
      AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1)
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

-- Perbarui geser_sesi: notifikasi untuk peserta paket + trial Sesi 1 saja
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
    AND b.status = 'terkonfirmasi'::public.status_booking
    AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1);

  RETURN jsonb_build_object(
    'id', p_sesi_id,
    'mulai_pada', p_mulai_pada,
    'selesai_pada', v_selesai_baru
  );
END;
$$;

-- Perbarui beri_rating: peserta trial hanya menilai Sesi 1
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
      AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1)
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

-- Perbarui kirim_laporan: bagi hasil 30%/40% ÷ jumlah_sesi + tutup trial pasca Sesi 1 + kecualikan trial Sesi 2-4
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
  v_jumlah_honor integer := 0;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT
    s.*,
    k.pengajar_id,
    k.program_id,
    p.slug AS program_slug,
    p.jumlah_sesi
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
        AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1)
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

  -- Pastikan semua siswa terkonfirmasi yang aktif di sesi ini tercantum dalam p_siswa
  IF EXISTS (
    SELECT 1
    FROM public.booking b
    WHERE b.kelas_id = v_sesi.kelas_id
      AND b.status = 'terkonfirmasi'::public.status_booking
      AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1)
      AND NOT (b.siswa_id = ANY(v_target_siswa_ids))
  ) THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

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

  -- Hitung honor bagi hasil 30% (atau 40% bila memakai kode referral pengajar kelas) ÷ jumlah sesi
  SELECT COALESCE(
    round(
      SUM(
        b.total::numeric * CASE
          WHEN b.kode_referral IS NOT NULL AND EXISTS (
            SELECT 1
            FROM public.kode_referral kr
            WHERE kr.pengajar_id = v_sesi.pengajar_id
              AND kr.kode = b.kode_referral
          ) THEN 0.40
          ELSE 0.30
        END
      ) / GREATEST(v_sesi.jumlah_sesi, 1)
    ),
    0
  )::integer
  INTO v_jumlah_honor
  FROM public.booking b
  WHERE b.kelas_id = v_sesi.kelas_id
    AND b.jenis = 'paket'::public.jenis_booking
    AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking);

  INSERT INTO public.honor (pengajar_id, sesi_id, jumlah, status)
  VALUES (auth.uid(), p_sesi_id, v_jumlah_honor, 'belum_dibayar'::public.status_honor)
  ON CONFLICT (sesi_id) DO NOTHING;

  IF v_sesi.nomor = 1 THEN
    UPDATE public.booking
    SET status = 'selesai'::public.status_booking
    WHERE kelas_id = v_sesi.kelas_id
      AND jenis = 'trial'::public.jenis_booking
      AND status = 'terkonfirmasi'::public.status_booking;
  END IF;

  IF v_sesi.nomor = 4 THEN
    UPDATE public.kelas
    SET status = 'selesai'::public.status_kelas
    WHERE id = v_sesi.kelas_id;

    UPDATE public.booking
    SET status = 'selesai'::public.status_booking
    WHERE kelas_id = v_sesi.kelas_id
      AND status = 'terkonfirmasi'::public.status_booking;
  END IF;

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
    'status', 'selesai',
    'honor_jumlah', v_jumlah_honor
  );
END;
$$;

-- Perbarui ubah_laporan agar tetap mengecualikan peserta trial pada Sesi 2-4
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

    IF NOT EXISTS (
      SELECT 1 FROM public.booking b
      WHERE b.kelas_id = v_sesi.kelas_id
        AND b.siswa_id = v_siswa_id
        AND b.status IN ('terkonfirmasi'::public.status_booking, 'selesai'::public.status_booking)
        AND (b.jenis != 'trial'::public.jenis_booking OR v_sesi.nomor = 1)
    ) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    IF v_hadir AND (v_catatan IS NULL OR char_length(v_catatan) > 300) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;
    IF NOT v_hadir AND v_catatan IS NOT NULL AND char_length(v_catatan) > 300 THEN
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
-- 5. DETAIL PROFIL PENGAJAR: PENGALAMAN & SERTIFIKAT
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pengalaman_pengajar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  peran text NOT NULL CHECK (char_length(btrim(peran)) BETWEEN 3 AND 80),
  tempat text NOT NULL CHECK (char_length(btrim(tempat)) BETWEEN 2 AND 100),
  periode text NOT NULL CHECK (char_length(btrim(periode)) BETWEEN 4 AND 40),
  deskripsi text CHECK (deskripsi IS NULL OR char_length(deskripsi) <= 240),
  urutan integer NOT NULL CHECK (urutan BETWEEN 1 AND 10),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pengalaman_pengajar_urut
  ON public.pengalaman_pengajar (pengajar_id, urutan ASC);

CREATE TABLE IF NOT EXISTS public.sertifikat_pengajar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajar_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  nama text NOT NULL CHECK (char_length(btrim(nama)) BETWEEN 3 AND 100),
  penerbit text NOT NULL CHECK (char_length(btrim(penerbit)) BETWEEN 2 AND 100),
  tahun integer NOT NULL CHECK (tahun BETWEEN 1990 AND 2100),
  tautan text CHECK (tautan IS NULL OR (tautan ~ '^https://' AND char_length(tautan) <= 500)),
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sertifikat_pengajar_tahun
  ON public.sertifikat_pengajar (pengajar_id, tahun DESC);

ALTER TABLE public.pengalaman_pengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sertifikat_pengajar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pengalaman_pengajar_select" ON public.pengalaman_pengajar;
CREATE POLICY "pengalaman_pengajar_select"
  ON public.pengalaman_pengajar FOR SELECT
  TO anon, authenticated
  USING (
    pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR EXISTS (
      SELECT 1
      FROM public.pengguna u
      WHERE u.id = pengalaman_pengajar.pengajar_id
        AND u.peran = 'pengajar'::public.peran_pengguna
        AND u.status = 'terverifikasi'::public.status_pengguna
    )
  );

DROP POLICY IF EXISTS "sertifikat_pengajar_select" ON public.sertifikat_pengajar;
CREATE POLICY "sertifikat_pengajar_select"
  ON public.sertifikat_pengajar FOR SELECT
  TO anon, authenticated
  USING (
    pengajar_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
    OR EXISTS (
      SELECT 1
      FROM public.pengguna u
      WHERE u.id = sertifikat_pengajar.pengajar_id
        AND u.peran = 'pengajar'::public.peran_pengguna
        AND u.status = 'terverifikasi'::public.status_pengguna
    )
  );

GRANT SELECT ON public.pengalaman_pengajar TO anon, authenticated;
GRANT SELECT ON public.sertifikat_pengajar TO anon, authenticated;
GRANT ALL ON public.pengalaman_pengajar TO service_role;
GRANT ALL ON public.sertifikat_pengajar TO service_role;

CREATE OR REPLACE FUNCTION public.simpan_detail_profil_pengajar(
  p_pengalaman jsonb,
  p_sertifikat jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item jsonb;
  v_idx integer := 0;
  v_peran text;
  v_tempat text;
  v_periode text;
  v_deskripsi text;
  v_urutan integer;
  v_nama text;
  v_penerbit text;
  v_tahun integer;
  v_tautan text;
  v_tahun_maks integer := EXTRACT(YEAR FROM now())::integer;
  v_pengalaman_count integer := 0;
  v_sertifikat_count integer := 0;
BEGIN
  IF auth.uid() IS NULL
     OR public.peran_saya() IS DISTINCT FROM 'pengajar'::public.peran_pengguna
     OR public.status_saya() = 'nonaktif'::public.status_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_pengalaman IS NULL
     OR p_sertifikat IS NULL
     OR jsonb_typeof(p_pengalaman) != 'array'
     OR jsonb_typeof(p_sertifikat) != 'array' THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF jsonb_array_length(p_pengalaman) > 10 OR jsonb_array_length(p_sertifikat) > 10 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  DELETE FROM public.pengalaman_pengajar
  WHERE pengajar_id = auth.uid();

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_pengalaman) LOOP
    v_idx := v_idx + 1;
    IF jsonb_typeof(v_item) != 'object' THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    v_peran := btrim(COALESCE(v_item->>'peran', ''));
    v_tempat := btrim(COALESCE(v_item->>'tempat', ''));
    v_periode := btrim(COALESCE(v_item->>'periode', ''));
    v_deskripsi := NULLIF(btrim(COALESCE(v_item->>'deskripsi', '')), '');

    BEGIN
      v_urutan := COALESCE((v_item->>'urutan')::integer, v_idx);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END;

    IF char_length(v_peran) < 3 OR char_length(v_peran) > 80
       OR char_length(v_tempat) < 2 OR char_length(v_tempat) > 100
       OR char_length(v_periode) < 4 OR char_length(v_periode) > 40
       OR (v_deskripsi IS NOT NULL AND char_length(v_deskripsi) > 240)
       OR v_urutan < 1 OR v_urutan > 10 THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    INSERT INTO public.pengalaman_pengajar (
      pengajar_id,
      peran,
      tempat,
      periode,
      deskripsi,
      urutan
    )
    VALUES (
      auth.uid(),
      v_peran,
      v_tempat,
      v_periode,
      v_deskripsi,
      v_urutan
    );
    v_pengalaman_count := v_pengalaman_count + 1;
  END LOOP;

  DELETE FROM public.sertifikat_pengajar
  WHERE pengajar_id = auth.uid();

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_sertifikat) LOOP
    IF jsonb_typeof(v_item) != 'object' THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    v_nama := btrim(COALESCE(v_item->>'nama', ''));
    v_penerbit := btrim(COALESCE(v_item->>'penerbit', ''));
    v_tautan := NULLIF(btrim(COALESCE(v_item->>'tautan', '')), '');

    BEGIN
      v_tahun := (v_item->>'tahun')::integer;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END;

    IF char_length(v_nama) < 3 OR char_length(v_nama) > 100
       OR char_length(v_penerbit) < 2 OR char_length(v_penerbit) > 100
       OR v_tahun IS NULL OR v_tahun < 1990 OR v_tahun > v_tahun_maks
       OR (v_tautan IS NOT NULL AND (v_tautan !~ '^https://' OR char_length(v_tautan) > 500)) THEN
      RAISE EXCEPTION 'VALIDASI_GAGAL';
    END IF;

    INSERT INTO public.sertifikat_pengajar (
      pengajar_id,
      nama,
      penerbit,
      tahun,
      tautan
    )
    VALUES (
      auth.uid(),
      v_nama,
      v_penerbit,
      v_tahun,
      v_tautan
    );
    v_sertifikat_count := v_sertifikat_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'pengalaman_count', v_pengalaman_count,
    'sertifikat_count', v_sertifikat_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.simpan_detail_profil_pengajar(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.simpan_detail_profil_pengajar(jsonb, jsonb) TO authenticated;
