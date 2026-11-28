-- ============================================================================
-- Migration 13: Tambah Nilai Enum TK & Buat Enum Jenis Booking
-- Dipisah ke transaksi terpisah sebelum Migration 14 agar PostgreSQL (55P04)
-- sudah meng-commit nilai enum baru sebelum dipakai di constraint, data, dan RPC.
-- ============================================================================

ALTER TYPE public.jenjang_pendidikan ADD VALUE IF NOT EXISTS 'TK' BEFORE 'SD';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jenis_booking') THEN
    CREATE TYPE public.jenis_booking AS ENUM ('paket', 'trial');
  END IF;
END;
$$;
