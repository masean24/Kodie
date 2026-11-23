-- ============================================================================
-- Migration 4: 7 View Kontrak Backend
-- Sumber kebenaran: docs/PRD.md Bagian 4, 7, 8 & docs/KEPUTUSAN.md
-- Catatan: View dijalankan dengan hak pemilik view (bukan security_invoker)
--          agar publik/pengguna dapat membaca proyeksi aman dengan pembatasan
--          kolom sensitif dan filter kepemilikan bawaan di definisi view.
-- ============================================================================

-- 1. kelas_katalog: katalog kelas publik dengan sisa_kursi dan tanpa meet_uri
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
  k.dibuat_pada
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

-- 2. pengajar_publik: profil publik pengajar terverifikasi & rating (tampil min 3 rating)
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
  END AS rata_rata_rating
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

-- 3. soal_minat_publik: 12 soal tes minat tanpa bobot jawaban
CREATE OR REPLACE VIEW public.soal_minat_publik AS
SELECT
  sm.id,
  sm.urutan,
  sm.teks,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'kode', item->>'kode',
        'teks', item->>'teks'
      )
      ORDER BY item->>'kode'
    )
    FROM jsonb_array_elements(sm.opsi) AS item
  ) AS opsi
FROM public.soal_minat sm
ORDER BY sm.urutan ASC;

-- 4. sesi_saya: daftar sesi milik pengguna (tanpa meet_uri)
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
      AND public.adalah_siswa_saya(b.siswa_id)
  );

-- 5. laporan_saya: laporan sesi & catatan siswa hanya untuk siswa milik peminta
--    rekaman_url hanya tampil bagi pengajar kelas dan admin (F10)
CREATE OR REPLACE VIEW public.laporan_saya AS
SELECT
  ls.id AS laporan_sesi_id,
  ls.sesi_id,
  s.kelas_id,
  s.nomor AS nomor_sesi,
  s.mulai_pada,
  s.selesai_pada,
  p.slug AS program_slug,
  p.nama AS program_nama,
  ls.pengajar_id,
  u.nama AS pengajar_nama,
  ls.ringkasan,
  CASE
    WHEN public.peran_saya() IN ('pengajar'::public.peran_pengguna, 'admin'::public.peran_pengguna)
    THEN ls.rekaman_url
    ELSE NULL
  END AS rekaman_url,
  ls.kendala,
  ls.dikirim_pada,
  ls.diubah_pada,
  (now() <= ls.dikirim_pada + interval '24 hours') AS bisa_diubah,
  lsw.id AS laporan_siswa_id,
  lsw.siswa_id,
  sw.nama AS siswa_nama,
  lsw.hadir,
  lsw.catatan,
  lsw.karya_url
FROM public.laporan_sesi ls
JOIN public.sesi s ON s.id = ls.sesi_id
JOIN public.kelas k ON k.id = s.kelas_id
JOIN public.program p ON p.id = k.program_id
JOIN public.pengguna u ON u.id = ls.pengajar_id
JOIN public.laporan_siswa lsw ON lsw.laporan_sesi_id = ls.id
JOIN public.siswa sw ON sw.id = lsw.siswa_id
WHERE
  public.peran_saya() = 'admin'::public.peran_pengguna
  OR ls.pengajar_id = auth.uid()
  OR public.adalah_siswa_saya(lsw.siswa_id);

-- 6. rapor_saya: rapor rekomendasi jurusan + hasil tes minat terbaru siswa
CREATE OR REPLACE VIEW public.rapor_saya AS
SELECT
  rj.id,
  rj.sesi_id,
  s.kelas_id,
  rj.siswa_id,
  sw.nama AS siswa_nama,
  sw.jenjang AS siswa_jenjang,
  sw.kelas AS siswa_kelas,
  k.pengajar_id,
  u.nama AS pengajar_nama,
  rj.skor_software,
  rj.skor_jaringan,
  rj.skor_iot,
  rj.skor_ai_data,
  rj.bidang_rekomendasi,
  rj.alasan,
  rj.saran,
  rj.dibuat_pada,
  hm.skor AS tes_minat_skor,
  hm.bidang_teratas AS tes_minat_bidang_teratas,
  hm.dibuat_pada AS tes_minat_dibuat_pada
FROM public.rapor_jurusan rj
JOIN public.sesi s ON s.id = rj.sesi_id
JOIN public.kelas k ON k.id = s.kelas_id
JOIN public.pengguna u ON u.id = k.pengajar_id
JOIN public.siswa sw ON sw.id = rj.siswa_id
LEFT JOIN LATERAL (
  SELECT h.skor, h.bidang_teratas, h.dibuat_pada
  FROM public.hasil_minat h
  WHERE h.siswa_id = rj.siswa_id
  ORDER BY h.dibuat_pada DESC
  LIMIT 1
) hm ON true
WHERE
  public.peran_saya() = 'admin'::public.peran_pengguna
  OR k.pengajar_id = auth.uid()
  OR public.adalah_siswa_saya(rj.siswa_id);

-- 7. admin_ringkasan: ringkasan angka dashboard admin
CREATE OR REPLACE VIEW public.admin_ringkasan AS
SELECT
  (
    SELECT count(*)::integer
    FROM public.siswa sw
    LEFT JOIN public.pengguna u ON u.id = sw.pengguna_id
    WHERE sw.pengguna_id IS NULL OR u.status = 'aktif'::public.status_pengguna
  ) AS siswa_aktif,
  (
    SELECT count(*)::integer
    FROM public.kelas k
    WHERE k.status IN ('terbuka'::public.status_kelas, 'berjalan'::public.status_kelas)
  ) AS kelas_berjalan,
  (
    SELECT count(*)::integer
    FROM public.booking b
    WHERE b.status = 'menunggu_verifikasi'::public.status_booking
  ) AS booking_menunggu_verifikasi,
  (
    SELECT count(*)::integer
    FROM public.pengguna u
    WHERE u.peran = 'pengajar'::public.peran_pengguna
      AND u.status = 'menunggu_verifikasi'::public.status_pengguna
  ) AS pengajar_menunggu_verifikasi,
  (
    SELECT count(*)::integer
    FROM public.laporan_masalah lm
    WHERE lm.status = 'baru'::public.status_masalah
  ) AS laporan_masalah_baru,
  (
    SELECT count(*)::integer
    FROM public.honor h
    WHERE h.status = 'belum_dibayar'::public.status_honor
  ) AS honor_belum_dibayar,
  (
    SELECT count(*)::integer
    FROM public.sesi s
    WHERE s.status = 'terjadwal'::public.status_sesi
      AND s.meet_uri IS NULL
  ) AS sesi_tanpa_meet
WHERE public.peran_saya() = 'admin'::public.peran_pengguna;

-- Berikan hak SELECT pada view sesuai matriks akses PRD
GRANT SELECT ON public.kelas_katalog TO anon, authenticated;
GRANT SELECT ON public.pengajar_publik TO anon, authenticated;
GRANT SELECT ON public.soal_minat_publik TO anon, authenticated;
GRANT SELECT ON public.sesi_saya TO authenticated;
GRANT SELECT ON public.laporan_saya TO authenticated;
GRANT SELECT ON public.rapor_saya TO authenticated;
GRANT SELECT ON public.admin_ringkasan TO authenticated;
