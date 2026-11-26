import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Peran } from "@/types/database";
import { pakaiMock } from "@/lib/api/sumber";
import { DASHBOARD, peranArea, rutekhususTamu } from "@/lib/peran";

/**
 * Proxy (pengganti middleware.ts di Next.js 16). Tugasnya hanya pemeriksaan cepat:
 * 1. menyegarkan sesi Supabase di cookie,
 * 2. tamu yang membuka area login diarahkan ke /masuk?lanjut=…,
 * 3. pengguna yang sudah login tidak perlu membuka /masuk dan /daftar.
 * Pemeriksaan peran yang menentukan ada di layout tiap area (lihat components/area/penjaga-area.tsx),
 * dan pengaman sebenarnya tetap RLS di backend.
 */

const COOKIE_MOCK = "kodie_mock_pengguna";

function peranMock(request: NextRequest): Peran | null | undefined {
  const nilai = request.cookies.get(COOKIE_MOCK)?.value;
  if (!nilai) return null;
  try {
    return (JSON.parse(Buffer.from(nilai, "base64url").toString("utf8")) as { peran: Peran }).peran;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // null = tamu, undefined = login tetapi peran belum diketahui dari token
  let peran: Peran | null | undefined;

  if (pakaiMock) {
    peran = peranMock(request);
  } else {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
            for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
          },
        },
      },
    );
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    peran = claims ? ((claims.user_metadata as { peran?: Peran } | undefined)?.peran ?? undefined) : null;
  }

  const path = request.nextUrl.pathname;
  const alihkan = (tujuan: URL) => {
    const r = NextResponse.redirect(tujuan);
    for (const c of response.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (peran === null && peranArea(path)) {
    const url = new URL("/masuk", request.url);
    url.searchParams.set("lanjut", path + request.nextUrl.search);
    return alihkan(url);
  }
  if (peran && rutekhususTamu(path)) {
    return alihkan(new URL(DASHBOARD[peran], request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/sehat|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
