import { cookies } from "next/headers";
import type { HasilDaftarWaitlist, WaitlistKelas } from "@/types/database";
import { buatClientServer } from "@/lib/supabase/server";
import { ambilPenggunaSaya } from "./auth";
import { lemparJikaError, pakaiMock } from "./sumber";

/**
 * Daftar tunggu kelas penuh (`waitlist_kelas`, RPC `daftar_waitlist_kelas` / `batal_waitlist_kelas`, migration 12).
 * Mode mock menyimpan antrean di cookie httpOnly per pengguna, cukup untuk mendemokan alurnya.
 */
const COOKIE_MOCK = "kodie_mock_waitlist";

async function bacaMock(): Promise<WaitlistKelas[]> {
  const c = (await cookies()).get(COOKIE_MOCK)?.value;
  if (!c) return [];
  try {
    return JSON.parse(c) as WaitlistKelas[];
  } catch {
    return [];
  }
}

async function tulisMock(daftar: WaitlistKelas[]) {
  (await cookies()).set(COOKIE_MOCK, JSON.stringify(daftar), { httpOnly: true, sameSite: "lax", path: "/" });
}

/** Antrean aktif (menunggu/diberitahu) milik pengguna yang login untuk satu kelas, atau null. */
export async function ambilWaitlistSaya(kelasId: string): Promise<WaitlistKelas | null> {
  const p = await ambilPenggunaSaya();
  if (!p) return null;
  if (pakaiMock) {
    return (await bacaMock()).find((w) => w.kelas_id === kelasId && w.status !== "dibatalkan") ?? null;
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase
    .from("waitlist_kelas")
    .select("id, kelas_id, siswa_id, status, dibuat_pada")
    .eq("kelas_id", kelasId)
    .in("status", ["menunggu", "diberitahu"])
    .order("dibuat_pada", { ascending: false })
    .limit(1)
    .maybeSingle();
  lemparJikaError(error);
  return (data as WaitlistKelas | null) ?? null;
}

export async function daftarWaitlist(kelasId: string, siswaId: string | null): Promise<HasilDaftarWaitlist> {
  if (pakaiMock) {
    const daftar = await bacaMock();
    const ada = daftar.find((w) => w.kelas_id === kelasId && w.status !== "dibatalkan");
    if (ada) return { ...ada, sudah_terdaftar: true };
    const baru: WaitlistKelas = {
      id: crypto.randomUUID(),
      kelas_id: kelasId,
      siswa_id: siswaId,
      status: "menunggu",
      dibuat_pada: new Date().toISOString(),
    };
    await tulisMock([...daftar, baru]);
    return { ...baru, sudah_terdaftar: false };
  }
  const supabase = await buatClientServer();
  const { data, error } = await supabase.rpc("daftar_waitlist_kelas", {
    p_kelas_id: kelasId,
    ...(siswaId ? { p_siswa_id: siswaId } : {}),
  });
  lemparJikaError(error);
  return data as unknown as HasilDaftarWaitlist;
}

export async function batalWaitlist(kelasId: string): Promise<void> {
  if (pakaiMock) {
    await tulisMock(
      (await bacaMock()).map((w) => (w.kelas_id === kelasId && w.status !== "dibatalkan" ? { ...w, status: "dibatalkan" } : w)),
    );
    return;
  }
  const supabase = await buatClientServer();
  const { error } = await supabase.rpc("batal_waitlist_kelas", { p_kelas_id: kelasId });
  lemparJikaError(error);
}
