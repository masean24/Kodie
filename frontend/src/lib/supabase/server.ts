import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase untuk Server Component, Server Function, dan Route Handler.
 * Buat baru untuk setiap request. `cookies()` adalah runtime API, jadi pemanggilnya harus
 * berada di dalam <Suspense>. Penyegaran sesi lewat proxy.ts menyusul di Prompt 2 (auth).
 */
export async function buatClientServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // Dipanggil dari Server Component: cookie tidak bisa ditulis di sini. Proxy yang menyegarkan sesi.
          }
        },
      },
    },
  );
}
