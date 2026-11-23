-- ============================================================================
-- Migration 11: Perbaikan search_path pada cari_knowledge_rag untuk operator pgvector (<=>)
-- ============================================================================

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
      (1.0 - (dc.embedding OPERATOR(extensions.<=>) v_vec))::double precision AS sim,
      row_number() OVER (ORDER BY dc.embedding OPERATOR(extensions.<=>) v_vec ASC) AS r_vec
    FROM public.document_chunks dc
    ORDER BY dc.embedding OPERATOR(extensions.<=>) v_vec ASC
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
      COALESCE(v.sim, (1.0 - (dc2.embedding OPERATOR(extensions.<=>) v_vec))::double precision) AS c_vec_sim,
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
