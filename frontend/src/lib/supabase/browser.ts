import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase di browser. Sesi disimpan di cookie oleh @supabase/ssr. Hanya anon key. */
export function buatClientBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
