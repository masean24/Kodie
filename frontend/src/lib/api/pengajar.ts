import type { PengajarPublik } from "@/types/database";
import { pengajarMock } from "@/lib/mock/data";
import { clientPublik } from "@/lib/supabase/publik";
import { lemparJikaError, pakaiMock } from "./sumber";

/** View `pengajar_publik` (hanya terverifikasi), untuk bagian pengajar di beranda. */
export async function ambilDaftarPengajarPublik(batas = 3): Promise<PengajarPublik[]> {
  if (pakaiMock) return pengajarMock.slice(0, batas);
  const { data, error } = await clientPublik()
    .from("pengajar_publik")
    .select("*")
    .order("jumlah_rating", { ascending: false })
    .limit(batas);
  lemparJikaError(error);
  return (data ?? []) as PengajarPublik[];
}

export async function ambilPengajarPublik(id: string): Promise<PengajarPublik | null> {
  if (pakaiMock) return pengajarMock.find((p) => p.id === id) ?? null;
  const { data, error } = await clientPublik().from("pengajar_publik").select("*").eq("id", id).maybeSingle();
  lemparJikaError(error);
  return (data as PengajarPublik | null) ?? null;
}
