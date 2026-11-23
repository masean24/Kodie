import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Client anon tanpa sesi, untuk data publik (view kelas_katalog, pengajar_publik,
 * soal_minat_publik, tabel program) dan hitung_tes_minat milik tamu. Bisa dipakai di server dan browser.
 */
export function clientPublik(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
