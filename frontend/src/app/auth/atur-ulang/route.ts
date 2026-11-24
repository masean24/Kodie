import { NextResponse, type NextRequest } from "next/server";
import { buatClientServer } from "@/lib/supabase/server";

/**
 * Tujuan tautan di email atur ulang password (`redirectTo` dari `resetPasswordForEmail`).
 * Menukar kode PKCE menjadi sesi pemulihan (cookie), lalu membuka formulir password baru.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await buatClientServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/atur-ulang-password", url.origin));
  }
  return NextResponse.redirect(new URL("/lupa-password?tautan=kedaluwarsa", url.origin));
}
