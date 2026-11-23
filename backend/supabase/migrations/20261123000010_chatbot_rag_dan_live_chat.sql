-- ============================================================================
-- Migration 10: AI Chatbot "Kiko" (pgvector, Hybrid RAG RRF, Live Admin Takeover)
-- Sumber kebenaran: docs/KEPUTUSAN.md (2026-11-23)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TYPE public.tipe_notifikasi ADD VALUE IF NOT EXISTS 'chat_handoff';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_percakapan_chat') THEN
    CREATE TYPE public.status_percakapan_chat AS ENUM (
      'bot',
      'menunggu_admin',
      'ditangani_admin',
      'selesai'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pengirim_pesan_chat') THEN
    CREATE TYPE public.pengirim_pesan_chat AS ENUM (
      'pengguna',
      'bot',
      'admin',
      'sistem'
    );
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. TABEL RAG: knowledge_sources & document_chunks
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  source_title text NOT NULL,
  source_url text NOT NULL,
  content_hash text NOT NULL,
  diperbarui_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  source_title text NOT NULL,
  source_url text NOT NULL,
  heading_path text NOT NULL DEFAULT '',
  content text NOT NULL,
  embedding extensions.vector(768) NOT NULL,
  content_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(source_title, '') || ' ' || coalesce(heading_path, '') || ' ' || coalesce(content, '')
    )
  ) STORED,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_document_chunk_source_idx UNIQUE (source_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON public.document_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv
  ON public.document_chunks
  USING gin (content_tsv);

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_sources_admin_all"
  ON public.knowledge_sources FOR ALL
  TO authenticated
  USING (public.peran_saya() = 'admin'::public.peran_pengguna)
  WITH CHECK (public.peran_saya() = 'admin'::public.peran_pengguna);

CREATE POLICY "document_chunks_admin_all"
  ON public.document_chunks FOR ALL
  TO authenticated
  USING (public.peran_saya() = 'admin'::public.peran_pengguna)
  WITH CHECK (public.peran_saya() = 'admin'::public.peran_pengguna);

-- ----------------------------------------------------------------------------
-- 2. RPC HYBRID RAG SEARCH (Reciprocal Rank Fusion: Vector Top-15 + FTS Top-15)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cari_knowledge_rag(
  p_query_embedding text,
  p_query_text text,
  p_match_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source_title text,
  source_url text,
  heading_path text,
  content text,
  vec_sim double precision,
  fts_rank double precision,
  rrf_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, extensions
AS $$
DECLARE
  v_vec extensions.vector(768);
  v_limit integer := LEAST(GREATEST(COALESCE(p_match_count, 5), 1), 10);
  v_tsquery tsquery;
BEGIN
  v_vec := p_query_embedding::extensions.vector(768);

  BEGIN
    v_tsquery := websearch_to_tsquery('simple', COALESCE(p_query_text, ''));
  EXCEPTION WHEN OTHERS THEN
    v_tsquery := plainto_tsquery('simple', COALESCE(p_query_text, ''));
  END;

  RETURN QUERY
  WITH vec_top AS (
    SELECT
      dc.id,
      (1.0 - (dc.embedding <=> v_vec))::double precision AS sim,
      row_number() OVER (ORDER BY dc.embedding <=> v_vec ASC) AS r_vec
    FROM public.document_chunks dc
    ORDER BY dc.embedding <=> v_vec ASC
    LIMIT 15
  ),
  fts_top AS (
    SELECT
      dc.id,
      ts_rank_cd(dc.content_tsv, v_tsquery)::double precision AS f_score,
      row_number() OVER (ORDER BY ts_rank_cd(dc.content_tsv, v_tsquery) DESC) AS r_fts
    FROM public.document_chunks dc
    WHERE v_tsquery IS NOT NULL
      AND v_tsquery::text != ''
      AND dc.content_tsv @@ v_tsquery
    ORDER BY ts_rank_cd(dc.content_tsv, v_tsquery) DESC
    LIMIT 15
  ),
  combined AS (
    SELECT
      COALESCE(v.id, f.id) AS chunk_id,
      COALESCE(v.sim, (1.0 - (dc2.embedding <=> v_vec))::double precision) AS c_vec_sim,
      COALESCE(f.f_score, 0.0)::double precision AS c_fts_rank,
      (
        COALESCE(1.0 / (60.0 + v.r_vec), 0.0) +
        COALESCE(1.0 / (60.0 + f.r_fts), 0.0)
      )::double precision AS c_rrf
    FROM vec_top v
    FULL OUTER JOIN fts_top f ON f.id = v.id
    JOIN public.document_chunks dc2 ON dc2.id = COALESCE(v.id, f.id)
  )
  SELECT
    dc.id,
    dc.source_title,
    dc.source_url,
    dc.heading_path,
    dc.content,
    c.c_vec_sim AS vec_sim,
    c.c_fts_rank AS fts_rank,
    c.c_rrf AS rrf_score
  FROM combined c
  JOIN public.document_chunks dc ON dc.id = c.chunk_id
  ORDER BY c.c_rrf DESC, c.c_vec_sim DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.cari_knowledge_rag(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cari_knowledge_rag(text, text, integer) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. TABEL LIVE CHAT & ADMIN TAKEOVER: percakapan_chat & pesan_chat
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.percakapan_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pengguna_id uuid NOT NULL REFERENCES public.pengguna(id) ON DELETE CASCADE,
  judul text NOT NULL DEFAULT 'Percakapan dengan Kiko',
  status public.status_percakapan_chat NOT NULL DEFAULT 'bot',
  admin_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  laporan_masalah_id uuid REFERENCES public.laporan_masalah(id) ON DELETE SET NULL,
  dibuat_pada timestamptz NOT NULL DEFAULT now(),
  diperbarui_pada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pesan_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  percakapan_id uuid NOT NULL REFERENCES public.percakapan_chat(id) ON DELETE CASCADE,
  pengirim_peran public.pengirim_pesan_chat NOT NULL,
  pengirim_id uuid REFERENCES public.pengguna(id) ON DELETE SET NULL,
  isi text NOT NULL CHECK (char_length(btrim(isi)) BETWEEN 1 AND 4000),
  sitasi jsonb NOT NULL DEFAULT '[]'::jsonb,
  dibuat_pada timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_percakapan_chat_pengguna
  ON public.percakapan_chat (pengguna_id, diperbarui_pada DESC);

CREATE INDEX IF NOT EXISTS idx_percakapan_chat_status
  ON public.percakapan_chat (status, diperbarui_pada DESC);

CREATE INDEX IF NOT EXISTS idx_pesan_chat_percakapan_waktu
  ON public.pesan_chat (percakapan_id, dibuat_pada ASC);

CREATE OR REPLACE FUNCTION public.adalah_percakapan_chat_saya(p_percakapan_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.percakapan_chat pc
    WHERE pc.id = p_percakapan_id
      AND pc.pengguna_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.adalah_percakapan_chat_saya(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adalah_percakapan_chat_saya(uuid) TO authenticated, service_role;

ALTER TABLE public.percakapan_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesan_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "percakapan_chat_select"
  ON public.percakapan_chat FOR SELECT
  TO authenticated
  USING (
    pengguna_id = auth.uid()
    OR public.peran_saya() = 'admin'::public.peran_pengguna
  );

CREATE POLICY "percakapan_chat_insert"
  ON public.percakapan_chat FOR INSERT
  TO authenticated
  WITH CHECK (pengguna_id = auth.uid());

CREATE POLICY "pesan_chat_select"
  ON public.pesan_chat FOR SELECT
  TO authenticated
  USING (
    public.adalah_percakapan_chat_saya(percakapan_id)
    OR public.peran_saya() = 'admin'::public.peran_pengguna
  );

-- Publikasikan ke Supabase Realtime agar widget user & halaman /admin/chat sinkron tanpa refresh
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'percakapan_chat'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.percakapan_chat;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pesan_chat'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pesan_chat;
    END IF;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. PENGATURAN DINAMIS CHATBOT & VIEW PUBLIK
-- ----------------------------------------------------------------------------

INSERT INTO public.pengaturan (kunci, nilai)
VALUES
  ('chatbot_aktif', 'true'),
  ('chatbot_nama', 'Kiko'),
  ('chatbot_sapaan', 'Hai! Aku Kiko, asisten resmi Kodie. Ada yang ingin kamu tanyakan seputar program kelas, tes minat jurusan IT, atau jadwal belajarmu?'),
  ('chatbot_kontak_wa', '6281100000001'),
  ('chatbot_kontak_email', 'bantuan@kodie.id'),
  ('chatbot_primary_provider', 'agnes'),
  ('chatbot_primary_model', 'agnes-3.0-flash'),
  ('chatbot_fallback_provider', 'gemini'),
  ('chatbot_fallback_model', 'gemini-3.8-flash'),
  ('chatbot_rag_threshold', '0.55')
ON CONFLICT (kunci) DO UPDATE SET
  nilai = EXCLUDED.nilai;

CREATE OR REPLACE VIEW public.chatbot_konfigurasi_publik AS
SELECT
  p.kunci,
  p.nilai
FROM public.pengaturan p
WHERE p.kunci IN (
  'chatbot_aktif',
  'chatbot_nama',
  'chatbot_sapaan',
  'chatbot_kontak_wa',
  'chatbot_kontak_email'
);

GRANT SELECT ON public.chatbot_konfigurasi_publik TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. RPC LIVE TAKEOVER & HANDOFF ADMIN
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.minta_bantuan_admin_chat(
  p_percakapan_id uuid,
  p_buat_tiket boolean DEFAULT false,
  p_ringkasan_masalah text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pc record;
  v_tiket_id uuid := NULL;
  v_nama_user text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT pc.*, u.nama AS pengguna_nama, u.peran AS pengguna_peran
  INTO v_pc
  FROM public.percakapan_chat pc
  JOIN public.pengguna u ON u.id = pc.pengguna_id
  WHERE pc.id = p_percakapan_id
  FOR UPDATE OF pc;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_pc.pengguna_id != auth.uid() THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  v_nama_user := v_pc.pengguna_nama;

  IF COALESCE(p_buat_tiket, false)
     AND v_pc.laporan_masalah_id IS NULL
     AND v_pc.pengguna_peran IN ('orang_tua'::public.peran_pengguna, 'siswa'::public.peran_pengguna) THEN
    INSERT INTO public.laporan_masalah (
      pelapor_id,
      kategori,
      deskripsi,
      prioritas,
      status
    )
    VALUES (
      auth.uid(),
      'lainnya'::public.kategori_masalah,
      COALESCE(NULLIF(btrim(p_ringkasan_masalah), ''), 'Eskalasi bantuan dari percakapan chat dengan Kiko (' || v_pc.judul || ')'),
      'normal'::public.prioritas_masalah,
      'baru'::public.status_masalah
    )
    RETURNING id INTO v_tiket_id;
  ELSE
    v_tiket_id := v_pc.laporan_masalah_id;
  END IF;

  UPDATE public.percakapan_chat
  SET
    status = CASE
      WHEN status = 'ditangani_admin'::public.status_percakapan_chat THEN 'ditangani_admin'::public.status_percakapan_chat
      ELSE 'menunggu_admin'::public.status_percakapan_chat
    END,
    laporan_masalah_id = COALESCE(v_tiket_id, laporan_masalah_id),
    diperbarui_pada = now()
  WHERE id = p_percakapan_id;

  INSERT INTO public.pesan_chat (percakapan_id, pengirim_peran, pengirim_id, isi)
  VALUES (
    p_percakapan_id,
    'sistem'::public.pengirim_pesan_chat,
    auth.uid(),
    'Permintaan bicara dengan Admin telah dikirim. Mohon tunggu, Admin Kodie akan segera bergabung ke percakapan ini.'
  );

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  SELECT
    u.id,
    'chat_handoff'::public.tipe_notifikasi,
    'Permintaan Live Chat Admin',
    v_nama_user || ' meminta bantuan langsung di chat.',
    '/admin/chat/' || p_percakapan_id::text
  FROM public.pengguna u
  WHERE u.peran = 'admin'::public.peran_pengguna
    AND u.status = 'aktif'::public.status_pengguna;

  RETURN jsonb_build_object(
    'percakapan_id', p_percakapan_id,
    'status', 'menunggu_admin',
    'laporan_masalah_id', v_tiket_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_ambil_alih_chat(p_percakapan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pc record;
BEGIN
  IF auth.uid() IS NULL OR public.peran_saya() IS DISTINCT FROM 'admin'::public.peran_pengguna THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_pc
  FROM public.percakapan_chat pc
  WHERE pc.id = p_percakapan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  UPDATE public.percakapan_chat
  SET
    status = 'ditangani_admin'::public.status_percakapan_chat,
    admin_id = auth.uid(),
    diperbarui_pada = now()
  WHERE id = p_percakapan_id;

  INSERT INTO public.pesan_chat (percakapan_id, pengirim_peran, pengirim_id, isi)
  VALUES (
    p_percakapan_id,
    'sistem'::public.pengirim_pesan_chat,
    auth.uid(),
    'Admin Kodie telah bergabung ke percakapan.'
  );

  INSERT INTO public.notifikasi (pengguna_id, tipe, judul, isi, tautan)
  VALUES (
    v_pc.pengguna_id,
    'chat_handoff'::public.tipe_notifikasi,
    'Admin bergabung di chat',
    'Admin Kodie kini menangani percakapan Anda secara langsung.',
    '/'
  );

  INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
  VALUES (
    auth.uid(),
    'ambil_alih_chat',
    'percakapan_chat',
    p_percakapan_id::text,
    jsonb_build_object('pengguna_id', v_pc.pengguna_id)
  );

  RETURN jsonb_build_object(
    'percakapan_id', p_percakapan_id,
    'status', 'ditangani_admin',
    'admin_id', auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.kirim_pesan_live_chat(
  p_percakapan_id uuid,
  p_isi text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pc record;
  v_peran public.peran_pengguna := public.peran_saya();
  v_pengirim_peran public.pengirim_pesan_chat;
  v_pesan_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  IF p_percakapan_id IS NULL OR NULLIF(btrim(p_isi), '') IS NULL OR char_length(p_isi) > 1500 THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  SELECT * INTO v_pc
  FROM public.percakapan_chat pc
  WHERE pc.id = p_percakapan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_peran = 'admin'::public.peran_pengguna THEN
    v_pengirim_peran := 'admin'::public.pengirim_pesan_chat;

    UPDATE public.percakapan_chat
    SET
      status = 'ditangani_admin'::public.status_percakapan_chat,
      admin_id = COALESCE(admin_id, auth.uid()),
      diperbarui_pada = now()
    WHERE id = p_percakapan_id;
  ELSIF v_pc.pengguna_id = auth.uid() THEN
    v_pengirim_peran := 'pengguna'::public.pengirim_pesan_chat;

    UPDATE public.percakapan_chat
    SET diperbarui_pada = now()
    WHERE id = p_percakapan_id;
  ELSE
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  INSERT INTO public.pesan_chat (
    percakapan_id,
    pengirim_peran,
    pengirim_id,
    isi
  )
  VALUES (
    p_percakapan_id,
    v_pengirim_peran,
    auth.uid(),
    btrim(p_isi)
  )
  RETURNING id INTO v_pesan_id;

  RETURN jsonb_build_object(
    'id', v_pesan_id,
    'percakapan_id', p_percakapan_id,
    'pengirim_peran', v_pengirim_peran,
    'dibuat_pada', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_selesaikan_chat(
  p_percakapan_id uuid,
  p_kembali_ke_bot boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pc record;
  v_peran public.peran_pengguna := public.peran_saya();
  v_status_baru public.status_percakapan_chat;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  SELECT * INTO v_pc
  FROM public.percakapan_chat pc
  WHERE pc.id = p_percakapan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VALIDASI_GAGAL';
  END IF;

  IF v_peran != 'admin'::public.peran_pengguna AND v_pc.pengguna_id != auth.uid() THEN
    RAISE EXCEPTION 'TIDAK_BERHAK';
  END IF;

  v_status_baru := CASE
    WHEN COALESCE(p_kembali_ke_bot, true) THEN 'bot'::public.status_percakapan_chat
    ELSE 'selesai'::public.status_percakapan_chat
  END;

  UPDATE public.percakapan_chat
  SET
    status = v_status_baru,
    diperbarui_pada = now()
  WHERE id = p_percakapan_id;

  INSERT INTO public.pesan_chat (percakapan_id, pengirim_peran, pengirim_id, isi)
  VALUES (
    p_percakapan_id,
    'sistem'::public.pengirim_pesan_chat,
    auth.uid(),
    CASE
      WHEN v_status_baru = 'bot'::public.status_percakapan_chat
      THEN 'Sesi dengan Admin selesai. Percakapan dikembalikan ke asisten Kiko.'
      ELSE 'Percakapan telah ditandai selesai.'
    END
  );

  IF v_peran = 'admin'::public.peran_pengguna THEN
    INSERT INTO public.log_admin (admin_id, aksi, target_tipe, target_id, detail)
    VALUES (
      auth.uid(),
      'selesaikan_chat',
      'percakapan_chat',
      p_percakapan_id::text,
      jsonb_build_object('status_baru', v_status_baru)
    );
  END IF;

  RETURN jsonb_build_object(
    'percakapan_id', p_percakapan_id,
    'status', v_status_baru
  );
END;
$$;

REVOKE ALL ON FUNCTION public.minta_bantuan_admin_chat(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_ambil_alih_chat(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kirim_pesan_live_chat(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_selesaikan_chat(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.minta_bantuan_admin_chat(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ambil_alih_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kirim_pesan_live_chat(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_selesaikan_chat(uuid, boolean) TO authenticated;

-- Grants pada tabel baru untuk service_role dan authenticated
GRANT ALL ON public.knowledge_sources, public.document_chunks, public.percakapan_chat, public.pesan_chat TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources, public.document_chunks TO authenticated;
GRANT SELECT, INSERT ON public.percakapan_chat TO authenticated;
GRANT SELECT ON public.pesan_chat TO authenticated;
